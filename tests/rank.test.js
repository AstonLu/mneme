import test from "node:test";
import assert from "node:assert/strict";
import { DAY, chooseNext, likeConfidence, likeRatio, recordSwipe, rested, sortCards, taste } from "../src/domain/rank.js";

function seeded(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}
const now = 1_800_000_000_000;

test("a swipe counts once, and old opinions fade by half in 90 days", () => {
  const c = recordSwipe({ id: "a", likes: 8, skips: 0, likeScore: 8, lastSeenAt: now - 90 * DAY }, "left", now);
  assert.deepEqual([c.likes, c.skips, c.lastSeenAt], [8, 1, now]);
  assert.ok(Math.abs(c.likeScore - 4) < 1e-9);
  assert.equal(c.skipScore, 1);
});

test("loved cards rest for less time than skipped cards", () => {
  const seen = { lastSeenAt: now - 0.5 * DAY };
  assert.ok(rested({ ...seen, likes: 9 }, now) > rested({ ...seen, skips: 9 }, now) * 3);
  assert.equal(rested({}, now), 1);
});

test("held-back cards do not come back; one or zero cards still work", () => {
  const cards = [..."abcdefgh"].map((id) => ({ id }));
  const random = seeded(1);
  for (let i = 0; i < 300; i++) {
    assert.ok(!["f", "g", "h"].includes(chooseNext(cards, { now, recentIds: ["f", "g", "h"], random }).card.id));
  }
  assert.equal(chooseNext([{ id: "x" }], { now, recentIds: ["x"] }).card.id, "x");
  assert.equal(chooseNext([], { now }), null);
  const two = [{ id: "a" }, { id: "b" }];
  for (let i = 0; i < 50; i++) assert.equal(chooseNext(two, { now, recentIds: ["a"], random }).card.id, "b");
});

test("60 simulated days: liked cards appear more, and every card still appears", () => {
  for (const seed of [2, 3, 4]) {
    const random = seeded(seed);
    let cards = Array.from({ length: 40 }, (_, i) => ({ id: `c${i}`, createdAt: now }));
    const loves = (id) => Number(id.slice(1)) < 20;
    const shown = {};
    const recentIds = [];
    for (let day = 0; day < 60; day++) {
      for (let k = 0; k < 30; k++) {
        const t = now + (day + (k < 15 ? 0.3 : 0.8)) * DAY + k * 5000;
        const { card } = chooseNext(cards, { now: t, recentIds, random });
        recentIds.push(card.id);
        shown[card.id] = (shown[card.id] || 0) + 1;
        const right = random() < (loves(card.id) ? 0.85 : 0.15);
        cards = cards.map((c) => (c.id === card.id ? { ...c, ...recordSwipe(c, right ? "right" : "left", t) } : c));
      }
    }
    const sum = (keep) => cards.filter((c) => keep(c.id)).reduce((n, c) => n + (shown[c.id] || 0), 0);
    const ratio = sum(loves) / sum((id) => !loves(id));
    assert.ok(ratio > 2, `liked/skipped exposure was ${ratio}`);
    assert.ok(cards.every((c) => shown[c.id] >= 3), "a card was starved");
  }
});

test("sorting: ratio uses confidence, unseen cards go last, other keys are plain", () => {
  const cards = [
    { id: "one", likes: 1, skips: 0, createdAt: 3 },
    { id: "many", likes: 19, skips: 1, createdAt: 1 },
    { id: "new", createdAt: 4 },
    { id: "bad", likes: 2, skips: 28, createdAt: 2 },
  ];
  const ids = (...a) => sortCards(cards, ...a).map((c) => c.id);
  assert.deepEqual(ids(), ["many", "one", "bad", "new"]);
  assert.deepEqual(ids("seen"), ["bad", "many", "one", "new"]);
  assert.deepEqual(ids("likes")[0], "many");
  assert.deepEqual(ids("added"), ["new", "one", "bad", "many"]);
  assert.deepEqual(ids("added", true), ["many", "bad", "one", "new"]);
  assert.equal(likeRatio({}), null);
  assert.ok(likeConfidence({ likes: 1 }) < 0.5);
  assert.equal(taste({}, now), 0.5);
});
