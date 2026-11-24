import { isWebLink } from "../domain/card";
import { lightOf, washOf } from "../lib/light";

const placed = ({ x, y }) => ({ left: `${x}%`, top: `${y}%` });

/** A composed card: a fixed 2:3 sheet, so a layout looks the same everywhere. */
export function Art({ card, layer = () => ({}), children }) {
  const { image, text } = card.art;
  const imageProps = layer("image");
  const textProps = layer("text");
  return (
    <div className="art">
      {card.imageUrl && (
        <img src={card.imageUrl} alt={card.content || "圖片卡片"} draggable="false" {...imageProps}
          style={{ ...placed(image), width: `${image.s}%` }} />
      )}
      {card.content && (
        <p {...textProps} className={`${text.color} ${text.plate ? "plate" : ""} ${textProps.className || ""}`}
          style={{ ...placed(text), "--size": text.size }}><span>{card.content}</span></p>
      )}
      {children}
    </div>
  );
}

function kindOf(card) {
  if (card.art) return card.imageUrl ? "composed image" : "composed text";
  if (card.imageUrl) return card.content ? "both" : "image";
  return card.content.length < 40 ? "text short" : "text";
}

/** The inside of a full card. */
export function CardFace({ card }) {
  return (
    <div className={`face ${kindOf(card)}`}>
      <div className="ambient" style={{ backgroundImage: lightOf(card) }} />
      <div className="scroll">
        {card.art ? <Art card={card} /> : (
          <>
            {card.imageUrl && <img src={card.imageUrl} alt={card.content ? "" : "圖片卡片"} draggable="false" />}
            {card.content && <p>{card.content}</p>}
          </>
        )}
        {isWebLink(card.link) && (
          <a className="source" href={card.link} target="_blank" rel="noreferrer" draggable="false">查看原文</a>
        )}
      </div>
      <div className="sheen" />
    </div>
  );
}

export function Thumb({ card }) {
  const picture = card.imageUrl || card.art;
  return (
    <div className={picture ? "thumb pic" : "thumb"} style={card.imageUrl ? undefined : { backgroundImage: washOf(card) }}>
      {card.art ? <Art card={card} />
        : card.imageUrl ? <img src={card.imageUrl} alt={card.content || "圖片卡片"} loading="lazy" />
          : <span>{card.content.length > 46 ? `${card.content.slice(0, 44)}…` : card.content}</span>}
    </div>
  );
}

export function Light({ card }) {
  return (
    <div className="light">
      {/* A new key fades in above the plain layer below it. */}
      <div key={card.id} style={{ backgroundImage: lightOf(card) }} />
    </div>
  );
}
