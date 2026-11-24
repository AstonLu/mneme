import { useEffect, useState } from "react";
import { isDarkBottom } from "./image";

/** Class names for icons on clear glass: white icons where the color below is dark. */
export function useTone(card) {
  const tiny = card?.tiny;
  // Text under a picture sits on a 68% white wash, so it is always light there.
  const washed = Boolean(card?.content && !card.art);
  const [tone, setTone] = useState({ tiny: null });
  useEffect(() => {
    if (!tiny) return undefined;
    let live = true;
    Promise.all([isDarkBottom(tiny, washed ? 0.68 : 0.2), isDarkBottom(tiny, washed ? 0.45 : 0.25)])
      .then(([below, page]) => { if (live) setTone({ tiny, below, page }); }, () => {});
    return () => { live = false; };
  }, [tiny, washed]);
  if (!tiny || tone.tiny !== tiny) return "";
  return `${tone.below ? "dark-card" : ""} ${tone.page ? "dark-page" : ""}`;
}
