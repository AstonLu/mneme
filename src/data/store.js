// The only place that chooses a data source. Screens receive data and do not know which one it is.
// Store: { load(): { me, cards }, addCard(draft), swipeCard(id, direction, patch), deleteCard(card),
// setTemplate(id, template), setAvatar(avatar) }
// Store.auth is { signIn(code), signOut() }. Store.people, for the owner: { list, add, setCanDelete, remove }.
// me is { code, owner, canDelete, avatar }. Calls without a valid code throw status 401.
// A draft is a card without id, plus `blob` when it has an image. addCard resolves to the saved card.
// `vite --mode demo` uses in-memory sample cards. Other builds do not contain them.
export function loadStore() {
  if (import.meta.env.MODE === "demo") {
    return import("../demo/demoStore").then((m) => m.createDemoStore());
  }
  return import("./cloudStore").then((m) => m.cloudStore);
}
