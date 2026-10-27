import { DEPLOYMENT } from "./config.js";
import { verifyEscrow } from "./escrow-core.js";
import { createEscrowUI } from "./escrow.js";
import { createEscrowLinkUI } from "./escrow-link-ui.js";
import { FEEDBACK_TYPES, domainFor, agentId, scoreValue, cardUri, safeLink, tagValue, parseAuthorization, chooseAccount, requestAccounts, shortAddress, errorMessage } from "./core.js";

const $ = (id) => document.getElementById(id);
const sdk = globalThis.ethers;
const STORAGE = "agent-ledger.sepolia.v1";
const PAGE_SIZE = 15n;
let escrowUI, escrowLinkUI;
const IDENTITY_ABI = [
  "function register(string tokenURI_) returns (uint256)",
  "function agentCount() view returns (uint256)",
  "function ownerOf(uint256) view returns (address)",
  "function tokenURI(uint256) view returns (string)",
  "event Registered(uint256 indexed agentId,address indexed owner,string tokenURI)",
];
const REPUTATION_ABI = [
  "function identity() view returns (address)",
  "function giveFeedback(uint256 agentId,uint8 score,bytes32 tag,string fileURI,uint64 expiry,bytes32 nonce,bytes signature)",
  "function getSummary(uint256) view returns (uint64 n,uint256 sum,uint256 average)",
  "function lastFeedback(uint256) view returns (address client,uint8 score,bytes32 tag,uint64 timestamp,string fileURI)",
  "function usedNonce(bytes32) view returns (bool)",
];
const state = {
  config: readStored(STORAGE, {}), account: "", accounts: [], walletChain: null,
  walletProvider: null, readProvider: null, loadedConfig: "", total: null,
  agents: [], page: 1n, loading: false, reloadRequested: false, busy: false, generation: 0,
  transactions: readStored("agent-ledger.transactions.v1", []).filter(validStoredTx),
};
state.config = {
  identity: state.config.identity || DEPLOYMENT.identity || localStorage.getItem("sepolia_remix_id_addr") || "",
  reputation: state.config.reputation || DEPLOYMENT.reputation || localStorage.getItem("sepolia_remix_rep_addr") || "",
  escrow: state.config.escrow || DEPLOYMENT.escrow || "",
  token: state.config.token || DEPLOYMENT.token || "",
  rpcUrl: state.config.rpcUrl || DEPLOYMENT.rpcUrl,
};

function readStored(key, fallback) {
  try { const result = JSON.parse(localStorage.getItem(key)); return result && typeof result === typeof fallback && Array.isArray(result) === Array.isArray(fallback) ? result : fallback; }
  catch { return fallback; }
}
function validStoredTx(tx) {
  return tx && /^0x[0-9a-fA-F]{64}$/.test(tx.hash || "") && tx.chainId === DEPLOYMENT.chainId && typeof tx.label === "string" && typeof tx.time === "number";
}
function store(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { toast("Browser storage is unavailable. Keep a copy of your contract addresses.", true); }
}
function icon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#i-${name}`); svg.append(use); svg.setAttribute("aria-hidden", "true"); return svg;
}
function node(tag, options = {}, children = []) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(options)) {
    if (key === "class") element.className = value;
    else if (key === "text") element.textContent = String(value);
    else element.setAttribute(key, String(value));
  }
  for (const child of children) element.append(typeof child === "string" ? document.createTextNode(child) : child);
  return element;
}
function explorerLink(kind, value, label) {
  return node("a", { href: `${DEPLOYMENT.explorer}/${kind}/${value}`, target: "_blank", rel: "noopener noreferrer" }, [label || shortAddress(value), icon("external")]);
}
function toast(message, error = false) {
  const item = node("div", { class: `toast${error ? " error" : ""}`, text: message });
  $("toastStack").append(item); setTimeout(() => item.remove(), 6000);
}
async function copy(text, success = "Copied to clipboard") {
  try { await navigator.clipboard.writeText(text); toast(success); }
  catch { toast("Clipboard access was blocked. Select and copy the text manually.", true); }
}
function status(id, title, { message = "", error = false, pending = false, hash = "" } = {}) {
  const target = $(id); target.hidden = false; target.className = `form-status${error ? " error" : ""}`; target.replaceChildren();
  const heading = node("strong"); if (pending) heading.append(node("span", { class: "spinner" })); heading.append(title); target.append(heading);
  if (message) target.append(node("div", { text: message }));
  if (hash) target.append(explorerLink("tx", hash, shortAddress(hash, 12, 8)));
}
function clearStatus(id) { $(id).hidden = true; $(id).replaceChildren(); }
function configReady() { return !!state.config.identity && !!state.config.reputation; }
function configKey(config) { return `${config.rpcUrl}|${config.identity.toLowerCase()}|${config.reputation.toLowerCase()}|${(config.escrow || "").toLowerCase()}|${(config.token || "").toLowerCase()}`; }

