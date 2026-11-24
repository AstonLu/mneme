// Text cards look like the place the words came from. Pure: the worker also uses this.
export const TEMPLATES = { tweet: "貼文", thread: "串文", memo: "備忘錄", book: "書摘", lyric: "歌詞", plain: "純文字" };

export const cleanTemplate = (value) => (typeof value === "string" && Object.hasOwn(TEMPLATES, value) ? value : null);
export const templateOf = (card) => cleanTemplate(card.template) ?? "plain";

// A Latin letter takes about half the width of a Chinese one.
const widthOf = (text) => [...text].reduce((n, c) => n + (c.charCodeAt(0) < 256 ? 0.55 : 1), 0);

const SIZES = {
  lyric: [[12, 52], [24, 42], [60, 32], [Infinity, 24]],
  book: [[90, 21], [Infinity, 18]],
  memo: [[45, 20], [Infinity, 18]],
  plain: [[12, 32], [45, 26], [100, 21], [Infinity, 18]],
  post: [[12, 25], [45, 22], [120, 19], [Infinity, 17]],
};
/** Font size on a card that is 353 px wide. */
export function fontSize(template, text) {
  const width = widthOf(text);
  return (SIZES[template] ?? SIZES.post).find(([max]) => width <= max)[1];
}

/** One idea per line. Short lyrics also break at commas. */
export function lyricLines(text) {
  const parts = text.match(widthOf(text) <= 24 ? /[^\n。！？，]+[。！？，」』）]*/g : /[^\n。！？]+[。！？」』）]*/g) ?? [text];
  return parts.map((line) => line.trim().replace(/[。，]$/, "")).filter(Boolean);
}

/** A blank line starts a new post. */
export const threadParts = (text) => text.split(/\n\s*\n+/).filter((part) => part.trim());

/** The account and the template that a post link gives. Other links give neither. */
export function linkSource(link) {
  let url;
  try {
    url = new URL(link);
  } catch {
    return { handle: "", template: null };
  }
  const site = url.hostname.match(/(?:^|\.)(x\.com|twitter\.com|threads\.com|threads\.net)$/)?.[1];
  const handle = site && url.pathname.match(/^\/@?([\w.]+)\//)?.[1];
  if (!handle || handle === "i") return { handle: "", template: null };
  return { handle, template: site.startsWith("threads") ? "thread" : "tweet" };
}
