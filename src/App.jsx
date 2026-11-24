import { useCallback, useEffect, useRef, useState } from "react";
import { loadStore } from "./data/store";
import { addToSession, patchCard, removeFromSession, startSession, swipe } from "./domain/session";
import { tinyOf } from "./lib/image";
import { useWash } from "./lib/light";
import AddCard from "./pages/AddCard";
import Collection from "./pages/Collection";
import { liftLaunch } from "./lib/launch";
import Deck from "./pages/Deck";
import SignIn from "./pages/SignIn";

const context = () => ({ now: Date.now(), random: Math.random });

export default function App() {
  const [view, setView] = useState("deck"); // deck | collection
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState("loading"); // loading | signedout | ready | error
  const [session, setSession] = useState(null);
  const [message, setMessage] = useState("");
  const current = useRef(null);
  const store = useRef(null);
  const run = useRef(0); // a newer load or a sign-out cancels an older load
  const [me, setMe] = useState(null);

  // The ref lets fast swipes build on each other before React renders.
  const commit = useCallback((next) => {
    current.current = next;
    setSession(next);
  }, []);

  const clear = useCallback(() => {
    run.current += 1;
    commit(null);
    setMe(null);
    setAdding(false);
    setView("deck");
    setMessage("");
    setStatus("signedout");
  }, [commit]);

  /** Keeps the current screen until the cards are here. */
  const load = useCallback(async () => {
    const mine = (run.current += 1);
    const stale = () => mine !== run.current;
    try {
      store.current ??= await loadStore();
      const { me: person, cards } = await store.current.load();
      if (stale()) return;
      setMe(person);
      commit(startSession(cards, context()));
      setStatus("ready");
      for (const card of cards) {
        if (card.imageUrl && !card.tiny) {
          tinyOf(card.imageUrl).then((tiny) => { if (tiny && !stale()) commit(patchCard(current.current, card.id, { tiny })); });
        }
      }
    } catch (err) {
      if (stale()) return;
      if (err.status === 401) { clear(); return; }
      console.error(err);
      setStatus("error");
    }
  }, [commit, clear]);

  useEffect(() => { load(); }, [load]);

  const topId = session?.top?.id;
  const wash = useWash(session?.cards.find((c) => c.id === topId));
  useEffect(() => {
    if (status !== "loading") liftLaunch(current.current?.cards.find((c) => c.id === topId)?.imageUrl);
  }, [status, topId]);

  const signIn = (code) => store.current.auth.signIn(code);
  const signOut = async () => {
    await store.current.auth.signOut();
    clear();
  };
  const retry = () => {
    setStatus("loading");
    load();
  };

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(""), 2400);
    return () => clearTimeout(timer);
  }, [message]);

  const handleSwipe = useCallback(async (direction) => {
    const { id } = current.current.top;
    const { session: next, patch } = swipe(current.current, direction, context());
    commit(next);
    try {
      await store.current.swipeCard(id, direction, patch);
    } catch (err) {
      console.error(err);
      if (err.status === 401) clear();
      else setMessage("上一次滑卡沒有存到");
    }
  }, [commit, clear]);

  const handleAdd = async (draft) => {
    const card = await store.current.addCard(draft);
    commit(addToSession(current.current, card, context()));
    setAdding(false);
    setView("deck");
    setMessage("已加入");
  };

  const handleDelete = async (card) => {
    await store.current.deleteCard(card);
    commit(removeFromSession(current.current, card.id, context()));
    setMessage("已刪除");
  };

  const handleTemplate = async (card, template) => {
    const back = card.template;
    commit(patchCard(current.current, card.id, { template }));
    try {
      await store.current.setTemplate(card.id, template);
    } catch (err) {
      console.error(err);
      if (err.status === 401) { clear(); return; }
      if (current.current?.cards.find((c) => c.id === card.id)?.template === template) {
        commit(patchCard(current.current, card.id, { template: back }));
      }
      setMessage("模板沒有存到");
    }
  };

  const handleAvatar = async (avatar) => {
    await store.current.setAvatar(avatar);
    setMe((person) => ({ ...person, avatar }));
  };

  const getPeople = useCallback(() => store.current.people, []);
  const closeView = useCallback(() => setView("deck"), []);

  if (status === "signedout") {
    return <div className="app"><SignIn onSignIn={signIn} onEnter={load} /></div>;
  }
  return (
    <div className="app" style={{ "--wash": wash }}>
      <Deck session={session} status={status} inert={view !== "deck" || adding} onSwipe={handleSwipe}
        onRetry={retry}
        onOpenAll={() => setView("collection")} onOpenAdd={() => setAdding(true)} />
      {view === "collection" && <Collection inert={adding} cards={session.cards} onDelete={handleDelete} me={me} getPeople={getPeople} onSignOut={signOut} onAdd={() => setAdding(true)} onTemplate={handleTemplate} onAvatar={handleAvatar} onClose={closeView} />}
      {adding && <AddCard onSave={handleAdd} onClose={() => setAdding(false)} />}
      {message && <p className="toast" role="status">{message}</p>}
    </div>
  );
}
