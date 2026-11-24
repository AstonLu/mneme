import { likeRatio } from "../domain/rank";

const date = new Intl.DateTimeFormat("zh-TW", { year: "numeric", month: "numeric", day: "numeric" });
export const formatDay = (t) => (t ? date.format(t) : "沒有紀錄");
export function formatRatio(card) {
  const ratio = likeRatio(card);
  return ratio === null ? "尚無" : `${Math.round(ratio * 100)}%`;
}
