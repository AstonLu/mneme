import { useEffect } from "react";
import { fontSize, lyricLines, templateOf, threadParts } from "../domain/templates";
import { formatDay } from "../lib/format";
import { backOf } from "../lib/light";

const words = globalThis.Intl?.Segmenter && new Intl.Segmenter("zh-Hant", { granularity: "word" });
const OPEN = "「『（《";

/** Breaks only between words, so a Chinese word is never split over two lines. */
function Words({ text }) {
  if (!words) return text;
  const list = [...words.segment(text)];
  return list.map(({ segment, index, isWordLike }, i) => {
    const gap = i > 0 && (isWordLike || OPEN.includes(segment[0])) && !OPEN.includes(list[i - 1].segment.at(-1));
    return gap ? <span key={index}><wbr />{segment}</span> : segment;
  });
}

const ICONS = {
  reply: <path d="M12 4a8 8 0 0 1 0 16H4.5l1.8-2.900A8 8 0 0 1 12 4z" />,
  again: <path d="M5 14V8.500A2.500 2.500 0 0 1 7.500 6H17M14 3l3 3-3 3M19 10v5.500a2.500 2.500 0 0 1-2.500 2.500H7M10 21l-3-3 3-3" />,
  heart: <path d="M12 20s-7.500-4.600-7.500-10.200A4.200 4.200 0 0 1 12 7.200a4.200 4.200 0 0 1 7.500 2.600C19.500 15.400 12 20 12 20z" />,
  mark: <path d="M7 4h10v16l-5-4-5 4z" />,
  share: <path d="M12 15V4M8 7.500L12 3.500l4 4M5 13v6h14v-6" />,
  send: <path d="M21 4L3 10l7 3.500L13.500 21z" />,
  more: <><circle cx="12" cy="12" r="9" /><path d="M8 12h.01M12 12h.01M16 12h.01" strokeWidth="2.600" /></>,
  back: <path d="M14.500 5.500L8 12l6.500 6.500" />,
};
const Mini = ({ name }) => <svg viewBox="0 0 24 24">{ICONS[name]}</svg>;
const Acts = ({ names }) => <div className="acts" aria-hidden="true">{names.map((n) => <Mini key={n} name={n} />)}</div>;
const Person = () => (
  <i className="ph" aria-hidden="true"><svg viewBox="0 0 40 40"><g fill="currentColor"><circle cx="20" cy="15.500" r="6.500" /><path d="M7 40c0-9 5.500-14 13-14s13 5 13 14z" /></g></svg></i>
);

function Tweet({ card }) {
  return (
    <div className="slip">
      <div className="hd"><Person /><div><b>{card.author || card.handle || "作者"}</b>{card.handle && <span>@{card.handle}</span>}</div></div>
      <p><Words text={card.content} /></p>
      {card.createdAt && <div className="day">{formatDay(card.createdAt)}</div>}
      <Acts names={["reply", "again", "heart", "mark", "share"]} />
    </div>
  );
}

function Thread({ card }) {
  const parts = threadParts(card.content);
  return (
    <div className="slip">
      {parts.map((part, i) => (
        <div className="seg" key={i}>
          <div className="rail"><Person /></div>
          <div className="tx">
            <b>{card.handle || card.author || "作者"}</b>
            <p><Words text={part} /></p>
            {i === parts.length - 1 && <Acts names={["heart", "reply", "again", "send"]} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function Memo({ card }) {
  const [title, ...rest] = card.content.split(/\n+/);
  return (
    <>
      <div className="nav" aria-hidden="true"><span><Mini name="back" />備忘錄</span><Mini name="share" /><Mini name="more" /></div>
      {card.createdAt && <div className="stamp">{formatDay(card.createdAt)}</div>}
      <p className="ti"><Words text={title} /></p>
      {rest.length > 0 && <p><Words text={rest.join("\n")} /></p>}
    </>
  );
}

function Book({ card }) {
  // The serif font loads only when a book card is on screen.
  useEffect(() => { import("@fontsource/noto-serif-tc/500.css"); }, []);
  return (
    <>
      <div className="run">{card.author || card.handle}</div>
      {card.content.split(/\n+/).map((text, i) => <p key={i}>{text}</p>)}
    </>
  );
}

const Lyric = ({ card }) => <div className="in">{lyricLines(card.content).map((text, i) => <p key={i}><Words text={text} /></p>)}</div>;

function Plain({ card }) {
  const by = card.author || (card.handle && `@${card.handle}`);
  return <><p><Words text={card.content} /></p>{by && <div className="by">{by}</div>}</>;
}

const FACES = { tweet: Tweet, thread: Thread, memo: Memo, book: Book, lyric: Lyric, plain: Plain };

/** A text card. Sizes follow the width of the box around it. */
export default function Template({ card, children }) {
  const key = templateOf(card);
  const Face = FACES[key];
  const post = key === "tweet" || key === "thread";
  return (
    <div className={`tpl ${key} ${post ? "post" : ""}`} style={{ "--fs": fontSize(key, card.content), "--bd": backOf(card) }}>
      <Face card={card} />
      {children}
    </div>
  );
}
