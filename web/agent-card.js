// Agent card format (agentledger-card-v1). The card is an off-chain JSON document; IdentityRegistry stores only its URI.
// Pure functions: shared by the register form, the registry detail view, the market filters and the sample agent service.
export const CARD_SCHEMA = "agentledger-card-v1";
export const CARD_MAX_BYTES = 64 * 1024;
const LIMITS = { name: 80, description: 600, skill: 32, skills: 12 };

const bytes = value => new TextEncoder().encode(value).length;
function words(value, max, label, { optional = false } = {}) {
  const text = String(value ?? "").trim();
  if (!text && optional) return "";
  if (!text || bytes(text) > max) throw new Error(`${label} must be 1–${max} UTF-8 bytes.`);
  return text;
}
// Endpoints must be plain HTTP(S) with no credentials, so the browser can call them without executing anything.
export function serviceUrl(value, label = "Service endpoint", { optional = false } = {}) {
  const text = String(value ?? "").trim();
  if (!text && optional) return "";
  let url;
  try { url = new URL(text); } catch { throw new Error(`${label} must be a complete HTTP(S) URL.`); }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error(`${label} must be HTTP(S) without credentials.`);
  return url.href;
}
export function priceValue(value, { optional = false } = {}) {
  const text = String(value ?? "").trim();
  if (!text && optional) return "";
  if (!/^\d+(\.\d{1,6})?$/.test(text) || /^0+(\.0+)?$/.test(text)) throw new Error("Price must be a positive mUSD amount with at most 6 decimals.");
  return text;
}
export function skillList(value) {
  const raw = Array.isArray(value) ? value : String(value ?? "").split(",");
  const out = [];
  for (const item of raw) {
    const skill = String(item).trim().toLowerCase();
    if (!skill) continue;
    if (!/^[\p{L}\p{N}][\p{L}\p{N} ._+-]*$/u.test(skill) || bytes(skill) > LIMITS.skill) throw new Error(`Skill "${skill.slice(0, 40)}" must be a short tag (letters, digits, space . _ + -).`);
    if (!out.includes(skill)) out.push(skill);
  }
  if (out.length > LIMITS.skills) throw new Error(`List at most ${LIMITS.skills} skills.`);
  return out;
}
function whole(value, label, min, max) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  return n;
}

export function buildCard(input) {
  const card = {
    schemaVersion: CARD_SCHEMA,
    name: words(input.name, LIMITS.name, "Name"),
    description: words(input.description, LIMITS.description, "Description"),
    service: { endpoint: serviceUrl(input.endpoint) },
    skills: skillList(input.skills),
    pricing: { amount: priceValue(input.price), token: "mUSD", decimals: 6, unit: "job" },
    payment: { escrow: { submitMinutes: whole(input.submitMinutes ?? 60, "Submit time", 2, 10080), reviewWindowSeconds: whole(input.reviewWindowSeconds ?? 600, "Review window", 1, 2592000) } },
    registrations: [{ network: "eip155:11155111" }],
  };
  const x402 = serviceUrl(input.x402, "Pay-per-call endpoint", { optional: true });
  if (x402) card.payment.x402 = { endpoint: x402, amount: priceValue(input.x402Price || input.price) };
  return card;
}

// Accepts agentledger-card-v1 and the older example shape ({name, description, url, capabilities}).
// Unknown or invalid fields are dropped instead of rendered, so a hostile card can only show text.
export function parseCard(source) {
  let data = source;
  if (typeof source === "string") {
    if (bytes(source) > CARD_MAX_BYTES) throw new Error("The agent card exceeds 64 KB.");
    try { data = JSON.parse(source); } catch { throw new Error("The agent card is not valid JSON."); }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("The agent card must be a JSON object.");
  const soft = fn => { try { return fn(); } catch { return ""; } };
  const legacy = data.schemaVersion !== CARD_SCHEMA;
  const escrow = data.payment?.escrow || {};
  const card = {
    schema: legacy ? "legacy" : CARD_SCHEMA,
    name: soft(() => words(data.name, LIMITS.name, "Name")),
    description: soft(() => words(data.description, LIMITS.description, "Description")),
    endpoint: soft(() => serviceUrl(data.service?.endpoint ?? (legacy ? data.url : ""))),
    skills: soft(() => skillList(data.skills ?? data.capabilities ?? [])) || [],
    price: data.pricing?.token === undefined || data.pricing?.token === "mUSD" ? soft(() => priceValue(data.pricing?.amount)) : "",
    submitMinutes: soft(() => whole(escrow.submitMinutes, "Submit time", 2, 10080)) || null,
    reviewWindowSeconds: escrow.reviewWindowSeconds === undefined ? null : soft(() => String(whole(escrow.reviewWindowSeconds, "Review window", 1, 2592000))) || null,
    x402: soft(() => serviceUrl(data.payment?.x402?.endpoint)) || "",
    x402Price: soft(() => priceValue(data.payment?.x402?.amount)) || "",
  };
  if (card.reviewWindowSeconds !== null) card.reviewWindowSeconds = Number(card.reviewWindowSeconds);
  return card;
}

// Prefill for the escrow form. The provider wallet always comes from ownerOf, never from the card.
export function hirePrefill(agent, card) {
  return {
    provider: agent.owner,
    providerAgentId: String(agent.id),
    amount: card?.price || "1",
    minutes: String(card?.submitMinutes || 60),
    reviewWindow: String(card?.reviewWindowSeconds ?? 600),
  };
}

// HTTP(S) cards are fetched directly; IPFS cards through a public gateway (content is still unverified).
export function cardFetchUrl(uri, gateway = "https://ipfs.io/ipfs/") {
  try {
    const url = new URL(uri);
    if (url.username || url.password) return null;
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
    if (url.protocol === "ipfs:") { const path = (url.host + url.pathname).replace(/^\/+/, ""); return path ? gateway + path : null; }
  } catch { /* Not a URL. */ }
  return null;
}
