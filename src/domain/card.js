import { cleanTemplate } from "./templates.js";

// The card shape that every screen uses, whatever the stored version looks like.
const millis = (v) => (typeof v === "number" ? v : v?.toMillis?.() ?? null);

/** Cards saved before 2026-11 use boostCount and noteCount. */
export function normalizeCard(raw) {
  const { boostCount, noteCount, ...rest } = raw;
  return {
    ...rest,
    content: raw.content || "",
    link: raw.link || "",
    imageUrl: raw.imageUrl || null,
    art: raw.art || null,
    template: cleanTemplate(raw.template),
    author: raw.author || "",
    handle: raw.handle || "",
    tiny: raw.tiny || null,
    likes: raw.likes ?? boostCount ?? 0,
    skips: raw.skips ?? noteCount ?? 0,
    lastSeenAt: millis(raw.lastSeenAt),
    createdAt: millis(raw.createdAt),
  };
}

export function isWebLink(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