function route() {
  const view = location.hash.slice(1) || "community";
  const name = ["registry", "register", "jobs", "reputation", "guide", "community", "circles", "network", "teams", "works"].includes(view) ? view : "registry";
  document.querySelectorAll(".view").forEach(e => e.hidden = e.id !== `view-${name}`);
  document.querySelectorAll("[data-nav]").forEach(e => { e.classList.toggle("active", e.dataset.nav === name); if (e.dataset.nav === name) e.setAttribute("aria-current", "page"); else e.removeAttribute("aria-current"); });
  $("breadcrumb").textContent = { registry: "Agent registry", register: "Register an agent", jobs: "Task escrow", reputation: "Reputation", guide: "How it works", community: "Community", circles: "Circles", network: "People & partners", teams: "My teams", works: "Shared works" }[name];
  document.title = `${$("breadcrumb").textContent} · Agent Ledger`;
  window.scrollTo({ top: 0, behavior: "instant" });
}
function setFeedbackStep(step) {
  const authorize = step === "authorize";
  $("authorizePanel").hidden = !authorize; $("submitPanel").hidden = authorize;
  $("authorizeTab").classList.toggle("active", authorize); $("submitTab").classList.toggle("active", !authorize);
  $("authorizeTab").setAttribute("aria-selected", String(authorize)); $("submitTab").setAttribute("aria-selected", String(!authorize));
}

async function applyAccounts(accounts, preferred = state.account) {
  state.accounts = accounts.filter(a => /^0x[0-9a-fA-F]{40}$/.test(a));
  state.account = chooseAccount(state.accounts, preferred);
  if (state.account) {
    state.walletProvider = new sdk.BrowserProvider(window.ethereum, "any");
    state.walletChain = Number(BigInt(await window.ethereum.request({ method: "eth_chainId" })));
    store("agent-ledger.selected-account", state.account);
  } else { state.walletProvider = null; state.walletChain = null; }
  renderWallet(); renderAgents(); inspectAuthorization(); escrowUI?.accountChanged(); window.dispatchEvent(new Event("ledger-account-changed"));
}
function renderWallet() {
  $("walletButtonLabel").textContent = state.account ? shortAddress(state.account) : "Connect wallet";
  $("metricWallet").textContent = state.account ? shortAddress(state.account, 8, 5) : "Not connected";
  $("metricWallet").title = state.account;
  $("registerOwner").textContent = state.account || "Connect your wallet";
  $("registerOwner").className = state.account ? "address" : "";
  $("accountSelect").replaceChildren(...state.accounts.map((account, i) => node("option", { value: account, text: `Account ${i + 1} · ${shortAddress(account, 8, 6)}` })));
  $("accountSelect").value = state.account;
  $("walletNetworkLabel").textContent = state.walletChain === DEPLOYMENT.chainId ? "Ethereum Sepolia · ready to sign" : `Wallet network: ${state.walletChain ?? "not connected"}`;
  $("walletWarning").hidden = !state.account || state.walletChain === DEPLOYMENT.chainId;
  if (!state.account) $("walletPopover").hidden = true;
  escrowUI?.render(); escrowLinkUI?.render();
}
async function connectWallet(reselect = false) {
  if (state.busy) return toast("Finish the current wallet action first.");
  const button = reselect ? $("chooseAccounts") : $("walletButton"); button.disabled = true;
  try {
    const accounts = await requestAccounts(window.ethereum, reselect);
    const preferred = reselect ? accounts[0] : readStored("agent-ledger.selected-account", "");
    await applyAccounts(accounts, preferred);
    if (state.walletChain !== DEPLOYMENT.chainId) await switchNetwork();
    if (reselect || accounts.length > 1) $("walletPopover").hidden = false;
    toast(`Connected ${shortAddress(state.account)}. Use the wallet menu to select another authorized account.`);
  } catch (error) { toast(errorMessage(error), true); }
  finally { button.disabled = false; }
}
async function switchNetwork() {
  if (!window.ethereum) throw new Error("Install a browser wallet first.");
  const chainId = `0x${DEPLOYMENT.chainId.toString(16)}`;
  try { await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] }); }
  catch (error) {
    if (error.code !== 4902 && error?.data?.originalError?.code !== 4902) throw error;
    await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId, chainName: DEPLOYMENT.chainName, nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 }, rpcUrls: [state.config.rpcUrl], blockExplorerUrls: [DEPLOYMENT.explorer] }] });
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  }
  state.walletChain = Number(BigInt(await window.ethereum.request({ method: "eth_chainId" })));
  state.walletProvider = new sdk.BrowserProvider(window.ethereum, "any"); renderWallet();
}
async function selectedSigner() {
  if (!state.account) throw new Error("Connect and select the account you want to use with the top-right wallet button, then try again.");
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  if (!accounts.some(a => a.toLowerCase() === state.account.toLowerCase())) throw new Error("The selected account is no longer authorized. Reconnect your wallet.");
  const chain = Number(BigInt(await window.ethereum.request({ method: "eth_chainId" })));
  if (chain !== DEPLOYMENT.chainId) await switchNetwork();
  // Explicit address matters: getSigner() without one always picks the first authorized account.
  const signer = await state.walletProvider.getSigner(state.account);
  if ((await signer.getAddress()).toLowerCase() !== state.account.toLowerCase()) throw new Error("Wallet account changed. Select your account and try again.");
  return signer;
}

