import { normalizeCard } from "../domain/card";

async function call(path, options) {
  const response = await fetch(`/api/${path}`, options);
  if (response.ok) return response.json();
  throw Object.assign(new Error(`${path}: ${response.status}`), { status: response.status });
}
const json = (method, body) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const cloudStore = {
  auth: {
    signIn: (code) => call("session", json("POST", { code })),
    signOut: () => call("session", { method: "DELETE" }),
  },

  people: {
    list: () => call("people"),
    add: (code) => call("people", json("POST", { code })),
    setCanDelete: (id, canDelete) => call(`people/${id}`, json("PATCH", { canDelete })),
    remove: (id) => call(`people/${id}`, { method: "DELETE" }),
  },

  async load() {
    const { me, cards } = await call("cards");
    return { me, cards: cards.map(normalizeCard) };
  },

  async addCard({ content, link, art, tiny, blob }) {
    const form = new FormData();
    form.set("card", JSON.stringify({ content, link, art, tiny }));
    if (blob) form.set("image", blob, "image");
    return normalizeCard(await call("cards", { method: "POST", body: form }));
  },

  async swipeCard(id, direction) {
    await call(`cards/${id}/swipe`, json("POST", { direction }));
  },

  async deleteCard(card) {
    await call(`cards/${card.id}`, { method: "DELETE" });
  },
};
