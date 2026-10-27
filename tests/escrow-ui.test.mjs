import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import "../web/vendor/ethers.umd.min.js";
import { createEscrowUI } from "../web/escrow.js";
import { ESCROW_ABI } from "../web/escrow-core.js";
const sdk = globalThis.ethers;
const A = "0x1111111111111111111111111111111111111111", B = "0x2222222222222222222222222222222222222222";
const E = "0x3333333333333333333333333333333333333333", T = "0x4444444444444444444444444444444444444444";
class Element {
  value = ""; disabled = false; hidden = false; textContent = ""; children = []; events = {};
  addEventListener(name, callback) { this.events[name] = callback; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
}
function harness({ failReceipt = false, beforeFunding } = {}) {
  const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
  const elements = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m => [m[1], new Element()]));
  const $ = id => { assert.ok(elements[id], `Missing actual HTML element ${id}`); return elements[id]; };
  for (const [key, value] of Object.entries({ jobProvider: B, jobAgentId: "7", jobAmount: "1", jobMinutes: "60", jobReview: "600" })) $(key).value = value;
  const state = { account: A, busy: false, config: { escrow: E, token: T, identity: B, reputation: A, rpcUrl: "test-only" } };
  let chainTime = 1000, job = null, allowance = 0n, pending;
  const balances = { [A]: 0n, [B]: 0n, [E]: 0n }, confirmed = [], statuses = {}, calls = [], storage = new Map();
  const iface = new sdk.Interface(ESCROW_ABI);
  const tx = (logs = []) => ({ hash: "0x" + "ab".repeat(32), wait: async () => { if (failReceipt) throw new Error("Receipt reverted"); return { status: 1, hash: "0x" + "ab".repeat(32), logs, blockNumber: 42 }; } });
  const token = {
    balanceOf: async address => balances[address], allowance: async () => allowance,
    connect: actor => ({
      mint: async (to, value) => { calls.push(["mint", to, value]); balances[to] += value; return tx(); },
      approve: async (spender, value) => { calls.push(["approve", spender, value]); allowance = value; return tx(); },
    }),
  };
  const escrow = {
    interface: iface,
    jobs: async id => job && id === 42n ? { ...job } : { status: 0n },
    connect: actor => ({
      createJob: async (provider, providerAgentId, token, amount, submitDeadline, reviewWindow) => {
        const client = await actor.getAddress(); calls.push(["createJob", client, provider, amount]);
        job = { client, provider, providerAgentId, token, amount, submitDeadline, reviewWindow, submittedAt: 0n, deliverable: sdk.ZeroHash, status: 1n };
        balances[client] -= amount; balances[E] += amount; allowance -= amount;
        return tx([{ address: E, ...iface.encodeEventLog(iface.getEvent("JobCreated"), [42n, client, provider, providerAgentId, token, amount, submitDeadline, reviewWindow]) }]);
      },
      submit: async (id, digest) => { calls.push(["submit", await actor.getAddress(), id, digest]); job = { ...job, status: 2n, submittedAt: BigInt(chainTime), deliverable: digest }; return tx(); },
      release: async id => { calls.push(["release", await actor.getAddress(), id]); job = { ...job, status: 3n }; balances[E] -= job.amount; balances[B] += job.amount; return tx(); },
    }),
  };
  let ui;
  const api = {
    sdk: { ...sdk, Contract: function(address) { if (address === E) return escrow; if (address === T) return token; throw new Error(`Unexpected address ${address}`); } },
    beforeFunding,
    $, state, node: (tag, options = {}, children = []) => Object.assign(new Element(), options, { children }), explorerLink: (type, value) => `${type}:${value}`,
    status: (id, title, detail) => statuses[id] = { title, ...detail }, clearStatus: id => delete statuses[id],
    runAction(id, operation) {
      pending = (async () => { if (state.busy) return; state.busy = true; ui.render();
        try { await operation(); } catch (error) { statuses[id] = { error: true, message: error.message }; }
        finally { state.busy = false; ui.render(); }
      })(); return pending;
    },
    selectedSigner: async () => { const address = state.account; return { getAddress: async () => address }; },
    contracts: async () => ({ provider: { getBlock: async () => ({ timestamp: chainTime, number: 42 }) }, identity: { ownerOf: async () => B } }),
    confirmTransaction: async (transaction, id, label, context) => { const receipt = await transaction.wait(); assert.equal(receipt.status, 1); confirmed.push({ label, context }); return { receipt, hash: receipt.hash }; },
    configKey: config => JSON.stringify(config), openSettings: () => {}, toast: text => calls.push(["toast", text]), store: (key, value) => storage.set(key, value), readStored: (key, fallback) => storage.get(key) ?? fallback,
    setFeedbackStep: step => calls.push(["feedbackStep", step]), errorMessage: error => error.message,
  };
  ui = createEscrowUI(api); ui.bind();
  return { $, state, ui, calls, confirmed, statuses, balances, async fire(id, event = "click") { assert.ok($(id).events[event]); $(id).events[event]({ preventDefault() {}, target: $(id) }); await pending; }, setTime(value) { chainTime = value; } };
}
test("actual escrow UI handlers connect mint → approve → actual event ID → B submit → A release → B authorization", async () => {
  const h = harness();
  await h.fire("mintTestTokens"); assert.equal(h.balances[A], 100000000n);
  await h.fire("approveJob"); assert.equal(h.statuses.createJobStatus.title, "Approval confirmed");
  await h.fire("createJobForm", "submit");
  assert.equal(h.$("lookupJobId").value, "42"); assert.equal(h.$("loadedJobState").textContent, "1 · Funded");
  assert.equal(h.$("submitJob").disabled, true); assert.equal(h.$("releaseJob").disabled, true);
  h.state.account = B; h.ui.accountChanged(); assert.equal(h.$("submitJob").disabled, false);
  await h.fire("useDemoDigest"); await h.fire("submitJobForm", "submit");
  assert.equal(h.$("loadedJobState").textContent, "2 · Submitted"); assert.equal(h.$("claimJob").disabled, true);
  h.state.account = A; h.ui.accountChanged(); assert.equal(h.$("releaseJob").disabled, false);
  await h.fire("releaseJob"); assert.equal(h.$("loadedJobState").textContent, "3 · Completed"); assert.equal(h.balances[B], 1000000n);
  assert.equal(h.$("releaseJob").disabled, true); assert.equal(h.$("refundJob").disabled, true);
  const oldLocation = globalThis.location; globalThis.location = { hash: "jobs" };
  try {
    await h.fire("jobToFeedback");
    assert.equal(h.$("authAgentId").value, "7"); assert.equal(h.$("reviewerAddress").value, A); assert.equal(globalThis.location.hash, "reputation");
  } finally { if (oldLocation === undefined) delete globalThis.location; else globalThis.location = oldLocation; }
  assert.equal(h.confirmed.length, 5); assert.equal(h.confirmed.every(r => r.context.scope === "escrow"), true);
  assert.equal(h.calls.some(c => c[0] === "submit" && c[1] === B && c[2] === 42n), true);
});
test("UI rejects creation without allowance and keeps the task panel empty", async () => {
  const h = harness(); await h.fire("mintTestTokens"); await h.fire("createJobForm", "submit");
  assert.match(h.statuses.createJobStatus.message, /Approve/); assert.equal(h.$("loadedJob").hidden, true);
  assert.equal(h.calls.some(c => c[0] === "createJob"), false); assert.equal(h.state.busy, false);
});
test("failed receipts do not display a success state or enter recent confirmed transactions", async () => {
  const h = harness({ failReceipt: true }); await h.fire("mintTestTokens");
  assert.equal(h.statuses.mintStatus.error, true); assert.equal(h.confirmed.length, 0); assert.equal(h.state.busy, false);
  assert.equal(h.$("mintTestTokens").disabled, false);
});

test("source-team validation can stop approval and creation before any funding transaction", async()=>{
 const h=harness({beforeFunding:async()=>{throw new Error('Provider does not match source team');}});
 await h.fire('mintTestTokens');await h.fire('approveJob');
 assert.match(h.statuses.createJobStatus.message,/source team/);
 assert.equal(h.calls.some(c=>c[0]==='approve'),false);
 await h.fire('createJobForm','submit');assert.equal(h.calls.some(c=>c[0]==='createJob'),false);
});