async function validatedProvider(config) {
  const request = new sdk.FetchRequest(config.rpcUrl); request.timeout = 12000;
  const provider = new sdk.JsonRpcProvider(request, DEPLOYMENT.chainId, { staticNetwork: true, batchMaxCount: 1, pollingInterval: 5000, cacheTimeout: 0 });
  try {
    const chain = Number(BigInt(await provider.send("eth_chainId", [])));
    if (chain !== DEPLOYMENT.chainId) throw new Error(`This RPC is for chain ${chain}. Use Ethereum Sepolia (11155111).`);
    const [identityCode, reputationCode] = await Promise.all([provider.getCode(config.identity), provider.getCode(config.reputation)]);
    if (identityCode === "0x" || reputationCode === "0x") throw new Error("No contract code found at one of these addresses on Sepolia. Use your deployed contract addresses, not wallet addresses.");
    const identity = new sdk.Contract(config.identity, IDENTITY_ABI, provider);
    const reputation = new sdk.Contract(config.reputation, REPUTATION_ABI, provider);
    const [linkedIdentity] = await Promise.all([reputation.identity(), identity.agentCount(), reputation.getSummary(1)]);
    if (linkedIdentity.toLowerCase() !== config.identity.toLowerCase()) throw new Error("The reputation contract is linked to a different identity registry. Check both deployment addresses.");
    await verifyEscrow(provider, config, sdk);
    return provider;
  } catch (error) { provider.destroy(); throw error; }
}
async function contracts() {
  if (!configReady()) { openSettings(); throw new Error("Configure your deployed Sepolia contract addresses first."); }
  if (!state.readProvider || state.loadedConfig !== configKey(state.config)) {
    const config = { ...state.config }; const key = configKey(config);
    const provider = await validatedProvider(config);
    if (key !== configKey(state.config)) { provider.destroy(); return contracts(); }
    state.readProvider?.destroy(); state.readProvider = provider; state.loadedConfig = key;
  }
  return { identity: new sdk.Contract(state.config.identity, IDENTITY_ABI, state.readProvider), reputation: new sdk.Contract(state.config.reputation, REPUTATION_ABI, state.readProvider), provider: state.readProvider };
}
function openSettings() {
  if (state.busy) return toast("Finish the current wallet action before changing contracts.");
  $("identityAddress").value = state.config.identity; $("reputationAddress").value = state.config.reputation; $("rpcUrl").value = state.config.rpcUrl;
  $("escrowAddress").value = state.config.escrow; $("tokenAddress").value = state.config.token;
  clearStatus("settingsStatus"); $("settingsDialog").showModal();
}
async function saveSettings(event) {
  event.preventDefault(); if (state.busy) return;
  const button = $("saveSettings"); button.disabled = true; setBusy(true);
  let provider;
  try {
    const identity = sdk.getAddress($("identityAddress").value.trim());
    const reputation = sdk.getAddress($("reputationAddress").value.trim());
    if (identity === sdk.ZeroAddress || reputation === sdk.ZeroAddress || identity === reputation) throw new Error("Enter two different, non-zero registry contract addresses.");
    const rpcUrl = $("rpcUrl").value.trim(); const url = new URL(rpcUrl);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Enter a public HTTP(S) RPC URL without embedded credentials.");
    const escrow = $("escrowAddress").value.trim() ? sdk.getAddress($("escrowAddress").value.trim()) : "";
    const token = $("tokenAddress").value.trim() ? sdk.getAddress($("tokenAddress").value.trim()) : "";
    if (!!escrow !== !!token) throw new Error("Enter both JobEscrow and MockUSDC addresses, or leave both empty.");
    const addresses = [identity, reputation, escrow, token].filter(Boolean);
    if (addresses.includes(sdk.ZeroAddress) || new Set(addresses).size !== addresses.length) throw new Error("Use different, non-zero addresses for each contract.");
    const config = { identity, reputation, rpcUrl, escrow, token };
    status("settingsStatus", "Verifying your contracts…", { message: "Checking Sepolia contracts and the optional mUSD token.", pending: true });
    provider = await validatedProvider(config);
    state.generation++; state.readProvider?.destroy(); state.readProvider = provider;
    state.config = config; state.loadedConfig = configKey(config); state.page = 1n; state.total = null; state.agents = [];
    store(STORAGE, config); $("settingsDialog").close(); $("authorizationOutput").hidden = true;
    escrowUI.invalidate(); escrowLinkUI.invalidate();
    renderRegistryState(); renderRecent(); inspectAuthorization();
    window.dispatchEvent(new Event("ledger-config-changed")); toast("Sepolia contracts verified and saved."); await loadRegistry(); escrowUI.accountChanged();
  } catch (error) { if (provider && provider !== state.readProvider) provider.destroy(); status("settingsStatus", "Could not verify these settings", { message: errorMessage(error), error: true }); }
  finally { button.disabled = false; setBusy(false); }
}

