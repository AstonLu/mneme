import test from "node:test";
import assert from "node:assert/strict";
import { isWebLink, normalizeCard } from "../src/domain/card.js";
import { addToSession, removeFromSession, startSession, swipe } from "../src/domain/session.js";

const ctx = { now: 1_800_000_000_000, random: Math.random };
const make = (ids) => [...ids].map((id) => normalizeCard({ id }));

test("old cards keep their counts under the new names", () => {
  const c = normalizeCard({ id: "a", boostCount: 4, noteCount: 2, createdAt: { toMillis: () => 5 } });
  assert.deepEqual([c.likes, c.skips, c.createdAt, "boostCount" in c], [4, 2, 5, false]);
});

test("a swipe promotes the visible next card and saves only the swiped one", () => {
  const s = startSession(make("abcdef"), ctx);
  assert.notEqual(s.top.id, s.under.id);
  const r = swipe(s, "right", ctx);
  assert.equal(r.session.top, s.under);
  assert.notEqual(r.session.under.id, r.session.top.id);
  assert.equal(r.patch.likes, 1);
  assert.equal(r.session.cards.reduce((n, c) => n + c.likes, 0), 1);
});

test("a new card comes next, also when the library was empty", () => {
  const card = normalizeCard({ id: "n" });
  assert.equal(addToSession(startSession(make("abc"), ctx), card, ctx).under.id, "n");
  assert.equal(addToSession(startSession([], ctx), card, ctx).top.id, "n");
});

test("deleting the top, the next, and the last card never leaves a dead card on screen", () => {
  let s = startSession(make("abcd"), ctx);
  while (s.cards.length) {
    const id = s.cards.length % 2 ? s.top.id : s.under.id;
    s = removeFromSession(s, id, ctx);
    const left = new Set(s.cards.map((c) => c.id));
    for (const e of [s.top, s.under]) if (e) assert.ok(left.has(e.id));
  }
  assert.equal(s.top, null);
  assert.equal(s.under, null);
});

test("one card can be swiped again and again", () => {
  let s = startSession(make("a"), ctx);
  for (let i = 0; i < 3; i++) s = swipe(s, "left", ctx).session;
  assert.equal(s.cards[0].skips, 3);
});

test("only http and https links are accepted", () => {
  assert.ok(isWebLink("https://example.com"));
  for (const bad of ["javascript:alert(1)", "example.com", "", undefined]) assert.equal(isWebLink(bad), false);
});
