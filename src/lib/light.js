// Text cards have no image to take light from, so each gets a fixed pair of colors.
const PAIRS = [["#f0b68b", "#a3b6ee"], ["#abd6bb", "#f0d488"], ["#cbb0ea", "#f2aea8"], ["#9bd0e0", "#dcc0f0"]];

export function lightOf(card) {
  if (card.tiny) return `url("${card.tiny}")`;
  const [a, b] = PAIRS[[...card.id].reduce((n, x) => n + x.charCodeAt(0), 0) % PAIRS.length];
  return `radial-gradient(at 15% 10%,${a},transparent 70%),radial-gradient(at 88% 90%,${b},transparent 70%),linear-gradient(#fff,#fff)`;
}

export const washOf = (card) => `linear-gradient(rgba(255,255,255,.35),rgba(255,255,255,.35)),${lightOf(card)}`;
