import { ESCROW_ABI, TOKEN_ABI, JOB_STATUS, escrowService, permittedActions, sameAddress, jobFromReceipt } from "./escrow-core.js";

export function createEscrowUI(api) {
  const { sdk, $, state, node, explorerLink, status, clearStatus, runAction, selectedSigner, contracts, confirmTransaction, configKey, openSettings, toast, store, readStored, setFeedbackStep } = api;
  let loaded = null, balanceGeneration = 0;
  const ready = () => !!state.config.escrow && !!state.config.token;
  const format = value => `${sdk.formatUnits(value, 6)} mUSD`;
  const date = value => new Date(Number(value) * 1000).toLocaleString();
  const controls = ["mintTestTokens", "approveJob", "createJob", "lookupJob", "refreshToken", "submitJob", "releaseJob", "refundJob", "claimJob", "jobToFeedback"];
  const lastJobKey = () => `agent-ledger.last-job.11155111.${state.config.escrow.toLowerCase()}`;
  const input = () => ({ provider: $("jobProvider").value, providerAgentId: $("jobAgentId").value, amount: $("jobAmount").value, minutes: $("jobMinutes").value, reviewWindow: $("jobReview").value });
  async function environment() {
    if (!ready()) { openSettings(); throw new Error("Add your deployed JobEscrow and MockUSDC addresses in Contracts first."); }
    const { provider, identity } = await contracts();
    const config = { ...state.config };
    const escrow = new sdk.Contract(config.escrow, ESCROW_ABI, provider);
    const token = new sdk.Contract(config.token, TOKEN_ABI, provider);
    const service = escrowService({ sdk, escrow, token, identity, provider, escrowAddress: config.escrow, tokenAddress: config.token });
    return { provider, identity, escrow, token, service, config };
  }
  async function transactionContext(env) {
    const signer = await selectedSigner();
    return { signer, context: { ...env.config, sender: await signer.getAddress(), scope: "escrow" } };
  }
  function render() {
    $("escrowSetup").hidden = ready();
    $("jobActiveAccount").textContent = state.account || "Not connected";
    $("fundingSummary").textContent = `Active client: ${state.account || "connect A"}. Payment: ${$("jobAmount").value || "—"} mUSD to escrow for ${$("jobProvider").value || "provider B"}, Agent ID ${$("jobAgentId").value || "—"}. Approval does not move funds.`;
    for (const id of controls) $(id).disabled = state.busy || !ready();
    for (const id of ["mintTestTokens", "approveJob", "createJob"]) $(id).disabled ||= !state.account;
    $("loadedJob").hidden = !loaded; $("jobEmpty").hidden = !!loaded;
    for (const id of ["submitJob", "releaseJob", "refundJob", "claimJob", "jobToFeedback"]) $(id).disabled = true;
    if (!loaded) return;
    const { job, chainTime } = loaded;
    const permissions = permittedActions(job, state.account, chainTime);
    for (const action of ["submit", "release", "refund", "claim"]) $(`${action}Job`).disabled = state.busy || !permissions[action];
    $("jobToFeedback").disabled = state.busy || Number(job.status) !== 3 || job.providerAgentId === 0n;
    $("jobRole").textContent = sameAddress(state.account, job.client) ? "Your role: client A. Accept delivery or request an eligible refund." : sameAddress(state.account, job.provider) ? "Your role: provider B. Submit delivery or claim after the review window." : "Select client A or provider B in the wallet menu to act on this task.";
  }
  function invalidate() {
    balanceGeneration++; loaded = null;
    api.jobCleared?.();
    $("jobBalance").textContent = "—"; $("jobAllowance").textContent = "—";
    $("lookupJobId").value = ready() ? readStored(lastJobKey(), "") : "";
    for (const id of ["mintStatus", "createJobStatus", "jobLookupStatus", "jobActionStatus"]) clearStatus(id);
    render();
  }
  async function refreshBalances() {
    const generation = ++balanceGeneration, account = state.account, key = configKey(state.config);
    $("jobBalance").textContent = "—"; $("jobAllowance").textContent = "—";
    if (!ready() || !account) return;
    const env = await environment();
    const [balance, allowance] = await Promise.all([env.token.balanceOf(account), env.token.allowance(account, env.config.escrow)]);
    if (generation !== balanceGeneration || !sameAddress(account, state.account) || key !== configKey(state.config)) return;
    $("jobBalance").textContent = format(balance); $("jobAllowance").textContent = format(allowance);
  }
  function accountChanged() {
    render();
    refreshBalances().catch(error => toast(`Balance refresh failed: ${api.errorMessage(error)}`, true));
  }
  function addDetail(label, text, address = false) {
    $("jobDetails").append(node("div", {}, [node("dt", { text: label }), node("dd", {}, [address ? explorerLink("address", text, text) : String(text)])]));
  }
  async function loadJob(idValue) {
    const env = await environment(), key = configKey(env.config);
    const snapshot = await env.service.readJob(idValue);
    if (key !== configKey(state.config)) return;
    loaded = snapshot;
    api.jobLoaded?.(snapshot.job);
    const { job, chainTime, blockNumber } = snapshot;
    $("lookupJobId").value = job.id.toString(); store(lastJobKey(), job.id.toString());
    $("loadedJobTitle").textContent = `Task #${job.id}`;
    $("loadedJobState").textContent = `${job.status} · ${JOB_STATUS[Number(job.status)] || "Unknown"}`;
    $("jobDetails").replaceChildren();
    addDetail("CLIENT A", job.client, true); addDetail("PROVIDER B", job.provider, true);
    addDetail("PROVIDER AGENT ID", job.providerAgentId === 0n ? "0 · unlinked" : job.providerAgentId);
    addDetail("PAYMENT TOKEN", job.token, true);
    addDetail("ESCROWED AMOUNT", sameAddress(job.token, env.config.token) ? format(job.amount) : `${job.amount} base units · another token`);
    addDetail("SUBMISSION DEADLINE", `${date(job.submitDeadline)} · Unix ${job.submitDeadline}`);
    addDetail("REVIEW WINDOW", `${job.reviewWindow} seconds after submission`);
    if (job.submittedAt > 0n) {
      addDetail("SUBMITTED AT", `${date(job.submittedAt)} · Unix ${job.submittedAt}`);
      addDetail("DELIVERY DIGEST", job.deliverable);
    }
    if (sameAddress(job.token, env.config.token)) {
      try {
        const [a, b, escrowBalance] = await Promise.all([env.token.balanceOf(job.client), env.token.balanceOf(job.provider), env.token.balanceOf(env.config.escrow)]);
        if (key !== configKey(state.config) || loaded !== snapshot) return;
        addDetail("CURRENT TOKEN BALANCES", `A: ${format(a)} / B: ${format(b)} / escrow total: ${format(escrowBalance)} (includes all tasks)`);
      } catch { addDetail("CURRENT TOKEN BALANCES", "Unavailable. Use Refresh balances or retry loading the task."); }
    }
    const hint = Number(job.status) === 1 ? `B may submit through the deadline. A may refund only when chain time is strictly after ${date(job.submitDeadline)}.` : Number(job.status) === 2 ? `A may release now. B may claim only when chain time is strictly after ${date(job.submittedAt + job.reviewWindow)}.` : "This task is settled. Further submission, payment and refund are disabled.";
    $("jobTimeHint").textContent = `${hint} Read at block ${blockNumber}, chain time ${date(chainTime)}. Load / refresh after waiting; time alone does not send a transaction.`;
    render();
  }
  async function bestEffortRefresh(idValue) {
    try { if (idValue) await loadJob(idValue); await refreshBalances(); }
    catch (error) { toast(`Transaction confirmed; refresh failed: ${api.errorMessage(error)}. Load the Job ID again.`, true); }
  }
  async function mint() {
    await runAction("mintStatus", async () => {
      const env = await environment(), { signer, context } = await transactionContext(env);
      status("mintStatus", "Confirm test-token mint", { message: `Mint 100 test mUSD to ${context.sender}. Sepolia ETH pays the fee.`, pending: true });
      const tx = await env.token.connect(signer).mint(context.sender, 100000000n);
      const { hash } = await confirmTransaction(tx, "mintStatus", "Mint 100 test mUSD", context);
      status("mintStatus", "100 test mUSD minted", { hash, message: "The mint adds to the selected wallet’s existing balance." });
      await bestEffortRefresh();
    });
  }
  async function approve() {
    const values = input();
    await runAction("createJobStatus", async () => {
      const env = await environment(), { signer, context } = await transactionContext(env);
      status("createJobStatus", "Confirm token approval", { message: "Only the entered amount will be approved for JobEscrow. Funds stay in your wallet until creation.", pending: true });
      await api.beforeFunding?.(values);
      const { tx, amount } = await env.service.approve(signer, values);
      if (!tx) status("createJobStatus", "Allowance already sufficient", { message: `You can create this ${format(amount)} task. No approval transaction was sent.` });
      else {
        const { hash } = await confirmTransaction(tx, "createJobStatus", "Approve mUSD for escrow", context);
        status("createJobStatus", "Approval confirmed", { message: `Ready to create a ${format(amount)} task. Creating the task consumes its allowance.`, hash });
      }
      await bestEffortRefresh();
    });
  }
  async function create(event) {
    event.preventDefault(); const values = input();
    await runAction("createJobStatus", async () => {
      const env = await environment(), { signer, context } = await transactionContext(env);
      status("createJobStatus", "Confirm task funding", { message: `${values.amount} mUSD will move from ${context.sender} into escrow for provider ${values.provider}.`, pending: true });
      await api.beforeFunding?.(values);
      const tx = await env.service.create(signer, values);
      const { receipt, hash } = await confirmTransaction(tx, "createJobStatus", "Create & fund task", context);
      const id = jobFromReceipt(receipt, env.config.escrow, env.escrow.interface);
      status("createJobStatus", id === null ? "Funding confirmed — inspect JobCreated" : `Task #${id} funded`, { message: id === null ? "Find the actual Job ID in this transaction’s JobCreated event. Do not guess from nextJobId." : "Funds are held by JobEscrow. Select provider B to submit delivery in the task panel.", hash });
      if (id !== null) { $("lookupJobId").value = id.toString(); store(lastJobKey(), id.toString()); }
      await bestEffortRefresh(id);
    });
  }
  async function perform(action, event) {
    event?.preventDefault();
    if (!loaded) return;
    const id = loaded.job.id, digest = $("deliveryDigest").value;
    await runAction("jobActionStatus", async () => {
      const env = await environment(), { signer, context } = await transactionContext(env);
      const descriptions = { submit: "Record delivery digest", release: "Accept delivery and pay provider B", refund: "Refund this task to client A", claim: "Claim this task’s payment for provider B" };
      status("jobActionStatus", "Confirm in your wallet", { message: `${descriptions[action]} · task #${id} · sender ${context.sender}.`, pending: true });
      const tx = await env.service.perform(action, signer, id, digest);
      const { hash } = await confirmTransaction(tx, "jobActionStatus", `${descriptions[action]} · #${id}`, context);
      status("jobActionStatus", "Task transaction confirmed", { message: action === "submit" ? "Delivery recorded. Client A can now accept and release payment." : action === "refund" ? "The task payment was refunded to the client." : "Payment released to the provider. Continue to feedback authorization for a linked Agent ID.", hash });
      await bestEffortRefresh(id);
    });
  }
  async function handoff() {
    if (!loaded) return;
    const id = loaded.job.id;
    await runAction("jobActionStatus", async () => {
      const env = await environment();
      const { job } = await env.service.readJob(id);
      if (Number(job.status) !== 3 || job.providerAgentId === 0n) throw new Error("Complete a task linked to B’s registered identity first.");
      const owner = await env.identity.ownerOf(job.providerAgentId);
      if (!sameAddress(owner, job.provider)) throw new Error("The linked identity has changed owners. Its current owner must issue any new review authorization.");
      $("authAgentId").value = job.providerAgentId.toString(); $("reviewerAddress").value = job.client;
      $("authorizationOutput").hidden = true; clearStatus("authorizeStatus");
      setFeedbackStep("authorize"); location.hash = "reputation";
      toast(`Task #${job.id}: select provider B (${job.provider}) to sign for client A. Feedback is a separate contract record.`);
    });
  }
  function bind() {
    $("mintTestTokens").addEventListener("click", mint);
    $("approveJob").addEventListener("click", approve);
    $("createJobForm").addEventListener("submit", create);
    $("refreshToken").addEventListener("click", () => runAction("createJobStatus", async () => { await refreshBalances(); status("createJobStatus", "Balances refreshed", { message: "Balance and allowance belong to the active wallet shown above." }); }));
    $("lookupJobForm").addEventListener("submit", event => { event.preventDefault(); const id = $("lookupJobId").value; runAction("jobLookupStatus", async () => { loaded = null; api.jobCleared?.(); render(); await loadJob(id); clearStatus("jobActionStatus"); status("jobLookupStatus", "Task loaded from Sepolia", { message: "Action buttons follow your selected account and the last read chain time." }); }); });
    $("submitJobForm").addEventListener("submit", event => perform("submit", event));
    for (const action of ["release", "refund", "claim"]) $(`${action}Job`).addEventListener("click", () => perform(action));
    $("jobToFeedback").addEventListener("click", handoff);
    $("useDemoDigest").addEventListener("click", () => { $("deliveryDigest").value = `0x${"11".repeat(32)}`; $("digestHelp").textContent = "Demo placeholder only. It is not a hash of an actual deliverable and does not prove quality."; });
    $("deliveryFile").addEventListener("change", async event => {
      const file = event.target.files?.[0]; if (!file) return;
      try {
        if (file.size > 20 * 1024 * 1024) throw new Error("Choose a file up to 20 MB for browser hashing.");
        $("deliveryDigest").value = sdk.keccak256(new Uint8Array(await file.arrayBuffer()));
        $("digestHelp").textContent = `Keccak-256 of ${file.name} (${file.size} bytes). File stays local; share the deliverable separately. This digest does not prove quality.`;
      } catch (error) { toast(api.errorMessage(error), true); }
      finally { event.target.value = ""; }
    });
    for (const id of ["jobAmount", "jobProvider", "jobAgentId"]) $(id).addEventListener("input", () => {
      $("fundingSummary").textContent = `Active client: ${state.account || "connect A"}. Payment: ${$("jobAmount").value || "—"} mUSD to escrow for ${$("jobProvider").value || "provider B"}, Agent ID ${$("jobAgentId").value || "—"}. Approval does not move funds.`;
    });
    invalidate();
  }
  return { bind, render, invalidate, accountChanged };
}
