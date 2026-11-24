import { normalizeCard } from "../domain/card";
import { DAY } from "../domain/rank";
import { demoCards } from "./demoCards";

// Example history: [likes, skips, added days ago, last seen days ago]
const HISTORY = {
  walk: [22, 2, 160, 3], tide: [9, 6, 120, 20], list: [14, 3, 95, 1], lamp: [31, 9, 210, 2], ridge: [3, 11, 80, 12],
  seed: [5, 0, 30, 18], short: [40, 22, 240, 1], medium: [12, 1, 60, 33], link: [1, 0, 6, 5], long: [2, 8, 45, 9],
};

// In memory only: a reload restores the sample cards. Nothing leaves the browser.
export function createDemoStore() {
  const now = Date.now();
  let signedIn = true;
  let people = [{ id: "a", code: "sample", canDelete: false }];
  let cards = demoCards.map((c) => {
    const [likes, skips, added, seen] = HISTORY[c.id.replace("demo-", "")];
    return normalizeCard({ ...c, likes, skips, createdAt: now - added * DAY, lastSeenAt: now - seen * DAY });
  });
  return {
    auth: {
      async signIn() { signedIn = true; },
      async signOut() { signedIn = false; },
    },
    people: {
      async list() { return people; },
      async add(code) {
        const person = { id: crypto.randomUUID(), code: code.trim().toLowerCase(), canDelete: false };
        people = [...people, person];
        return person;
      },
      async setCanDelete(id, canDelete) { people = people.map((p) => (p.id === id ? { ...p, canDelete } : p)); },
      async remove(id) { people = people.filter((p) => p.id !== id); },
    },
    async load() {
      if (!signedIn) throw Object.assign(new Error("signed out"), { status: 401 });
      return { me: { code: "demo", owner: true, canDelete: true }, cards };
    },
    async addCard({ blob, imageUrl, ...draft }) {
      const card = normalizeCard({
        ...draft, id: `demo-${crypto.randomUUID()}`, createdAt: Date.now(),
        imageUrl: blob ? URL.createObjectURL(blob) : imageUrl,
      });
      cards = [...cards, card];
      return card;
    },
    async swipeCard(id, direction, patch) {
      cards = cards.map((c) => (c.id === id ? { ...c, ...patch } : c));
    },
    async deleteCard({ id }) {
      cards = cards.filter((c) => c.id !== id);
    },
  };
}
