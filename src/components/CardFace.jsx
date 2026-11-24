import { isWebLink } from "../domain/card";
import Template from "./Template";

const placed = ({ x, y }) => ({ left: `${x}%`, top: `${y}%` });

/** An image card from the old editor: a fixed 2:3 sheet, so its layout stays as it was made. */
function Art({ card }) {
  const { image, text } = card.art;
  return (
    <div className="art">
      <img src={card.imageUrl} alt={card.content || "圖片卡片"} draggable="false" style={{ ...placed(image), width: `${image.s}%` }} />
      {card.content && (
        <p className={`${text.color} ${text.plate ? "plate" : ""}`} style={{ ...placed(text), "--size": text.size }}><span>{card.content}</span></p>
      )}
    </div>
  );
}

const Ambient = ({ card }) => <div className="ambient" style={card.tiny ? { backgroundImage: `url("${card.tiny}")` } : undefined} />;

/** The inside of a full card. `still`: a picture of the card, with no link. */
export function CardFace({ card, still = false }) {
  const source = !still && isWebLink(card.link) && (
    <a className="source" href={card.link} target="_blank" rel="noreferrer" draggable="false">查看原文</a>
  );
  return (
    <div className="box">
      {card.imageUrl ? (
        <div className={card.content && !card.art ? "face both" : "face"}>
          <Ambient card={card} />
          <div className="scroll">
            {card.art ? <Art card={card} /> : (
              <>
                <img src={card.imageUrl} alt={card.content ? "" : "圖片卡片"} draggable="false" />
                {card.content && <p>{card.content}</p>}
              </>
            )}
            {source}
          </div>
        </div>
      ) : <Template card={card}>{source}</Template>}
      <div className="sheen" />
    </div>
  );
}

export function Thumb({ card }) {
  if (!card.imageUrl) return <span className="thumb box mini"><Template card={card} /></span>;
  return (
    <span className="thumb">
      <Ambient card={card} />
      {card.art ? <Art card={card} /> : <img src={card.imageUrl} alt="" loading="lazy" />}
    </span>
  );
}
