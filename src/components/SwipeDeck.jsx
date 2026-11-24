import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { CardFace } from "./CardFace";

const EDGE = 24; // Safari owns the screen edge for back and forward
const stacked = (p) => `translateY(${28 * (1 - p)}px) scale(${0.94 + 0.06 * p})`;
const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Two live cards: top and under. The next card accepts a grab at once while the old one finishes flying.
 * onSignal(q): drag progress from -1 to 1. onSettle(): a drag was let go without a swipe.
 */
export default function SwipeDeck({ cards, top, under, onSwipe, onSignal, onSettle, ref }) {
  const [leaving, setLeaving] = useState([]);
  const topRef = useRef(null);
  const underRef = useRef(null);

  const leave = useCallback((direction, entry, card) => {
    setLeaving((list) => [...list, { entry, card }]);
    onSwipe(direction);
  }, [onSwipe]);
  const gone = useCallback((key) => setLeaving((list) => list.filter((x) => x.entry.key !== key)), []);
  const peek = useCallback((p) => { if (underRef.current) underRef.current.style.transform = stacked(p); }, []);

  useImperativeHandle(ref, () => ({ swipe: (direction) => topRef.current?.swipe(direction) }), []);

  const find = (id) => cards.find((c) => c.id === id);
  const items = [
    under && { entry: under, card: find(under.id), role: "under" },
    { entry: top, card: find(top.id), role: "top" },
    ...leaving.map((x) => ({ ...x, role: "leaving" })),
  ].filter(Boolean);

  return (
    <div className="deck">
      {items.map(({ entry, card, role }) => (
        <SwipeCard key={entry.key} entry={entry} card={card} role={role} handle={role === "top" ? topRef : null}
          nodeRef={role === "under" ? underRef : null} peek={peek} onLeave={leave} onGone={gone} onSignal={onSignal} onSettle={onSettle} />
      ))}
    </div>
  );
}

function SwipeCard({ entry, card, role, handle, nodeRef, peek, onLeave, onGone, onSignal, onSettle }) {
  const node = useRef(null);
  const drag = useRef({ pid: null, sx: 0, sy: 0, x: 0, locked: false, samples: [], left: false });
  const wasUnder = useRef(role === "under");

  useLayoutEffect(() => {
    if (role === "under") {
      node.current.style.transform = stacked(0);
    } else if (role === "top" && wasUnder.current) {
      wasUnder.current = false;
      node.current.style.transition = calm() ? "" : "transform 180ms cubic-bezier(.22,1,.36,1)";
      node.current.style.transform = stacked(1);
    }
  }, [role]);

  useEffect(() => {
    if (!nodeRef) return undefined;
    const own = node.current;
    nodeRef.current = own;
    return () => { if (nodeRef.current === own) nodeRef.current = null; };
  }, [nodeRef]);

  const fly = useCallback((sign, velocity = 0) => {
    const d = drag.current;
    if (d.left) return;
    d.left = true;
    d.pid = null;
    const el = node.current;
    const width = el.clientWidth;
    const to = sign * width * 1.35;
    // Continue at release speed (px/ms), within a short, steady range.
    const ms = calm() ? 120 : Math.max(160, Math.min(320, Math.abs(to - d.x) / Math.max(Math.abs(velocity), 1.2)));
    const frames = calm() ? [{ opacity: 1 }, { opacity: 0 }]
      : [{ transform: el.style.transform || "none" }, { transform: `translateX(${to}px) rotate(${sign * 14}deg)` }];
    const done = () => onGone(entry.key);
    el.animate(frames, { duration: ms, easing: "cubic-bezier(.2,.6,.4,1)", fill: "forwards" });
    // Not `finished`: that promise waits while the page is in the background.
    setTimeout(done, ms);
    onSignal(0);
    onLeave(sign > 0 ? "right" : "left", entry, card);
  }, [card, entry, onGone, onLeave, onSignal]);

  useImperativeHandle(handle, () => ({ swipe: (direction) => fly(direction === "right" ? 1 : -1) }), [fly]);

  const paint = () => {
    const { x } = drag.current;
    const width = node.current.clientWidth;
    const p = Math.min(Math.abs(x) / (width * 0.35), 1);
    node.current.style.transform = `translateX(${x}px) rotate(${calm() ? 0 : (x / width) * 10}deg)`;
    node.current.style.setProperty("--x", x / width);
    onSignal(Math.sign(x) * p);
    peek(p);
  };

  const onPointerDown = (e) => {
    const d = drag.current;
    if (role !== "top" || d.pid !== null || d.left || e.button) return;
    if (e.clientX < EDGE || e.clientX > window.innerWidth - EDGE) return;
    Object.assign(d, { pid: e.pointerId, sx: e.clientX, sy: e.clientY, locked: false, samples: [[e.timeStamp, 0]] });
    node.current.style.transition = "none";
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (e.pointerId !== d.pid) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.locked) {
      if (Math.hypot(dx, dy) < 8) return;
      // A vertical drag scrolls a long card.
      if (Math.abs(dx) < Math.abs(dy)) { d.pid = null; return; }
      d.locked = true;
      node.current.setPointerCapture(d.pid);
    }
    d.samples = [...d.samples.filter(([t]) => e.timeStamp - t < 100), [e.timeStamp, dx]];
    d.x = dx;
    paint();
  };
  const onPointerEnd = (e) => {
    const d = drag.current;
    if (e.pointerId !== d.pid) return;
    d.pid = null;
    if (!d.locked) return;
    const [t0, x0] = d.samples.find(([t]) => e.timeStamp - t < 100) ?? [e.timeStamp, d.x];
    const v = (d.x - x0) / Math.max(e.timeStamp - t0, 1);
    const flick = Math.abs(v) > 0.5 && Math.abs(d.x) > 24 && Math.sign(v) === Math.sign(d.x);
    if (e.type === "pointerup" && (Math.abs(d.x) > node.current.clientWidth * 0.28 || flick)) {
      fly(Math.sign(d.x), v);
      return;
    }
    onSettle();
    const from = node.current.style.transform;
    d.x = 0;
    paint();
    if (!calm()) {
      node.current.animate([{ transform: from }, { transform: "none" }], { duration: 260, easing: "cubic-bezier(.2,1.25,.4,1)" });
    }
  };
  // A drag that starts on a link must not open it.
  const onClickCapture = (e) => {
    if (drag.current.locked) { e.preventDefault(); e.stopPropagation(); drag.current.locked = false; }
  };

  return (
    <div ref={node} className={`card ${role}`} inert={role !== "top"} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} onClickCapture={onClickCapture}>
      <CardFace card={card} />
    </div>
  );
}
