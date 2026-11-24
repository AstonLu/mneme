// The light of a card: one calm color, taken from the card itself.
import { useEffect, useState } from "react";
import { templateOf } from "../domain/templates";
import { edgeOf } from "./image";

const LYRICS = ["#5a1f33", "#1e3f66", "#1d4a3a", "#47306b"];
const POST = { tweet: "#8ba3b3", thread: "#e3e3e3" };
const WASH = { tweet: "#cdd7dd", thread: "#d2d2d2", memo: "#e0dfdc", book: "#dcdcdc", plain: "#dedddb" };
const PLAIN = "#d3d2cf";

const pick = (list, text) => list[[...text].reduce((n, x) => n + x.charCodeAt(0), 0) % list.length];

/** The color of a template card. It follows the words, so the preview and the saved card look the same. */
export const backOf = (card) => POST[templateOf(card)] ?? pick(LYRICS, card.content);

function washOfText(card) {
  const template = templateOf(card);
  return WASH[template] ?? `color-mix(in srgb, ${pick(LYRICS, card.content)} 44%, #f6f5f4)`;
}

/** The page color for a card. An image gives the color of its edge, made light. */
export function useWash(card) {
  const tiny = card?.imageUrl ? card.tiny : null;
  const [found, setFound] = useState({ tiny: null });
  useEffect(() => {
    if (!tiny) return undefined;
    let live = true;
    edgeOf(tiny).then((color) => { if (live) setFound({ tiny, color }); }, () => {});
    return () => { live = false; };
  }, [tiny]);
  if (!card) return PLAIN;
  if (!card.imageUrl) return washOfText(card);
  return found.tiny && found.tiny === tiny ? found.color : PLAIN;
}

const PAIRS = [["#f0b68b", "#a3b6ee"], ["#abd6bb", "#f0d488"], ["#cbb0ea", "#f2aea8"], ["#9bd0e0", "#dcc0f0"]];
/** The back of a letter avatar, for a person who has not chosen a character. */
export function letterLight(code) {
  const [a, b] = pick(PAIRS, code);
  return `radial-gradient(at 15% 10%,${a},transparent 70%),radial-gradient(at 88% 90%,${b},transparent 70%),linear-gradient(#fff,#fff)`;
}