async function loadRegistry() {
  if (state.loading) { state.reloadRequested = true; return; }
  if (!configReady()) { state.total = null; state.agents = []; renderRegistryState(); return; }
  state.loading = true; const generation = state.generation;
  $("refreshButton").disabled = true; $("registryNotice").hidden = true;
  $("agentRows").replaceChildren(); $("syncLabel").textContent = "Refreshing confirmed records…";
  emptyState("Loading the registry…", "Reading confirmed identities and reputation from Sepolia.", "loading");
  try {
    const { identity, reputation, provider } = await contracts();
    const [count, block] = await Promise.all([identity.agentCount(), provider.getBlockNumber()]);
    if (generation !== state.generation) return;
    state.total = count;
    const pages = count === 0n ? 1n : (count + PAGE_SIZE - 1n) / PAGE_SIZE;
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1n) * PAGE_SIZE + 1n;
    const end = count < start + PAGE_SIZE - 1n ? count : start + PAGE_SIZE - 1n;
    const agents = []; let failures = 0;
    // At most three identities in flight to avoid overwhelming a public RPC.
    for (let cursor = start; cursor <= end; cursor += 3n) {
      const ids = []; for (let id = cursor; id <= end && id < cursor + 3n; id++) ids.push(id);
      const batch = await Promise.allSettled(ids.map(async id => {
        const [owner, uri, summary] = await Promise.all([identity.ownerOf(id), identity.tokenURI(id), reputation.getSummary(id)]);
        return { id, owner, uri, count: summary[0], total: summary[1], average: summary[2] };
      }));
      if (generation !== state.generation) return;
      for (const result of batch) if (result.status === "fulfilled") agents.push(result.value); else failures++;
    }
    state.agents = agents;
    $("latestBlock").textContent = block.toLocaleString("en-US");
    $("syncLabel").textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (failures) { $("registryNotice").textContent = `${failures} record(s) could not be read. Their scores are not shown as zero. Refresh to retry.`; $("registryNotice").hidden = false; }
    renderRegistryState();
  } catch (error) {
    if (generation !== state.generation) return;
    state.agents = []; state.total = null; $("registryNotice").textContent = errorMessage(error); $("registryNotice").hidden = false;
    $("syncLabel").textContent = "Could not reach the configured registry";
    $("totalAgents").textContent = "—"; $("registryCount").textContent = "—"; $("navCount").textContent = "—";
    $("latestBlock").textContent = "—"; $("agentRows").replaceChildren();
    emptyState("The registry could not be loaded.", "Check your addresses and RPC in Contract settings, then refresh.", "configure");
  } finally {
    state.loading = false; $("refreshButton").disabled = false; updatePagination();
    if (state.reloadRequested) { state.reloadRequested = false; queueMicrotask(loadRegistry); }
  }
}
function renderRegistryState() {
  $("setupBanner").hidden = configReady();
  const count = state.total === null ? "—" : state.total.toLocaleString("en-US");
  $("totalAgents").textContent = count; $("registryCount").textContent = count; $("navCount").textContent = count;
  renderAgents(); updatePagination();
}
function emptyState(title, message, action = "") {
  const root = $("registryEmpty"); root.hidden = false;
  const symbol = node("span", { class: "empty-icon" }, [icon(action === "loading" ? "refresh" : "grid")]);
  root.replaceChildren(symbol, node("h3", { text: title }), node("p", { text: message }));
  if (action === "configure") { const button = node("button", { class: "button button-outline", text: "Configure contracts" }, [icon("arrow")]); button.addEventListener("click", openSettings); root.append(button); }
  if (action === "register") root.append(node("a", { class: "button button-outline", href: "#register", text: "Register the first agent" }, [icon("arrow")]));
}
function renderAgents() {
  $("agentRows").replaceChildren();
  if (!configReady()) { emptyState("Your registry, ready to connect.", "Configure your contracts to load agent identities. Only confirmed on-chain records appear here.", "configure"); return; }
  if (state.total === 0n) { emptyState("A fresh registry. Your first identity awaits.", "Register an agent to create the first on-chain record.", "register"); return; }
  const query = $("agentSearch").value.trim().toLowerCase(); const mine = $("ownerFilter").value === "mine";
  const filtered = state.agents.filter(a => (!query || `${a.id} ${a.owner} ${a.uri}`.toLowerCase().includes(query)) && (!mine || (state.account && a.owner.toLowerCase() === state.account.toLowerCase())));
  if (!filtered.length) {
    if (!state.agents.length && state.total > 0n && !query && !mine) emptyState("These records could not be read.", "Refresh to retry the page. A failed read is not a zero score.");
    else emptyState(mine && !state.account ? "Connect a wallet to filter your agents." : "No matching agents on this page.", "Try another search, owner filter or registry page.");
    return;
  }
  $("registryEmpty").hidden = true;
  for (const agent of filtered) {
    const avatar = node("span", { class: "agent-avatar", text: "A" });
    const title = node("div", {}, [node("div", { class: "agent-name", text: `Agent #${agent.id}` }), node("div", { class: "agent-subtitle", text: agent.uri || "No card URI", title: agent.uri })]);
    const copyOwner = node("button", { class: "address-button", title: `Copy owner ${agent.owner}` }, [shortAddress(agent.owner, 8, 5), icon("copy")]);
    copyOwner.addEventListener("click", () => copy(agent.owner));
    const score = node("td");
    if (agent.count === 0n) score.append(node("span", { class: "no-reviews", text: "No reviews yet" }));
    else {
      const bar = node("i"); bar.style.width = `${Number(agent.average)}%`;
      score.append(node("div", { class: "score-cell" }, [node("strong", { text: agent.average }), node("small", { text: "/100" }), node("span", { class: "score-track" }, [bar])]));
    }
    const details = node("button", { class: "detail-button", "aria-label": `View Agent ${agent.id}` }, ["View", icon("arrow")]); details.addEventListener("click", () => showAgent(agent));
    $("agentRows").append(node("tr", {}, [node("td", {}, [node("div", { class: "agent-identity" }, [avatar, title])]), node("td", {}, [copyOwner]), score, node("td", { class: "review-count", text: agent.count.toLocaleString("en-US") }), node("td", {}, [details])]));
  }
}
function updatePagination() {
  const total = state.total; const pages = total === null || total === 0n ? 1n : (total + PAGE_SIZE - 1n) / PAGE_SIZE;
  $("pageNumber").textContent = state.page.toString();
  $("previousPage").disabled = state.loading || state.page <= 1n; $("nextPage").disabled = state.loading || state.page >= pages;
  if (total === null) $("pageLabel").textContent = configReady() ? "Awaiting registry data" : "No registry connected";
  else if (total === 0n) $("pageLabel").textContent = "0 agents · Ethereum Sepolia";
  else { const end = state.page * PAGE_SIZE < total ? state.page * PAGE_SIZE : total; $("pageLabel").textContent = `${(state.page - 1n) * PAGE_SIZE + 1n}–${end} of ${total} agents · Search applies to this page`; }
}

