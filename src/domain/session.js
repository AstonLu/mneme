// One swiping session: the cards, the card on top, and the one below it. Pure.
import { chooseNext, recordSwipe } from "./rank.js";

let serial = 0;
const entry = (id, reason) => ({ key: `${id}-${(serial += 1)}`, id, reason });

function draw(cards, recentIds, { now, random }) {
  const picked = chooseNext(cards, { now, recentIds, random });
  return picked && entry(picked.card.id, picked.reason);
}

export function startSession(cards, ctx, recent = []) {
  const top = draw(cards, recent, ctx);
  const under = top && draw(cards, [...recent, top.id], ctx);
  return { cards, top, under, recent };
}

/** Returns the next session and the patch to save. */
export function swipe(session, direction, ctx) {
  const { id } = session.top;
  const card = session.cards.find((c) => c.id === id);
  const patch = recordSwipe(card, direction, ctx.now);
  const cards = session.cards.map((c) => (c.id === id ? { ...c, ...patch } : c));
  const recent = [...session.recent, id].slice(-12);
  const top = session.under;
  return { patch, session: { cards, top, under: draw(cards, [...recent, top.id], ctx), recent } };
}

/** A new card is the next one to appear. */
export function addToSession(session, card, ctx) {
  const cards = [...session.cards, card];
  if (!session.top) return { ...startSession(cards, ctx, session.recent), top: entry(card.id, "fresh") };
  return { ...session, cards, under: entry(card.id, "fresh") };
}

export function removeFromSession(session, id, ctx) {
  const cards = session.cards.filter((c) => c.id !== id);
  const recent = session.recent.filter((x) => x !== id);
  if (session.top?.id === id) return startSession(cards, ctx, recent);
  const under = session.under?.id === id ? draw(cards, [...recent, session.top.id], ctx) : session.under;
  return { ...session, cards, recent, under };
}

export function patchCard(session, id, patch) {
  return { ...session, cards: session.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
}
