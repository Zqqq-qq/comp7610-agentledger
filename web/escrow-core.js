// ABI and validation for the existing, unchanged Solidity contracts.
export const ESCROW_ABI = [
  "function identity() view returns (address)",
  "function nextJobId() view returns (uint256)",
  "function createJob(address provider,uint256 providerAgentId,address token,uint256 amount,uint64 submitDeadline,uint64 reviewWindow) returns (uint256)",
  "function jobs(uint256) view returns (address client,address provider,uint256 providerAgentId,address token,uint256 amount,uint64 submitDeadline,uint64 reviewWindow,uint64 submittedAt,bytes32 deliverable,uint8 status)",
  "function submit(uint256 jobId,bytes32 deliverable)",
  "function release(uint256 jobId)",
  "function refund(uint256 jobId)",
  "function claim(uint256 jobId)",
  "event JobCreated(uint256 indexed jobId,address indexed client,address indexed provider,uint256 providerAgentId,address token,uint256 amount,uint64 submitDeadline,uint64 reviewWindow)",
];
export const TOKEN_ABI = [
  "function decimals() view returns (uint8)", "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address spender,uint256 value) returns (bool)",
  "function mint(address to,uint256 value)",
];
export const JOB_STATUS = ["None", "Funded", "Submitted", "Completed", "Refunded"];
export const sameAddress = (a, b) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
export function unsigned(value, label, { zero = false, bits = 256 } = {}) {
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) throw new Error(`${label} must be a whole number.`);
  const n = BigInt(text);
  if ((!zero && n === 0n) || n >= 2n ** BigInt(bits)) throw new Error(`${label} is outside the supported range.`);
  return n;
}
export function paymentAmount(value, sdk) {
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,6})?$/.test(text)) throw new Error("Enter a positive mUSD amount with at most 6 decimal places.");
  const amount = sdk.parseUnits(text, 6);
  if (amount <= 0n || amount >= 2n ** 256n) throw new Error("The mUSD amount is outside the supported range.");
  return amount;
}
export function deliveryDigest(value) {
  const digest = String(value).trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(digest) || /^0x0{64}$/.test(digest)) throw new Error("Enter a non-zero bytes32 digest: 0x followed by 64 hexadecimal characters.");
  return digest;
}
export function permittedActions(job, actor, chainTime) {
  const status = Number(job.status), now = BigInt(chainTime);
  return {
    submit: status === 1 && sameAddress(actor, job.provider) && now <= BigInt(job.submitDeadline),
    release: status === 2 && sameAddress(actor, job.client),
    refund: status === 1 && sameAddress(actor, job.client) && now > BigInt(job.submitDeadline),
    claim: status === 2 && sameAddress(actor, job.provider) && now > BigInt(job.submittedAt) + BigInt(job.reviewWindow),
  };
}
export function jobFromReceipt(receipt, escrowAddress, contractInterface) {
  for (const log of receipt.logs) {
    if (!sameAddress(log.address, escrowAddress)) continue;
    try { const event = contractInterface.parseLog(log); if (event?.name === "JobCreated") return event.args.jobId; } catch { /* Other escrow events. */ }
  }
  return null;
}
export async function verifyEscrow(provider, config, sdk) {
  if (!config.escrow && !config.token) return;
  if (!config.escrow || !config.token) throw new Error("Enter both JobEscrow and MockUSDC addresses, or leave both empty.");
  const [escrowCode, tokenCode] = await Promise.all([provider.getCode(config.escrow), provider.getCode(config.token)]);
  if (escrowCode === "0x" || tokenCode === "0x") throw new Error("JobEscrow or MockUSDC has no deployed code on Sepolia.");
  const escrow = new sdk.Contract(config.escrow, ESCROW_ABI, provider), token = new sdk.Contract(config.token, TOKEN_ABI, provider);
  const [linked, decimals, symbol] = await Promise.all([escrow.identity(), token.decimals(), token.symbol(), escrow.nextJobId(), token.balanceOf(config.escrow), token.allowance(config.escrow, config.escrow)]);
  if (!sameAddress(linked, config.identity)) throw new Error("JobEscrow is linked to a different IdentityRegistry.");
  if (Number(decimals) !== 6 || symbol !== "mUSD") throw new Error("Use the supplied 6-decimal mUSD MockUSDC deployment for this demo.");
}

