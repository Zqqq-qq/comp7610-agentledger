// Marketplace filtering and ordering for the agents loaded on the current registry page. Pure; no network access.
export const SORTS = Object.freeze({
  newest: (a, b) => cmp(b.id, a.id),
  score: (a, b) => cmp(b.count ? b.average : -1n, a.count ? a.average : -1n) || cmp(b.count, a.count) || cmp(a.id, b.id),
  reviews: (a, b) => cmp(b.count, a.count) || cmp(b.average, a.average) || cmp(a.id, b.id),
  price: (a, b) => priceOrder(a) - priceOrder(b) || cmp(a.id, b.id),
});
function cmp(a, b) { const x = BigInt(a ?? 0), y = BigInt(b ?? 0); return x === y ? 0 : x > y ? 1 : -1; }
function priceOrder(agent) { const p = Number(agent.card?.price); return Number.isFinite(p) && p > 0 ? p : Number.POSITIVE_INFINITY; }

export function marketView(agents, { query = "", owner = "", minScore = 0, minReviews = 0, skill = "", sort = "newest" } = {}) {
  const q = query.trim().toLowerCase(), tag = skill.trim().toLowerCase(), min = BigInt(minScore), reviews = BigInt(minReviews);
  const ordered = agents.filter(a => {
    const card = a.card || {};
    if (q && !`${a.id} ${a.owner} ${a.uri} ${card.name || ""} ${card.description || ""}`.toLowerCase().includes(q)) return false;
    if (owner && a.owner.toLowerCase() !== owner.toLowerCase()) return false;
    if (min > 0n && (BigInt(a.count) === 0n || BigInt(a.average) < min)) return false;
    if (BigInt(a.count) < reviews) return false;
    if (tag && !(card.skills || []).some(s => s.includes(tag))) return false;
    return true;
  });
  return ordered.sort(SORTS[sort] || SORTS.newest);
}
export function skillCloud(agents, limit = 12) {
  const counts = new Map();
  for (const a of agents) for (const s of a.card?.skills || []) counts.set(s, (counts.get(s) || 0) + 1);
  return [...counts].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, limit).map(([skill, count]) => ({ skill, count }));
}
