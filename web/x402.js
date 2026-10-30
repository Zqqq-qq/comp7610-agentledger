// Minimal HTTP 402 pay-per-call flow, modelled on x402 but simplified for MockUSDC (which has no EIP-3009
// transferWithAuthorization): the payer sends a normal ERC-20 transfer, then retries the request with its hash.
// The server must check the receipt, recipient, amount, payer and freshness, and accept each hash only once.
export const X402_VERSION = 1;
export const X402_SCHEME = "agentledger-erc20-transfer";
const TRANSFER_ABI = ["function transfer(address to,uint256 value) returns (bool)", "function balanceOf(address) view returns (uint256)"];
const same = (a, b) => !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase();

export function chooseRequirement(body, { chainId, token, expectedPayTo, maxAmount = 100_000_000n }) {
  const offers = Array.isArray(body?.accepts) ? body.accepts : [];
  const offer = offers.find(o => o?.scheme === X402_SCHEME && o.network === `eip155:${chainId}`);
  if (!offer) throw new Error("The service did not offer a supported payment on this network.");
  if (!same(offer.asset, token)) throw new Error("The service asks for a token other than the configured mUSD.");
  if (!/^0x[0-9a-fA-F]{40}$/.test(offer.payTo || "") || /^0x0{40}$/i.test(offer.payTo)) throw new Error("The service gave an invalid payment address.");
  if (expectedPayTo && !same(offer.payTo, expectedPayTo)) throw new Error("The payment address is not the agent's on-chain owner. Payment was not sent.");
  if (!/^[1-9]\d{0,30}$/.test(String(offer.maxAmountRequired))) throw new Error("The service gave an invalid price.");
  const amount = BigInt(offer.maxAmountRequired);
  if (amount > maxAmount) throw new Error("The requested price exceeds the 100 mUSD safety limit for one call.");
  return { scheme: offer.scheme, network: offer.network, asset: offer.asset, payTo: offer.payTo, amount, resource: String(offer.resource || ""), description: String(offer.description || "").slice(0, 200) };
}
export function encodePayment(transaction, requirement) {
  return btoa(JSON.stringify({ x402Version: X402_VERSION, scheme: requirement.scheme, network: requirement.network, payload: { transaction } }));
}
export function decodePayment(header) {
  let data;
  try { data = JSON.parse(atob(String(header || ""))); } catch { throw new Error("Malformed X-PAYMENT header."); }
  if (data?.x402Version !== X402_VERSION || data.scheme !== X402_SCHEME || !/^0x[0-9a-fA-F]{64}$/.test(data.payload?.transaction || "")) throw new Error("Unsupported X-PAYMENT payload.");
  return { network: String(data.network), transaction: data.payload.transaction.toLowerCase() };
}

async function readJson(response) {
  const text = await response.text();
  if (text.length > 256 * 1024) throw new Error("The service response exceeds 256 KB.");
  try { return JSON.parse(text); } catch { return { text }; }
}
export async function payPerCall({ url, signer, sdk, token, chainId, expectedPayTo, confirm = () => true, onPayment, fetchImpl = fetch }) {
  const options = { credentials: "omit", referrerPolicy: "no-referrer" };
  const first = await fetchImpl(url, options);
  if (first.status !== 402) {
    if (!first.ok) throw new Error(`The service returned HTTP ${first.status}.`);
    return { paid: false, body: await readJson(first) };
  }
  const requirement = chooseRequirement(await readJson(first), { chainId, token, expectedPayTo });
  if (!await confirm(requirement)) throw Object.assign(new Error("Payment cancelled. Nothing was sent."), { code: "ACTION_REJECTED" });
  const erc20 = new sdk.Contract(token, TRANSFER_ABI, signer);
  if (await erc20.balanceOf(await signer.getAddress()) < requirement.amount) throw new Error("Not enough mUSD for this call. Mint test tokens first.");
  const tx = await erc20.transfer(requirement.payTo, requirement.amount);
  onPayment?.(tx.hash);
  const receipt = await tx.wait(1);
  if (receipt?.status !== 1) throw new Error("The mUSD transfer did not succeed.");
  const second = await fetchImpl(url, { ...options, headers: { "X-PAYMENT": encodePayment(receipt.hash || tx.hash, requirement) } });
  const body = await readJson(second);
  if (!second.ok) throw new Error(`Paid (${receipt.hash || tx.hash}) but the service returned HTTP ${second.status}: ${String(body.error || body.text || "").slice(0, 160)}`);
  return { paid: true, paymentHash: receipt.hash || tx.hash, body, settlement: second.headers.get("X-PAYMENT-RESPONSE") };
}