// Dependency injection lets tests exercise the exact transaction paths without a user's wallet.
export function escrowService({ sdk, escrow, token, identity, provider, escrowAddress, tokenAddress }) {
  async function latestBlock() {
    const block = await provider.getBlock("latest");
    if (!block) throw new Error("Could not read the latest Sepolia block. Try Refresh again.");
    return block;
  }
  async function fundingPlan(sender, input) {
    const serviceProvider = sdk.getAddress(String(input.provider).trim());
    if (serviceProvider === sdk.ZeroAddress || sameAddress(sender, serviceProvider)) throw new Error("Choose a non-zero provider address different from the paying client.");
    const providerAgentId = unsigned(input.providerAgentId, "Provider Agent ID", { zero: true });
    const amount = paymentAmount(input.amount, sdk);
    const minutes = unsigned(input.minutes, "Submission time in minutes");
    if (minutes < 2n || minutes > 10080n) throw new Error("Choose a submission time from 2 to 10080 minutes.");
    const reviewWindow = unsigned(input.reviewWindow, "Review window", { bits: 64 });
    if (providerAgentId !== 0n && !sameAddress(await identity.ownerOf(providerAgentId), serviceProvider)) throw new Error("The Provider Agent ID must be owned by the provider wallet B.");
    const [balance, allowance, block] = await Promise.all([token.balanceOf(sender), token.allowance(sender, escrowAddress), latestBlock()]);
    if (balance < amount) throw new Error("The paying client does not have enough mUSD. Mint test tokens first.");
    const deadline = BigInt(block.timestamp) + minutes * 60n;
    unsigned(deadline, "Submission deadline", { bits: 64 });
    return { amount, balance, allowance, args: [serviceProvider, providerAgentId, tokenAddress, amount, deadline, reviewWindow] };
  }
  async function readJob(idValue) {
    const id = unsigned(idValue, "Job ID");
    const [raw, block] = await Promise.all([escrow.jobs(id), latestBlock()]);
    if (Number(raw.status) === 0) throw new Error("This Job ID does not exist in the configured escrow contract.");
    const job = { id };
    for (const key of ["client", "provider", "providerAgentId", "token", "amount", "submitDeadline", "reviewWindow", "submittedAt", "deliverable", "status"]) job[key] = raw[key];
    return { job, chainTime: block.timestamp, blockNumber: block.number };
  }
  return {
    fundingPlan, readJob,
    async approve(signer, input) {
      const plan = await fundingPlan(await signer.getAddress(), input);
      if (plan.allowance >= plan.amount) return { ...plan, tx: null };
      return { ...plan, tx: await token.connect(signer).approve(escrowAddress, plan.amount) };
    },
    async create(signer, input) {
      const plan = await fundingPlan(await signer.getAddress(), input);
      if (plan.allowance < plan.amount) throw new Error("Approve this amount for JobEscrow first, then create the job.");
      return escrow.connect(signer).createJob(...plan.args);
    },
    async perform(action, signer, idValue, digestValue) {
      if (!["submit", "release", "refund", "claim"].includes(action)) throw new Error("Unknown escrow action.");
      const snapshot = await readJob(idValue);
      const actor = await signer.getAddress();
      if (!permittedActions(snapshot.job, actor, snapshot.chainTime)[action]) throw new Error(`Cannot ${action}: check the selected account, task status and on-chain deadline. Refresh the job for its current details.`);
      return action === "submit" ? escrow.connect(signer).submit(snapshot.job.id, deliveryDigest(digestValue)) : escrow.connect(signer)[action](snapshot.job.id);
    },
  };
}
