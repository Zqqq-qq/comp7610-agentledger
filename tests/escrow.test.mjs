import test from "node:test";
import assert from "node:assert/strict";
import "../web/vendor/ethers.umd.min.js";
import { ESCROW_ABI, TOKEN_ABI, paymentAmount, unsigned, deliveryDigest, permittedActions, escrowService, jobFromReceipt, verifyEscrow } from "../web/escrow-core.js";
const sdk = globalThis.ethers;
const A = "0x1111111111111111111111111111111111111111", B = "0x2222222222222222222222222222222222222222";
const E = "0x3333333333333333333333333333333333333333", T = "0x4444444444444444444444444444444444444444", I = "0x5555555555555555555555555555555555555555";
const digest = "0x" + "11".repeat(32);
const base = { client: A, provider: B, providerAgentId: 7n, token: T, amount: 1000000n, submitDeadline: 2000n, reviewWindow: 60n, submittedAt: 1500n, deliverable: digest, status: 1n };
const input = { provider: B, providerAgentId: "7", amount: "1", minutes: "60", reviewWindow: "600" };
const signer = address => ({ getAddress: async () => address });
function fixture({ job = base, balance = 100000000n, allowance = 1000000n, owner = B, now = 1000 } = {}) {
  const calls = [];
  const tx = { hash: "0x" + "ab".repeat(32) };
  const escrow = { jobs: async id => { calls.push(["jobs", id]); return job; }, connect: who => ({
    createJob: async (...args) => { calls.push(["createJob", await who.getAddress(), ...args]); return tx; },
    ...Object.fromEntries(["submit", "release", "refund", "claim"].map(method => [method, async (...args) => { calls.push([method, await who.getAddress(), ...args]); return tx; }]))
  }) };
  const token = { balanceOf: async () => balance, allowance: async () => allowance, connect: who => ({ approve: async (...args) => { calls.push(["approve", await who.getAddress(), ...args]); return tx; } }) };
  const identity = { ownerOf: async id => { calls.push(["ownerOf", id]); return owner; } };
  const provider = { getBlock: async tag => { assert.equal(tag, "latest"); return { timestamp: now, number: 42 }; } };
  return { calls, tx, service: escrowService({ sdk, escrow, token, identity, provider, escrowAddress: E, tokenAddress: T }) };
}
test("payment uses 6 decimals and rejects zero, excess precision and uint256 overflow", () => {
  assert.equal(paymentAmount("1", sdk), 1000000n); assert.equal(paymentAmount("0.000001", sdk), 1n);
  for (const v of ["0", "-1", "1e6", "1,000", "0.0000001", "", "Infinity", (2n ** 256n).toString()]) assert.throws(() => paymentAmount(v, sdk));
  assert.equal(unsigned("0", "Agent", { zero: true }), 0n);
  assert.throws(() => unsigned("0", "Job ID")); assert.throws(() => unsigned(2n ** 64n, "Seconds", { bits: 64 }));
});
test("delivery accepts only a non-zero bytes32", () => {
  assert.equal(deliveryDigest(digest), digest);
  for (const v of [sdk.ZeroHash, "report.pdf", "0x11", "0x" + "gg".repeat(32)]) assert.throws(() => deliveryDigest(v));
});
test("submission allows the exact deadline; refund requires strictly later chain time", () => {
  assert.equal(permittedActions(base, B, 2000).submit, true);
  assert.equal(permittedActions(base, B, 2001).submit, false);
  assert.equal(permittedActions(base, A, 2000).refund, false);
  assert.equal(permittedActions(base, A, 2001).refund, true);
  assert.equal(permittedActions(base, A, 1000).submit, false);
});
test("claim strictly exceeds review window, release needs client, terminal tasks cannot pay twice", () => {
  const submitted = { ...base, status: 2n };
  assert.equal(permittedActions(submitted, B, 1560).claim, false);
  assert.equal(permittedActions(submitted, B, 1561).claim, true);
  assert.equal(permittedActions(submitted, A, 1500).release, true);
  assert.equal(permittedActions(submitted, B, 1500).release, false);
  assert.equal(permittedActions(submitted, A, 9999).refund, false);
  for (const status of [3n, 4n]) assert.deepEqual(permittedActions({ ...base, status }, A, 9999), { submit: false, release: false, claim: false, refund: false });
});
test("approval grants exact amount to escrow, never to B; existing allowance sends no transaction", async () => {
  const f = fixture({ allowance: 0n });
  assert.equal((await f.service.approve(signer(A), input)).tx, f.tx);
  assert.deepEqual(f.calls.find(c => c[0] === "approve"), ["approve", A, E, 1000000n]);
  const enough = fixture(); assert.equal((await enough.service.approve(signer(A), input)).tx, null);
  assert.equal(enough.calls.some(c => c[0] === "approve"), false);
});
test("funding uses A signer, B identity and latest-chain relative deadline with no ETH value", async () => {
  const f = fixture(); await f.service.create(signer(A), input);
  assert.deepEqual(f.calls.find(c => c[0] === "createJob"), ["createJob", A, B, 7n, T, 1000000n, 4600n, 600n]);
});
test("funding stops before sending for insufficient balance/allowance, self task or mismatched owner", async () => {
  for (const [options, values] of [[{ balance: 0n }, input], [{ allowance: 0n }, input], [{ owner: A }, input], [{}, { ...input, provider: A }], [{}, { ...input, minutes: "1" }], [{}, { ...input, reviewWindow: "-1" }]]) {
    const f = fixture(options); await assert.rejects(() => f.service.create(signer(A), values));
    assert.equal(f.calls.some(c => c[0] === "createJob"), false);
  }
  const f = fixture({ owner: A }); await f.service.create(signer(A), { ...input, providerAgentId: "0" });
  assert.equal(f.calls.some(c => c[0] === "ownerOf"), false);
});
test("submit re-reads task and checks B, digest, state and chain time before sending", async () => {
  const f = fixture(); await f.service.perform("submit", signer(B), "9", digest);
  assert.deepEqual(f.calls.find(c => c[0] === "submit"), ["submit", B, 9n, digest]);
  for (const [options, actor, value] of [[{}, A, digest], [{ now: 2001 }, B, digest], [{ job: { ...base, status: 2n } }, B, digest], [{}, B, sdk.ZeroHash]]) {
    const fail = fixture(options); await assert.rejects(() => fail.service.perform("submit", signer(actor), "9", value));
    assert.equal(fail.calls.some(c => c[0] === "submit"), false);
  }
});
test("settlement calls correct methods and roles; submitted tasks cannot be refunded", async () => {
  for (const [action, actor, options] of [["release", A, { job: { ...base, status: 2n } }], ["claim", B, { job: { ...base, status: 2n }, now: 1561 }], ["refund", A, { now: 2001 }]]) {
    const f = fixture(options); await f.service.perform(action, signer(actor), "9");
    assert.deepEqual(f.calls.find(c => c[0] === action), [action, actor, 9n]);
  }
  await assert.rejects(() => fixture({ job: { ...base, status: 2n }, now: 9999 }).service.perform("refund", signer(A), "9"));
  await assert.rejects(() => fixture({ job: { ...base, status: 0n } }).service.readJob("9"), /does not exist/);
});
test("Job ID is decoded from the matching emitter, ignoring a fake token event", () => {
  const iface = new sdk.Interface(ESCROW_ABI);
  const make = (address, id) => ({ address, ...iface.encodeEventLog(iface.getEvent("JobCreated"), [id, A, B, 7n, T, 1000000n, 4600n, 600n]) });
  assert.equal(jobFromReceipt({ logs: [make(T, 999n), make(E, 9n)] }, E, iface), 9n);
  assert.equal(jobFromReceipt({ logs: [make(T, 999n)] }, E, iface), null);
});
test("jobs ABI decodes named Solidity fields and calldata remains compatible", () => {
  const iface = new sdk.Interface(ESCROW_ABI);
  const encoded = iface.encodeFunctionResult("jobs", Object.values(base));
  const result = iface.decodeFunctionResult("jobs", encoded);
  assert.equal(result.provider, B); assert.equal(result.providerAgentId, 7n); assert.equal(result.status, 1n);
  const token = new sdk.Interface(TOKEN_ABI);
  assert.equal(token.decodeFunctionData("approve", token.encodeFunctionData("approve", [E, 1000000n])).spender, E);
});
test("escrow configuration is optional, but requires paired addresses, identity link and 6-decimal mUSD", async () => {
  const provider = { getCode: async () => "0x1234" };
  const config = { escrow: E, token: T, identity: I };
  const fakeSDK = (linked = I, decimals = 6, symbol = "mUSD") => ({ Contract: function(address) { return address === E ? { identity: async () => linked, nextJobId: async () => 1n } : { decimals: async () => decimals, symbol: async () => symbol, balanceOf: async () => 0n, allowance: async () => 0n }; } });
  await verifyEscrow(provider, {}, fakeSDK()); await verifyEscrow(provider, config, fakeSDK());
  await assert.rejects(() => verifyEscrow(provider, { ...config, token: "" }, fakeSDK()));
  await assert.rejects(() => verifyEscrow(provider, config, fakeSDK(A)));
  await assert.rejects(() => verifyEscrow(provider, config, fakeSDK(I, 18)));
  await assert.rejects(() => verifyEscrow(provider, config, fakeSDK(I, 6, "USDC")));
  await assert.rejects(() => verifyEscrow({ getCode: async () => "0x" }, config, fakeSDK()));
});