async function showAgent(agent) {
  $("detailTitle").textContent = `Agent #${agent.id}`;
  const score = node("div", { class: "detail-score" }, [node("div", {}, [node("strong", { text: agent.count ? agent.average : "—" }), node("span", { text: agent.count ? " / 100" : " No reviews" })]), node("p", { text: `${agent.count} confirmed review${agent.count === 1n ? "" : "s"}` })]);
  const list = node("dl", { class: "detail-list" });
  function detail(label, content) { list.append(node("div", {}, [node("dt", { text: label }), node("dd", {}, [content])])); }
  detail("OWNER", explorerLink("address", agent.owner, agent.owner));
  const uriLink = safeLink(agent.uri);
  detail("AGENT CARD URI", uriLink ? node("a", { href: uriLink, target: "_blank", rel: "noopener noreferrer", text: agent.uri }) : agent.uri || "No URI");
  detail("IDENTITY REGISTRY", explorerLink("address", state.config.identity, shortAddress(state.config.identity, 10, 6)));
  detail("REPUTATION REGISTRY", explorerLink("address", state.config.reputation, shortAddress(state.config.reputation, 10, 6)));
  const actions = node("div", { class: "detail-actions" });
  const copyButton = node("button", { class: "button button-outline button-small", text: "Copy Agent ID" }, [icon("copy")]); copyButton.addEventListener("click", () => copy(agent.id.toString())); actions.append(copyButton);
  const authorize = node("button", { class: "button button-primary button-small", text: "Authorize review" }, [icon("arrow")]); authorize.addEventListener("click", () => { $("authAgentId").value = agent.id.toString(); $("agentDialog").close(); location.hash = "reputation"; setFeedbackStep("authorize"); }); actions.append(authorize);
  const output = node("pre", { class: "metadata-output", hidden: "" });
  if (uriLink) {
    const fetchButton = node("button", { class: "button button-outline button-small", text: "Fetch metadata" }, [icon("file")]);
    fetchButton.addEventListener("click", async () => {
      fetchButton.disabled = true; output.hidden = false; output.textContent = "Fetching the off-chain document…";
      try {
        const response = await fetch(uriLink, { signal: AbortSignal.timeout(10000), credentials: "omit", referrerPolicy: "no-referrer" });
        if (!response.ok) throw new Error(`Metadata server returned HTTP ${response.status}.`);
        if (Number(response.headers.get("content-length")) > 1000000) throw new Error("Metadata exceeds the 1 MB display limit.");
        const reader = response.body.getReader(); let text = "", size = 0; const decoder = new TextDecoder();
        while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 1000000) { await reader.cancel(); throw new Error("Metadata exceeds the 1 MB display limit."); } text += decoder.decode(value, { stream: true }); }
        text += decoder.decode(); try { text = JSON.stringify(JSON.parse(text), null, 2); } catch { /* Display non-JSON documents as plain text only. */ }
        output.textContent = text;
      } catch (error) { output.textContent = `Metadata could not be loaded: ${errorMessage(error)}\nThe chain identity remains valid; the document server may block cross-origin reads.`; }
      finally { fetchButton.disabled = false; }
    }); actions.append(fetchButton);
  }
  $("agentDetail").replaceChildren(score, list, actions, output, node("p", { class: "detail-disclaimer", text: "Ownership and scores are read from the configured contracts. Metadata is an off-chain document supplied by the owner." }));
  $("agentDialog").showModal();
}

