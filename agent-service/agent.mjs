// Sample Agent service: serves its agent card, watches JobEscrow for funded jobs addressed to its wallet,
// produces a result document, submits the document's Keccak-256 digest, and sells single calls over HTTP 402.
// The "work" is a deterministic placeholder; replace `work` / `run` with a real model call.
import { buildCard } from "../web/agent-card.js";
import { ESCROW_ABI } from "../web/escrow-core.js";
import { X402_SCHEME, X402_VERSION, decodePayment } from "../web/x402.js";

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const IDENTITY_ABI = ["function ownerOf(uint256) view returns (address)"];

export function defaultWork(job, agent) {
  return { kind: "agentledger-result-v1", jobId: job.id.toString(), agentId: agent.agentId.toString(), agent: agent.name, client: job.client, escrowedBaseUnits: job.amount.toString(),
    output: `Job #${job.id} was processed by ${agent.name}. Replace defaultWork() with the real task to deliver useful output.` };
}
export function defaultRun(input) {
  const text = String(input ?? "").slice(0, 500);
  return { input: text, characters: [...text].length, words: text.trim() ? text.trim().split(/\s+/).length : 0, upper: text.toUpperCase() };
}

export async function createAgent({ sdk, provider, signer, escrowAddress, tokenAddress, identityAddress, agentId, name = "AgentLedger sample agent", description = "Sample agent that completes escrow jobs automatically and sells single calls over HTTP 402.", publicUrl, price = "1", callPrice = "0.1", skills = "demo, automation", submitMinutes = 60, reviewWindowSeconds = 600, scanWindow = 50, paymentMaxAge = 3600, work = defaultWork, run = defaultRun, log = () => {} }) {
  const wallet = await signer.getAddress();
  const chainId = Number((await provider.getNetwork()).chainId);
  const id = BigInt(agentId);
  if (id === 0n) throw new Error("AGENT_ID must be a registered Agent ID owned by the service wallet.");
  const owner = await new sdk.Contract(identityAddress, IDENTITY_ABI, provider).ownerOf(id);
  if (owner.toLowerCase() !== wallet.toLowerCase()) throw new Error(`Agent #${id} is owned by ${owner}, not the service wallet ${wallet}.`);
  const escrow = new sdk.Contract(escrowAddress, ESCROW_ABI, signer);
  const base = new URL(publicUrl).href;
  const card = buildCard({ name, description, endpoint: base, skills, price, submitMinutes, reviewWindowSeconds, x402: new URL("x402/run", base).href, x402Price: callPrice });
  const callAmount = sdk.parseUnits(callPrice, 6);
  const results = new Map(), handled = new Set(), usedPayments = new Set();
  const self = { wallet, agentId: id, name };

  async function poll() {
    const next = BigInt(await escrow.nextJobId()), block = await provider.getBlock("latest"), submitted = [];
    const from = next - 1n - BigInt(scanWindow) > 0n ? next - BigInt(scanWindow) : 1n;
    for (let jobId = from; jobId < next; jobId++) {
      if (handled.has(jobId)) continue;
      const raw = await escrow.jobs(jobId);
      if (raw.provider.toLowerCase() !== wallet.toLowerCase()) { handled.add(jobId); continue; }
      if (Number(raw.status) !== 1) { handled.add(jobId); continue; }
      if (raw.providerAgentId !== id) { handled.add(jobId); log(`skip job ${jobId}: linked to Agent #${raw.providerAgentId}`); continue; }
      if (BigInt(block.timestamp) > raw.submitDeadline) { handled.add(jobId); log(`skip job ${jobId}: deadline passed`); continue; }
      const job = { id: jobId, client: raw.client, amount: raw.amount, submitDeadline: raw.submitDeadline };
      const body = JSON.stringify(await work(job, self), null, 2) + "\n";
      const digest = sdk.keccak256(sdk.toUtf8Bytes(body));
      results.set(jobId.toString(), body);
      // Not marked handled until the receipt succeeds, so a failed submit is retried on the next poll.
      const receipt = await (await escrow.submit(jobId, digest)).wait(1);
      if (receipt?.status !== 1) throw new Error(`submit(${jobId}) failed`);
      handled.add(jobId); submitted.push({ jobId, digest, transaction: receipt.hash });
      log(`submitted job ${jobId} digest ${digest} tx ${receipt.hash}`);
    }
    return submitted;
  }

  function requirement(resource) {
    return { scheme: X402_SCHEME, network: `eip155:${chainId}`, asset: tokenAddress, payTo: wallet, maxAmountRequired: callAmount.toString(), resource, description: `One call to ${name}`, maxTimeoutSeconds: paymentMaxAge };
  }
  async function verifyPayment(header) {
    const { network, transaction } = decodePayment(header);
    if (network !== `eip155:${chainId}`) throw new Error("payment is for another network");
    if (usedPayments.has(transaction)) throw new Error("payment already used");
    // Reserve the hash before awaiting so two concurrent requests cannot spend one payment.
    usedPayments.add(transaction);
    try { return await checkPayment(transaction); } catch (error) { usedPayments.delete(transaction); throw error; }
  }
  async function checkPayment(transaction) {
    const [receipt, tx] = await Promise.all([provider.getTransactionReceipt(transaction), provider.getTransaction(transaction)]);
    if (!receipt || receipt.status !== 1 || !tx) throw new Error("payment transaction not confirmed");
    const block = await provider.getBlock(receipt.blockNumber), latest = await provider.getBlock("latest");
    if (latest.timestamp - block.timestamp > paymentMaxAge) throw new Error("payment is too old");
    // Only a transfer signed by the payer counts; escrow payouts to this wallet must not unlock calls.
    const paid = receipt.logs.some(l => l.address.toLowerCase() === tokenAddress.toLowerCase() && l.topics[0] === TRANSFER_TOPIC
      && sdk.getAddress("0x" + l.topics[1].slice(26)) === sdk.getAddress(tx.from) && sdk.getAddress("0x" + l.topics[2].slice(26)) === sdk.getAddress(wallet) && BigInt(l.data) >= callAmount);
    if (!paid) throw new Error("no matching mUSD transfer to the agent wallet");
    return { transaction, payer: tx.from };
  }

  async function handle(req, res) {
    const url = new URL(req.url, base);
    const send = (status, body, headers = {}) => { res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "X-PAYMENT", "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE", "Cache-Control": "no-store", ...headers }); res.end(typeof body === "string" ? body : JSON.stringify(body)); };
    try {
      if (req.method === "OPTIONS") return send(204, "");
      if (req.method !== "GET") return send(405, { error: "GET only" });
      if (url.pathname === "/.well-known/agent-card.json" || url.pathname === "/") return send(200, card);
      if (url.pathname === "/health") return send(200, { ok: true, wallet, agentId: id.toString(), handledJobs: handled.size });
      const result = url.pathname.match(/^\/results\/(\d{1,30})$/);
      if (result) return results.has(result[1]) ? send(200, results.get(result[1])) : send(404, { error: "no result for this job on this service" });
      if (url.pathname === "/x402/run") {
        const header = req.headers["x-payment"];
        if (!header) return send(402, { x402Version: X402_VERSION, error: "payment required", accepts: [requirement(url.href)] });
        let payment;
        try { payment = await verifyPayment(header); } catch (error) { return send(402, { x402Version: X402_VERSION, error: String(error.message || error), accepts: [requirement(url.href)] }); }
        const settlement = btoa(JSON.stringify({ success: true, transaction: payment.transaction, network: `eip155:${chainId}`, payer: payment.payer }));
        return send(200, { result: await run(url.searchParams.get("input"), payment), payment }, { "X-PAYMENT-RESPONSE": settlement });
      }
      return send(404, { error: "not found" });
    } catch (error) { log(`request error: ${error.message}`); return send(500, { error: "internal error" }); }
  }
  return { card, poll, handle, results, wallet };
}
