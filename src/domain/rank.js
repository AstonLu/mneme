// Which card comes next, and how the collection is sorted. Pure: pass in time and randomness.
// Card fields: likes, skips (lifetime counts), likeScore, skipScore (counts that fade), lastSeenAt, createdAt.

export const DAY = 86_400_000;
const HALF_LIFE = 90 * DAY; // an opinion counts half after 90 days
const SLOTS = { fresh: 0.2, lost: 0.15, wild: 0.05 }; // the rest goes to taste

export const seenCount = (c) => (c.likes || 0) + (c.skips || 0);
export const likeRatio = (c) => (seenCount(c) ? (c.likes || 0) / seenCount(c) : null);

function faded(card, now) {
  const f = card.lastSeenAt ? 0.5 ** (Math.max(now - card.lastSeenAt, 0) / HALF_LIFE) : 1;
  return { like: (card.likeScore ?? card.likes ?? 0) * f, skip: (card.skipScore ?? card.skips ?? 0) * f };
}

/** Expected chance of a like, 0 to 1. An unseen card starts at 0.5. */
export function taste(card, now) {
  const { like, skip } = faded(card, now);
  return (1 + like) / (2 + like + skip);
}

/** Fields that one swipe changes. */
export function recordSwipe(card, direction, now) {
  const { like, skip } = faded(card, now);
  const liked = direction === "right";
  return {
    likes: (card.likes || 0) + (liked ? 1 : 0),
    skips: (card.skips || 0) + (liked ? 0 : 1),
    likeScore: like + (liked ? 1 : 0),
    skipScore: skip + (liked ? 0 : 1),
    lastSeenAt: now,
  };
}

/** 0 right after a view, back to 1 with time. Loved cards recover in hours, skipped ones in days. */
export function rested(card, now) {
  if (!card.lastSeenAt) return 1;
  const days = 7 * (0.25 / 7) ** taste(card, now);
  return 1 - Math.exp(-Math.max(now - card.lastSeenAt, 0) / (days * DAY));
}

function normal(random) {
  return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
}
// Marsaglia-Tsang, valid for shape >= 1.
function gamma(shape, random) {
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    const x = normal(random);
    const v = (1 + c * x) ** 3;
    if (v > 0 && Math.log(1 - random()) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v;
  }
}
function sampleBeta(a, b, random) {
  const x = gamma(a, random);
  return x / (x + gamma(b, random));
}

const pickOne = (list, random) => list[Math.floor(random() * list.length)];

/**
 * Returns { card, reason } or null. reason: "fresh" | "lost" | "wild" | "taste".
 * recentIds: newest last. The latest cards are held back, so a small library never loops tightly.
 */
export function chooseNext(cards, { now, recentIds = [], random = Math.random }) {
  if (cards.length === 0) return null;
  const hold = Math.min(6, Math.floor((cards.length - 1) / 2));
  const floor = cards.length > 1 ? Math.max(hold, 1) : 0;
  const held = new Set(floor ? recentIds.slice(-floor) : []);
  const pool = cards.filter((c) => !held.has(c.id));

  const roll = random();
  if (roll < SLOTS.fresh) {
    const fresh = pool.filter((c) => seenCount(c) < 3);
    const least = Math.min(...fresh.map(seenCount));
    if (fresh.length) return { card: pickOne(fresh.filter((c) => seenCount(c) === least), random), reason: "fresh" };
  } else if (roll < SLOTS.fresh + SLOTS.lost) {
    const lost = pool.filter((c) => c.lastSeenAt && now - c.lastSeenAt > 14 * DAY && taste(c, now) >= 0.5);
    if (lost.length) return { card: lost.reduce((a, b) => (a.lastSeenAt < b.lastSeenAt ? a : b)), reason: "lost" };
  } else if (roll < SLOTS.fresh + SLOTS.lost + SLOTS.wild) {
    return { card: pickOne(pool, random), reason: "wild" };
  }
  let best = null;
  for (const card of pool) {
    const { like, skip } = faded(card, now);
    const score = sampleBeta(1 + like, 1 + skip, random) * (0.02 + 0.98 * rested(card, now));
    if (!best || score > best.score) best = { card, score };
  }
  return { card: best.card, reason: "taste" };
}

/** Wilson lower bound (95%): one like out of one does not beat nineteen out of twenty. */
export function likeConfidence(card) {
  const n = seenCount(card);
  if (!n) return -1;
  const z = 1.96;
  const p = likeRatio(card);
  return (p + z * z / (2 * n) - z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)) / (1 + z * z / n);
}

const SORT_KEYS = {
  ratio: likeConfidence,
  likes: (c) => c.likes || 0,
  seen: seenCount,
  added: (c) => c.createdAt || 0,
};
export function sortCards(cards, key = "ratio", ascending = false) {
  const value = SORT_KEYS[key];
  const sign = ascending ? 1 : -1;
  return [...cards].sort((a, b) => sign * (value(a) - value(b)) || (b.createdAt || 0) - (a.createdAt || 0));
}
