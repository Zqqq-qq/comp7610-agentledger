import test from "node:test";
import assert from "node:assert/strict";
import { agentId, scoreValue, cardUri, safeLink, tagValue, parseAuthorization, chooseAccount, requestAccounts, domainFor, FEEDBACK_TYPES } from "../web/core.js";
import "../web/vendor/ethers.umd.min.js";

const sdk = globalThis.ethers;
const A = "0x1111111111111111111111111111111111111111";
const B = "0x2222222222222222222222222222222222222222";
const R = "0x3333333333333333333333333333333333333333";
const baseline = { agentId: "1", client: B, expiry: 2000000000, nonce: "0x" + "ab".repeat(32), signature: "0x" + "01".repeat(65), chainId: 11155111, verifyingContract: R };
const context = { chainId: 11155111, reputation: R, now: 1900000000 };

test("feedback rejects a different network, contract, expiry or malformed authorization", () => {
  assert.equal(parseAuthorization(JSON.stringify(baseline), context).agentId, "1");
  for (const patch of [{ chainId: 5042002 }, { verifyingContract: A }, { expiry: 1800000000 }, { expiry: "2000000000" }, { nonce: "0x12" }, { signature: "0x12" }, { client: "not-an-address" }]) {
    assert.throws(() => parseAuthorization(JSON.stringify({ ...baseline, ...patch }), context));
  }
  assert.throws(() => parseAuthorization("[]", context));
  assert.throws(() => parseAuthorization("not JSON", context));
});
test("original authorization JSON remains compatible; unsafe numeric IDs are rejected", () => {
  const { chainId, verifyingContract, ...legacy } = baseline;
  assert.equal(parseAuthorization(JSON.stringify(legacy), context).client, B);
  assert.throws(() => parseAuthorization(JSON.stringify({ ...baseline, agentId: Number.MAX_SAFE_INTEGER + 2 }), context));
  const large = (2n ** 200n).toString();
  assert.equal(parseAuthorization(JSON.stringify({ ...baseline, agentId: large }), context).agentId, large);
  assert.throws(() => agentId(0));
  assert.throws(() => agentId((2n ** 256n).toString()));
});
test("score and tag boundaries match the unchanged contract and bytes32 encoding", () => {
  assert.equal(scoreValue("0"), 0); assert.equal(scoreValue("100"), 100);
  for (const invalid of ["", "NaN", "90.5", "-1", "101", "Infinity"]) assert.throws(() => scoreValue(invalid));
  assert.equal(tagValue("a".repeat(31)).length, 31);
  assert.throws(() => tagValue("a".repeat(32)));
  assert.throws(() => tagValue("中".repeat(11)));
});
test("metadata links cannot execute script or embed credentials", () => {
  assert.equal(cardUri("ipfs://bafyexample/card.json"), "ipfs://bafyexample/card.json");
  assert.equal(cardUri("", { optional: true }), "");
  assert.throws(() => cardUri("javascript:alert(1)"));
  assert.throws(() => cardUri("https://user:password@example.com/card.json"));
  assert.equal(safeLink("javascript:alert(1)"), null);
  assert.equal(safeLink("https://example.com/card.json"), "https://example.com/card.json");
});
test("selecting B is preserved even when the wallet returns A first", () => {
  assert.equal(chooseAccount([A, B], B), B);
  assert.equal(chooseAccount([B, A], B), B);
  assert.equal(chooseAccount([A], B), A);
  assert.equal(chooseAccount([], B), "");
});
test("choose-another-account requests wallet permission rather than silently reusing A", async () => {
  const requests = [];
  const ethereum = { async request(payload) { requests.push(payload); return payload.method === "eth_requestAccounts" ? [A, B] : []; } };
  assert.deepEqual(await requestAccounts(ethereum, true), [A, B]);
  assert.deepEqual(requests.map(r => r.method), ["wallet_requestPermissions", "eth_requestAccounts"]);
  assert.deepEqual(requests[0].params, [{ eth_accounts: {} }]);
  await assert.rejects(() => requestAccounts({ request: async () => { throw Object.assign(new Error("cancelled"), { code: 4001 }); } }, true));
});
test("Ethers uses the explicitly chosen B signer, not the first authorized A", async () => {
  const provider = new sdk.BrowserProvider({ async request({ method }) {
    if (method === "eth_accounts") return [A, B];
    if (method === "eth_chainId") return "0xaa36a7";
    throw new Error(`Unexpected test RPC: ${method}`);
  } }, "any");
  try { assert.equal((await (await provider.getSigner(B)).getAddress()).toLowerCase(), B.toLowerCase()); }
  finally { provider.destroy(); }
});
test("EIP-712 is compatible with the original domain and binds both chain and contract", async () => {
  const wallet = sdk.Wallet.createRandom();
  const value = { agentId: 1n, client: B, expiry: 2000000000, nonce: baseline.nonce };
  const domain = domainFor(11155111, R);
  assert.equal(domain.name, "ArcAgentReputation");
  const signature = await wallet.signTypedData(domain, FEEDBACK_TYPES, value);
  assert.equal(sdk.verifyTypedData(domain, FEEDBACK_TYPES, value, signature), wallet.address);
  assert.notEqual(sdk.verifyTypedData(domainFor(5042002, R), FEEDBACK_TYPES, value, signature), wallet.address);
  assert.notEqual(sdk.verifyTypedData(domainFor(11155111, A), FEEDBACK_TYPES, value, signature), wallet.address);
});
