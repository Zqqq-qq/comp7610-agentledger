export const FEEDBACK_TYPES = Object.freeze({ FeedbackAuth: [
  { name: "agentId", type: "uint256" }, { name: "client", type: "address" },
  { name: "expiry", type: "uint64" }, { name: "nonce", type: "bytes32" },
] });

export function domainFor(chainId, reputation) {
  return { name: "ArcAgentReputation", version: "1", chainId, verifyingContract: reputation };
}
export function agentId(value) {
  const text = String(value).trim();
  if (!/^[1-9]\d*$/.test(text) || BigInt(text) >= 2n ** 256n) throw new Error("Enter a positive Agent ID.");
  return BigInt(text);
}
export function scoreValue(value) {
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) throw new Error("The score must be a whole number from 0 to 100.");
  const score = Number(text);
  if (score > 100) throw new Error("The score must be a whole number from 0 to 100.");
  return score;
}
export function cardUri(value, { optional = false } = {}) {
  const text = String(value).trim();
  if (!text && optional) return "";
  let uri;
  try { uri = new URL(text); } catch { throw new Error("Enter a complete HTTPS, HTTP or IPFS URI."); }
  if (!["https:", "http:", "ipfs:"].includes(uri.protocol)) throw new Error("Use an HTTPS, HTTP or IPFS URI.");
  if (uri.username || uri.password) throw new Error("Do not include credentials in a public URI.");
  return text;
}
export function safeLink(value) {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}
export function tagValue(value) {
  const tag = String(value).trim();
  if (new TextEncoder().encode(tag).length > 31) throw new Error("Keep the tag within 31 UTF-8 bytes. A short English label works well.");
  return tag;
}
export function parseAuthorization(raw, { chainId, reputation, now = Math.floor(Date.now() / 1000) } = {}) {
  if (typeof raw !== "string" || raw.length > 65536) throw new Error("Paste a valid authorization JSON (up to 64 KB).");
  let auth;
  try { auth = JSON.parse(raw); } catch { throw new Error("The authorization is not valid JSON."); }
  if (!auth || Array.isArray(auth) || typeof auth !== "object") throw new Error("The authorization must be a JSON object.");
  // Reject lossy JSON numbers; string IDs preserve the full Solidity uint256 range.
  if (typeof auth.agentId === "number" && !Number.isSafeInteger(auth.agentId)) throw new Error("Use a string for an Agent ID larger than the safe JSON integer range.");
  const id = agentId(auth.agentId);
  if (!/^0x[0-9a-fA-F]{40}$/.test(auth.client || "")) throw new Error("The authorization has an invalid reviewer address.");
  if (!Number.isSafeInteger(auth.expiry) || auth.expiry <= now) throw new Error("This authorization has expired or has an invalid expiry. Request a new one.");
  if (!/^0x[0-9a-fA-F]{64}$/.test(auth.nonce || "")) throw new Error("The authorization nonce must be 32 bytes.");
  if (!/^0x[0-9a-fA-F]{130}$/.test(auth.signature || "")) throw new Error("The authorization signature must be 65 bytes.");
  if (auth.chainId !== undefined && Number(auth.chainId) !== chainId) throw new Error("This authorization belongs to a different network.");
  if (auth.verifyingContract !== undefined && String(auth.verifyingContract).toLowerCase() !== String(reputation).toLowerCase()) throw new Error("This authorization belongs to a different reputation contract.");
  return { ...auth, agentId: id.toString() };
}
export function chooseAccount(accounts, preferred = "") {
  const valid = accounts.filter(a => /^0x[0-9a-fA-F]{40}$/.test(a));
  return valid.find(a => a.toLowerCase() === preferred.toLowerCase()) || valid[0] || "";
}
export async function requestAccounts(ethereum, reselect = false) {
  if (!ethereum?.request) throw new Error("Open this page in Chrome or Edge with MetaMask installed.");
  if (reselect) await ethereum.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  if (!Array.isArray(accounts) || !accounts.length) throw new Error("No account was authorized. Select an account in your wallet.");
  return accounts;
}
export function shortAddress(value = "", prefix = 6, suffix = 4) {
  return value ? `${value.slice(0, prefix)}…${value.slice(-suffix)}` : "Not connected";
}
export function errorMessage(error) {
  const code = error?.code ?? error?.info?.error?.code;
  if (code === 4001 || code === "ACTION_REJECTED") return "Request cancelled in your wallet. No action was completed.";
  if (code === -32002) return "A wallet request is already open. Finish or dismiss it in MetaMask first.";
  const text = String(error?.reason || error?.shortMessage || error?.info?.error?.message || error?.message || error);
  const hints = [
    ["transferfrom failed", "Token funding failed. Check the client's mUSD balance and allowance for this JobEscrow address."],
    ["deadline in past", "The submission deadline passed before confirmation. Create again with more submission time."],
    ["submit deadline passed", "The on-chain submission deadline has passed. The client can request an eligible refund."],
    ["review window open", "The chain has not passed the review window. Wait for a later block, then refresh and retry."],
    ["self feedback", "An agent owner cannot review their own agent. Select the reviewer account."],
    ["nonce used", "This authorization has already been used. Ask the owner to sign a new one."],
    ["auth expired", "This authorization has expired. Ask the owner to sign a new one."],
    ["auth not signed", "The authorization was not signed by the current agent owner. Check the network and contract addresses."],
    ["insufficient funds", "The selected account needs Sepolia ETH to pay the transaction fee."],
    ["no such agent", "This Agent ID does not exist in the configured identity registry."],
    ["join circle first", "Join this circle before posting or replying — the contract only accepts members."],
    ["only invited partner", "Only the wallet that was invited can answer this team invitation. Switch to that account."],
    ["only other member", "The member who proposed a work cannot confirm it. The other team member must confirm."],
    ["work not pending", "This work is no longer awaiting a reply — it has already been confirmed or rejected. Refresh to see the current state."],
    ["team not pending", "This invitation has already been answered or cancelled. Refresh to see the current state."],
    ["review pending work first", "Resolve the pending work proposal before proposing another one."],
    ["not agent owner", "The selected account does not own this Agent NFT. Publish as your wallet (Agent ID 0) or switch accounts."],
    ["invalid partner", "Pick a different partner wallet — it cannot be your own address or the zero address."],
    ["task post required", "Invite a partner from an open task post, not from a discussion."],
    ["membership unchanged", "You are already in the state you asked for. Refresh to see the current circles."],
    ["team not active", "This team is not active yet. The invited wallet must accept before anyone can propose work."],
    ["not team member", "Only the two wallets recorded on this team can propose its work. Switch to the host or partner account."],
    ["only pending host", "Only the host can cancel, and only while the invitation is still pending. Refresh to see its state."],
    ["invalid text length", "A text field is empty or longer than the contract allows (measured in UTF-8 bytes). Shorten it and try again."],
    ["follow unchanged", "You already follow (or have already unfollowed) this wallet. Refresh to see the current state."],
    ["agent/provider mismatch", "The provider Agent ID is not owned by the provider wallet. Use Hire this agent, or check the owner in the registry."],
    ["self job", "The paying client and the provider must be different wallets. Switch to the client account."],
    ["not provider", "Only the provider wallet of this task can submit or claim. Switch to that account."],
    ["not client", "Only the client wallet that paid for this task can release or refund. Switch to that account."],
    ["not submitted", "Nothing has been submitted for this task yet, or it is already settled. Refresh the task."],
    ["not refundable", "This task can no longer be refunded: it was delivered or already settled. Refresh the task."],
    ["deadline not passed", "The submission deadline has not passed on-chain yet, so a refund is not available. Wait, then refresh."],
  ];
  return hints.find(([needle]) => text.toLowerCase().includes(needle))?.[1] || text.slice(0, 230);
}
