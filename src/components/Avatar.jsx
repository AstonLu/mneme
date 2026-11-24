import { useId } from "react";
import { letterLight } from "../lib/light";

const INK = "#2a2b33";
const Eye = ({ x, y, r = 5.4 }) => <><ellipse cx={x} cy={y} rx={r} ry={r * 1.25} fill={INK} /><circle cx={x + 1.7} cy={y - 2.4} r="1.8" fill="#fff" /></>;
const Line = ({ d, w = 3.6 }) => <path d={d} fill="none" stroke={INK} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
const Cheeks = ({ y, a, b }) => <g fill="#ff6f6f" opacity=".38"><ellipse cx={a} cy={y} rx="6" ry="4" /><ellipse cx={b} cy={y} rx="6" ry="4" /></g>;
const Eyes = ({ children }) => <g className="eyes">{children}</g>;

// [back, light, dark, drawing]. The names are in src/domain/avatars.js.
const CHARACTERS = {
  bean: ["#ffe3d6", "#ffb08f", "#f0764f", (f) => <>
    <path transform="rotate(-9 60 62)" d="M58 25c25 0 38 17 37 38-1 22-15 34-36 34-22 0-35-12-35-33 0-22 11-39 34-39z" fill={f} />
    <Eyes><Eye x={49} y={58} /><Eye x={71} y={56} /></Eyes><Line d="M53 70q8 7 15-1" /><Cheeks y={68} a={39} b={81} />
  </>],
  cloud: ["#dcebff", "#b7d7ff", "#6ea5f2", (f) => <>
    <path d="M36 86c-12 0-19-8-19-18s7-17 16-18c2-13 12-21 24-21 11 0 20 6 23 16 13 0 23 8 23 20 0 13-9 21-22 21z" fill={f} />
    <Line d="M42 61q5-7 10 0M66 61q5-7 10 0" /><Line d="M54 70q5 5 10 0" /><Cheeks y={70} a={38} b={81} />
  </>],
  sprout: ["#e6f3d4", "#bfe08a", "#78b54a", (f) => <>
    <path d="M60 40c0-8-1-12-3-17" fill="none" stroke="#4f8a35" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M57 25C49 25 41 20 39 11c10-1 18 4 18 14z" fill="#5d9c3e" /><path d="M58 25c0-9 8-15 20-14-1 10-9 16-20 14z" fill="#76b650" />
    <circle cx="60" cy="69" r="33" fill={f} />
    <Eyes><Eye x={49} y={63} r={6} /><Eye x={72} y={63} r={6} /></Eyes><Line d="M56 77h8" /><Cheeks y={74} a={38} b={82} />
  </>],
  drop: ["#d6f3f1", "#8fe3dc", "#2ba9a6", (f) => <>
    <path d="M60 14c4 13 32 34 32 57a32 32 0 0 1-64 0c0-23 28-44 32-57z" fill={f} />
    <Eyes><Eye x={49} y={66} /><Eye x={71} y={66} /></Eyes><ellipse cx="60" cy="80" rx="4.6" ry="5.6" fill={INK} /><Cheeks y={77} a={39} b={81} />
  </>],
  star: ["#fff1c4", "#ffe078", "#f2b020", (f) => <>
    <path d="M60 24l11 23 26 4-19 18 5 26-23-12-23 12 5-26-19-18 26-4z" fill={f} stroke={f} strokeWidth="14" strokeLinejoin="round" />
    <Eyes><Eye x={50} y={59} /></Eyes><Line d="M65 60q5-5 10 0" /><Line d="M53 69q8 9 15 0" /><Cheeks y={69} a={42} b={79} />
  </>],
  moon: ["#e8e0fa", "#cdb8fa", "#8a6bd8", (f) => <>
    <path d="M71 18A44 44 0 1 0 103 74 37 37 0 0 1 71 18z" fill={f} />
    <Line d="M35 63q5 5 10 0M56 68q5 5 10 0" /><Line d="M46 79q4 3 8 1" /><Cheeks y={74} a={33} b={66} />
    <Line d="M83 24h9l-9 10h9" w={3} /><Line d="M97 42h6l-6 7h6" w={2.4} />
  </>],
};

/** A chosen character, or the first letter of the code. */
export default function Avatar({ code = "", avatar, size = 44, pop = false }) {
  const id = useId();
  const box = { width: size, height: size };
  const character = CHARACTERS[avatar];
  if (!character) {
    return (
      <span className="avatar" style={{ ...box, fontSize: size * 0.4, backgroundImage: letterLight(code) }} aria-hidden="true">
        {[...code][0]?.toUpperCase()}
      </span>
    );
  }
  const [back, light, dark, draw] = character;
  return (
    <span key={avatar} className={pop ? "avatar pop" : "avatar"} style={box} aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <defs>
          <radialGradient id={id} gradientUnits="userSpaceOnUse" cx="46" cy="36" r="72"><stop stopColor={light} /><stop offset="1" stopColor={dark} /></radialGradient>
        </defs>
        <rect width="120" height="120" fill={back} />
        {draw(`url(#${id})`)}
      </svg>
    </span>
  );
}
