import { isWebLink } from "../src/domain/card.js";

const number = (v, min, max, fallback) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback);

function cleanArt(art) {
  if (!art?.image || !art?.text) return null;
  const { image, text } = art;
  return {
    image: { x: number(image.x, 0, 100, 50), y: number(image.y, 0, 100, 50), s: number(image.s, 30, 260, 100) },
    text: {
      x: number(text.x, 0, 100, 50), y: number(text.y, 0, 100, 50), size: number(text.size, 4, 18, 9),
      color: text.color === "paper" ? "paper" : "ink", plate: Boolean(text.plate),
    },
  };
}

/** Keeps only known fields. Returns null when there is nothing to save. */
export function cleanCard(raw, hasImage, now) {
  const content = typeof raw?.content === "string" ? raw.content.trim().slice(0, 5000) : "";
  if (!raw || (!content && !hasImage)) return null;
  const tiny = typeof raw.tiny === "string" && raw.tiny.length < 3000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(raw.tiny);
  return {
    content, link: isWebLink(raw.link) ? raw.link.slice(0, 2000) : "", art: cleanArt(raw.art), tiny: tiny ? raw.tiny : null, createdAt: now,
  };
}
