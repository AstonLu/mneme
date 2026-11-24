import { useCallback, useEffect, useRef } from "react";
import { Light } from "../components/CardFace";
import Glass from "../components/Glass";
import Notice from "../components/Notice";
import SwipeDeck from "../components/SwipeDeck";
import { useTone } from "../lib/useTone";

export default function Deck({ session, status, onSwipe, onRetry, onOpenAll, onOpenAdd, inert }) {
  const root = useRef(null);
  const deck = useRef(null);
  const top = session?.top;

  const signal = useCallback((q) => {
    const { style } = root.current;
    style.setProperty("--r", Math.max(q, 0));
    style.setProperty("--l", Math.max(-q, 0));
  }, []);
  const settle = useCallback(() => {
    root.current.classList.add("settle");
    setTimeout(() => root.current?.classList.remove("settle"), 260);
  }, []);
  const handleSwipe = useCallback((direction) => {
    const right = direction === "right";
    root.current.querySelector(right ? ".er" : ".el").animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380 });
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.current.querySelector(right ? ".yes" : ".no")
        .animate([{ scale: 1 }, { scale: 1.2 }, { scale: 1 }], { duration: 300, easing: "ease-out" });
    }
    onSwipe(direction);
  }, [onSwipe]);

  useEffect(() => {
    if (inert) return undefined;
    const onKey = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") deck.current?.swipe("left");
      if (e.key === "ArrowRight") deck.current?.swipe("right");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inert]);

  const topCard = top && session.cards.find((c) => c.id === top.id);
  const tone = useTone(topCard);

  let notice = null;
  if (status === "loading") notice = <Notice title="載入中" />;
  else if (status === "error") notice = <Notice title="卡片讀取失敗" detail="請檢查網路" action="重試" onAction={onRetry} />;
  else if (!top) notice = <Notice title="還沒有卡片" action="新增第一張" onAction={onOpenAdd} />;

  return (
    <main ref={root} className={`page ${tone}`} inert={inert}>
      {topCard && <Light card={topCard} />}
      {notice ?? (
        <SwipeDeck ref={deck} cards={session.cards} top={top} under={session.under}
          onSwipe={handleSwipe} onSignal={signal} onSettle={settle} />
      )}
      <div className="edge er" />
      <div className="edge el" />
      <Glass icon="add" label="新增" className="corner add" disabled={status !== "ready"} onClick={onOpenAdd} />
      <Glass icon="no" label="略過" className="no" disabled={!top} onClick={() => deck.current?.swipe("left")} />
      <Glass icon="yes" label="多看到" className="yes" disabled={!top} onClick={() => deck.current?.swipe("right")} />
      <Glass icon="all" label="收藏" className="corner all" disabled={status !== "ready"} onClick={onOpenAll} />
    </main>
  );
}
