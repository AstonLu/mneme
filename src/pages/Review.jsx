import { memo, useState, useEffect, useRef, useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import TinderCard from "react-tinder-card";

const PREVENT_SWIPE = ["up", "down"];

function weightedRandom(cards) {
  const totalWeight = cards.reduce((sum, c) => sum + (c.weight || 1), 0);
  let random = Math.random() * totalWeight;
  for (const card of cards) {
    random -= (card.weight || 1);
    if (random <= 0) return card;
  }
  return cards[cards.length - 1];
}

// @react-spring 10.0.3 restarts the initial [0, 0, 0] spring on every re-render,
// which cancels the fly-out. Keep all props stable so TinderCard does not re-render.
const SwipeCard = memo(function SwipeCard({ card, cardRef, onSwipe, onLeft }) {
  return (
    <TinderCard
      ref={cardRef}
      onSwipe={onSwipe}
      onCardLeftScreen={onLeft}
      preventSwipe={PREVENT_SWIPE}
      className="tinder-card-wrapper"
      swipeRequirementType="position"
      swipeThreshold={40}
    >
      <div className="card">
        {card.imageUrl && (
          <img src={card.imageUrl} alt="card" className="card-image" />
        )}
        {card.content && (
          <p className="card-content">{card.content}</p>
        )}
        {card.link && (
          <a href={card.link} target="_blank" rel="noreferrer" className="card-link">
            查看原文 →
          </a>
        )}
      </div>
    </TinderCard>
  );
});

export default function Review({ cards, setCards, loading }) {
  if (loading) return <div className="empty-state"><p>載入中...</p></div>;
  if (cards.length === 0) return (
    <div className="empty-state">
      <p>還沒有卡片</p>
      <p>點上方 Add 新增你的第一張</p>
    </div>
  );

  return <ReviewDeck cards={cards} setCards={setCards} />;
}

function ReviewDeck({ cards, setCards }) {
  const [current, setCurrent] = useState(() => weightedRandom(cards));
  const [round, setRound] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [popup, setPopup] = useState(null);
  const cardRef = useRef(null);
  const cardsRef = useRef(cards);
  const popupTimer = useRef(null);
  const popupId = useRef(0);

  useEffect(() => { cardsRef.current = cards; }, [cards]);

  const currentId = current.id;

  const handleSwipe = useCallback(async (direction) => {
    const card = cardsRef.current.find(c => c.id === currentId);
    if (!card) return;
    setSwiping(true);
    const isBoost = direction === "right";

    if (popupTimer.current) clearTimeout(popupTimer.current);
    popupId.current += 1;
    setPopup({ id: popupId.current, text: isBoost ? "Boost" : "Pass" });
    popupTimer.current = setTimeout(() => setPopup(null), 700);

    const newWeight = isBoost
      ? Math.min((card.weight || 1) + 2, 10)
      : Math.max((card.weight || 1) - 1, 1);
    const newBoostCount = isBoost ? (card.boostCount || 0) + 1 : (card.boostCount || 0);
    const newNoteCount = !isBoost ? (card.noteCount || 0) + 1 : (card.noteCount || 0);

    // Update local data first: the next card is picked before the write finishes.
    const updatedCards = cardsRef.current.map(c =>
      c.id === currentId
        ? { ...c, weight: newWeight, boostCount: newBoostCount, noteCount: newNoteCount }
        : c
    );
    cardsRef.current = updatedCards;
    setCards(updatedCards);

    try {
      await updateDoc(doc(db, "cards", currentId), {
        weight: newWeight,
        boostCount: newBoostCount,
        noteCount: newNoteCount,
      });
    } catch (err) {
      console.error(err);
    }
  }, [currentId, setCards]);

  const handleCardLeftScreen = useCallback(() => {
    setSwiping(false);
    setCurrent(weightedRandom(cardsRef.current));
    // Remount the card even when the same one is picked again.
    setRound(r => r + 1);
  }, []);

  const swipe = async (dir) => {
    if (swiping || !cardRef.current) return;
    await cardRef.current.swipe(dir);
  };

  return (
    <div className="review">
      {popup && (
        <div key={popup.id} className="swipe-popup">{popup.text}</div>
      )}
      {/* Block a second grab while the card flies out. */}
      <div className="card-area" style={swiping ? { pointerEvents: "none" } : undefined}>
        <SwipeCard
          key={`${currentId}-${round}`}
          card={current}
          cardRef={cardRef}
          onSwipe={handleSwipe}
          onLeft={handleCardLeftScreen}
        />
      </div>

      <div className="swipe-hint">
        <span>← Pass</span>
        <span>Boost →</span>
      </div>

      <div className="manual-buttons">
        <button className="btn-left" onClick={() => swipe("left")} disabled={swiping}>Pass</button>
        <button className="btn-right" onClick={() => swipe("right")} disabled={swiping}>Boost</button>
      </div>
    </div>
  );
}
