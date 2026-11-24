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

// Text longer than this with no image becomes a scrolling card without a layout.
export const LONG_TEXT = 100;
export const isLongText = (card) => !card.imageUrl && card.content.length > LONG_TEXT;