function setBusy(value) {
  state.busy = value;
  for (const id of ["registerSubmit", "authorizeSubmit", "feedbackSubmit", "chooseAccounts", "accountSelect"]) $(id).disabled = value;
  escrowUI?.render(); escrowLinkUI?.render();
}
async function runAction(statusId, operation) {
  if (state.busy) return;
  if (!configReady()) {
    status(statusId, "Contract settings required", { message: "Verify and save your existing Sepolia registry addresses before continuing." });
    openSettings(); return;
  }
  setBusy(true); clearStatus(statusId);
  try { await operation(); }
  catch (error) { status(statusId, "Action not completed", { message: errorMessage(error), error: true }); }
  finally { setBusy(false); }
}
async function confirmTransaction(tx, statusId, label, context) {
  status(statusId, "Transaction submitted", { message: "Waiting for a confirmed receipt on Sepolia. You can inspect the transaction below.", pending: true, hash: tx.hash });
  let receipt;
  try { receipt = await tx.wait(1); }
  catch (error) {
    if (error.code === "TRANSACTION_REPLACED" && !error.cancelled && error.receipt?.status === 1) { receipt = error.receipt; }
    else throw error;
  }
  if (!receipt || receipt.status !== 1) throw new Error("The transaction did not succeed. Check its receipt on Sepolia Etherscan.");
  const hash = receipt.hash || tx.hash;
  state.transactions.unshift({ hash, label, chainId: DEPLOYMENT.chainId, time: Date.now(), sender: context.sender, identity: context.identity, reputation: context.reputation, escrow: context.escrow || "", token: context.token || "", scope: context.scope || "registry", block: receipt.blockNumber });
  state.transactions = state.transactions.slice(0, 12); store("agent-ledger.transactions.v1", state.transactions); renderRecent();
  return { receipt, hash };
}
async function register(event) {
  event.preventDefault();
  await runAction("registerStatus", async () => {
    const uri = cardUri($("cardUri").value);
    const { identity } = await contracts(); const signer = await selectedSigner();
    const context = { sender: await signer.getAddress(), ...state.config };
    status("registerStatus", "Confirm in your wallet", { message: "You are registering a new identity. Each successful registration creates a new Agent ID.", pending: true });
    const tx = await identity.connect(signer).register(uri);
    const { receipt, hash } = await confirmTransaction(tx, "registerStatus", "Agent registration", context);
    const eventLog = receipt.logs.map(log => { try { return log.address.toLowerCase() === context.identity.toLowerCase() ? identity.interface.parseLog(log) : null; } catch { return null; } }).find(log => log?.name === "Registered");
    const id = eventLog?.args.agentId;
    status("registerStatus", id !== undefined ? `Agent #${id} is registered` : "Registration confirmed", { message: `Owner ${shortAddress(context.sender)} · block ${receipt.blockNumber}. Your identity is now recorded on Sepolia.`, hash });
    if (id !== undefined) $("authAgentId").value = id.toString();
    if (id !== undefined) { $("jobAgentId").value = id.toString(); $("jobProvider").value = context.sender; }
    if (configKey(context) === configKey(state.config)) {
      if (id !== undefined) state.page = (id - 1n) / PAGE_SIZE + 1n;
      await loadRegistry();
    }
  });
}
async function authorize(event) {
  event.preventDefault();
  await runAction("authorizeStatus", async () => {
    const id = agentId($("authAgentId").value); const client = sdk.getAddress($("reviewerAddress").value.trim());
    if (client === sdk.ZeroAddress) throw new Error("Use the reviewer's non-zero wallet address.");
    const { identity } = await contracts(); const signer = await selectedSigner();
    const signerAddress = await signer.getAddress(); const owner = await identity.ownerOf(id);
    if (owner.toLowerCase() !== signerAddress.toLowerCase()) throw new Error(`Only the current agent owner (${shortAddress(owner)}) can authorize a review. Select that account.`);
    if (client.toLowerCase() === owner.toLowerCase()) throw new Error("An owner cannot review themselves. For the task demo, B authorizes client A.");
    const ttl = Number($("authValidity").value);
    if (![3600, 86400, 604800].includes(ttl)) throw new Error("Choose a supported authorization lifetime.");
    const expiry = Math.floor(Date.now() / 1000) + ttl; const nonce = sdk.hexlify(sdk.randomBytes(32));
    const domain = domainFor(DEPLOYMENT.chainId, state.config.reputation);
    const value = { agentId: id, client, expiry, nonce };
    status("authorizeStatus", "Review the signature request", { message: "This creates an authorization only. No transaction or payment is sent.", pending: true });
    const signature = await signer.signTypedData(domain, FEEDBACK_TYPES, value);
    const recovered = sdk.verifyTypedData(domain, FEEDBACK_TYPES, value, signature);
    if (recovered.toLowerCase() !== owner.toLowerCase()) throw new Error("The signature does not match the current owner. Check the selected wallet.");
    const blob = { agentId: id.toString(), client, expiry, nonce, signature, chainId: DEPLOYMENT.chainId, verifyingContract: state.config.reputation };
    $("authorizationJson").value = JSON.stringify(blob, null, 2); $("authorizationOutput").hidden = false;
    status("authorizeStatus", "Authorization signed", { message: `Reviewer ${shortAddress(client)} · expires ${new Date(expiry * 1000).toLocaleString()}. Save the JSON before switching accounts.` });
  });
}
function inspectAuthorization() {
  const root = $("authorizationPreview"); const raw = $("authorizationInput").value.trim(); root.className = "auth-preview";
  if (!raw) { root.replaceChildren(icon("info"), node("span", { text: "Paste an authorization to inspect its reviewer and expiry." })); return; }
  try {
    const auth = parseAuthorization(raw, { chainId: DEPLOYMENT.chainId, reputation: state.config.reputation });
    const correct = state.account && auth.client.toLowerCase() === state.account.toLowerCase();
    const description = `Agent #${auth.agentId} · reviewer ${shortAddress(auth.client)} · expires ${new Date(auth.expiry * 1000).toLocaleString()}`;
    const text = node("span", { text: description });
    text.append(node("br"), node("strong", { text: correct ? "Selected wallet matches the reviewer." : "Select this reviewer account before submitting." }));
    root.replaceChildren(icon(correct ? "check" : "info"), text);
  } catch (error) { root.classList.add("invalid"); root.replaceChildren(icon("info"), node("span", { text: errorMessage(error) })); }
}
async function feedback(event) {
  event.preventDefault();
  await runAction("feedbackStatus", async () => {
    const auth = parseAuthorization($("authorizationInput").value.trim(), { chainId: DEPLOYMENT.chainId, reputation: state.config.reputation });
    const score = scoreValue($("scoreNumber").value); const tag = tagValue($("feedbackTag").value); const reviewUri = cardUri($("feedbackUri").value, { optional: true });
    const { identity, reputation } = await contracts(); const signer = await selectedSigner(); const sender = await signer.getAddress();
    if (sender.toLowerCase() !== auth.client.toLowerCase()) throw new Error(`Select the authorized reviewer ${shortAddress(auth.client)} in the wallet menu. The current account is ${shortAddress(sender)}.`);
    const owner = await identity.ownerOf(auth.agentId);
    if (owner.toLowerCase() === sender.toLowerCase()) throw new Error("An agent owner cannot review themselves. Select the authorized client / reviewer account.");
    const domain = domainFor(DEPLOYMENT.chainId, state.config.reputation);
    const recovered = sdk.verifyTypedData(domain, FEEDBACK_TYPES, { agentId: auth.agentId, client: auth.client, expiry: auth.expiry, nonce: auth.nonce }, auth.signature);
    if (recovered.toLowerCase() !== owner.toLowerCase()) throw new Error("The signature is not from the current agent owner for these contracts. Ask the owner to issue a new authorization.");
    const nonceSlot = sdk.solidityPackedKeccak256(["uint256", "bytes32"], [auth.agentId, auth.nonce]);
    if (await reputation.usedNonce(nonceSlot)) throw new Error("This authorization has already been used. Request a new signature from the owner.");
    const context = { sender, ...state.config };
    status("feedbackStatus", "Confirm your review in the wallet", { message: `Agent #${auth.agentId} · score ${score}/100. This uses Sepolia ETH for the network fee.`, pending: true });
    const tx = await reputation.connect(signer).giveFeedback(auth.agentId, score, tag ? sdk.encodeBytes32String(tag) : sdk.ZeroHash, reviewUri, auth.expiry, auth.nonce, auth.signature);
    const { receipt, hash } = await confirmTransaction(tx, "feedbackStatus", `Feedback · Agent #${auth.agentId}`, context);
    status("feedbackStatus", "Your feedback is on-chain", { message: `Score ${score}/100 recorded in block ${receipt.blockNumber}. This authorization has now been used.`, hash });
    if (configKey(context) === configKey(state.config)) await loadRegistry();
  });
}
function renderRecent() {
  const records = state.transactions.filter(tx => validStoredTx(tx) && tx.identity?.toLowerCase() === state.config.identity.toLowerCase() && tx.reputation?.toLowerCase() === state.config.reputation.toLowerCase() && (tx.scope !== "escrow" || (tx.escrow?.toLowerCase() === state.config.escrow.toLowerCase() && tx.token?.toLowerCase() === state.config.token.toLowerCase()))).slice(0, 6);
  $("recentSection").hidden = !records.length; $("recentTransactions").replaceChildren();
  for (const tx of records) {
    $("recentTransactions").append(node("div", { class: "recent-item" }, [node("span", { class: "recent-check" }, [icon("check")]), node("div", {}, [node("strong", { text: tx.label }), node("p", { text: `${shortAddress(tx.sender)} · block ${tx.block} · ${new Date(tx.time).toLocaleString()}` })]), explorerLink("tx", tx.hash)]));
  }
}

function bindEvents() {
  window.addEventListener("hashchange", route);
  document.querySelectorAll("[data-open-settings]").forEach(e => e.addEventListener("click", openSettings));
  document.querySelectorAll("[data-close-dialog]").forEach(e => e.addEventListener("click", () => $(e.dataset.closeDialog).close()));
  document.querySelectorAll("[data-feedback]").forEach(e => e.addEventListener("click", () => setFeedbackStep(e.dataset.feedback)));
  $("settingsForm").addEventListener("submit", saveSettings);
  $("useDefaultRpc").addEventListener("click", () => $("rpcUrl").value = DEPLOYMENT.rpcUrl);
  $("useBackupRpc").addEventListener("click", () => $("rpcUrl").value = DEPLOYMENT.backupRpcUrl);
  $("walletButton").addEventListener("click", () => { if (state.account) $("walletPopover").hidden = !$("walletPopover").hidden; else connectWallet(); });
  $("closeWallet").addEventListener("click", () => $("walletPopover").hidden = true);
  $("chooseAccounts").addEventListener("click", () => connectWallet(true));
  $("disconnectWallet").addEventListener("click", () => { applyAccounts([]); store("agent-ledger.selected-account", ""); toast("App session disconnected. Wallet site permissions are managed in MetaMask."); });
  $("accountSelect").addEventListener("change", async event => { try { await applyAccounts(state.accounts, event.target.value); toast(`Active account: ${shortAddress(state.account)}`); } catch (error) { toast(errorMessage(error), true); } });
  $("switchNetwork").addEventListener("click", () => switchNetwork().catch(error => toast(errorMessage(error), true)));
  $("reputationWallet").addEventListener("click", () => { if (state.account) { $("walletPopover").hidden = false; window.scrollTo({ top: 0, behavior: "smooth" }); } else connectWallet(); });
  $("refreshButton").addEventListener("click", loadRegistry);
  $("previousPage").addEventListener("click", () => { if (state.page > 1n && !state.loading) { state.page--; loadRegistry(); } });
  $("nextPage").addEventListener("click", () => { if (!state.loading) { state.page++; loadRegistry(); } });
  $("agentSearch").addEventListener("input", renderAgents); $("ownerFilter").addEventListener("change", renderAgents);
  $("useExample").addEventListener("click", () => { $("cardUri").value = `${location.origin}/.well-known/agent-card.json`; toast("Local example selected. Use a public URI when sharing the project."); });
  $("registerForm").addEventListener("submit", register); $("authorizeForm").addEventListener("submit", authorize); $("feedbackForm").addEventListener("submit", feedback);
  $("copyAuthorization").addEventListener("click", () => copy($("authorizationJson").value, "Authorization JSON copied. Save it before changing browsers."));
  $("useAuthorization").addEventListener("click", () => { $("authorizationInput").value = $("authorizationJson").value; setFeedbackStep("submit"); inspectAuthorization(); });
  $("authorizationInput").addEventListener("input", inspectAuthorization);
  $("scoreRange").addEventListener("input", event => $("scoreNumber").value = event.target.value);
  $("scoreNumber").addEventListener("input", event => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 0 && value <= 100) $("scoreRange").value = value; });
  document.addEventListener("click", event => { if (!event.target.closest(".wallet-anchor")) $("walletPopover").hidden = true; });
  if (window.ethereum?.on) {
    window.ethereum.on("accountsChanged", accounts => applyAccounts(accounts).catch(error => toast(errorMessage(error), true)));
    window.ethereum.on("chainChanged", chain => { state.walletChain = Number(BigInt(chain)); state.walletProvider = new sdk.BrowserProvider(window.ethereum, "any"); renderWallet(); });
    window.ethereum.on("disconnect", () => applyAccounts([]));
  }
}
async function boot() {
  if (!sdk) { $("libraryError").hidden = false; return; }
  escrowLinkUI = createEscrowLinkUI({sdk,$,state,node,toast,selectedSigner,configKey,runAction,status});
  escrowUI = createEscrowUI({ sdk, $, state, node, explorerLink, status, clearStatus, runAction, selectedSigner, contracts, confirmTransaction, configKey, openSettings, toast, store, readStored, setFeedbackStep, errorMessage, beforeFunding: values => escrowLinkUI.beforeFunding(values), jobLoaded: job => escrowLinkUI.jobLoaded(job), jobCleared: () => escrowLinkUI.jobCleared() });
  escrowUI.bind(); escrowLinkUI.bind();
  bindEvents(); route(); renderWallet(); renderRegistryState(); renderRecent();
  // Read existing permissions silently. Never request wallet access on page load.
  if (window.ethereum?.request) {
    try { const accounts = await window.ethereum.request({ method: "eth_accounts" }); if (accounts.length) await applyAccounts(accounts, readStored("agent-ledger.selected-account", "")); } catch { /* Wallet connection remains optional for reads. */ }
  }
  if (configReady()) await loadRegistry();
}
boot().catch(error => { $("libraryError").textContent = errorMessage(error); $("libraryError").hidden = false; });

export const ledger = { get account(){ return state.account; }, get config(){ return state.config; }, get busy(){return state.busy;}, setBusy, selectedSigner, connectWallet, toast };
