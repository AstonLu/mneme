import { useState, useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import TinderCard from "react-tinder-card";

function weightedRandom(cards) {
  const totalWeight = cards.reduce((sum, c) => sum + (c.weight || 1), 0);
  let random = Math.random() * totalWeight;
  for (const card of cards) {
    random -= (card.weight || 1);
    if (random <= 0) return card;
  }
  return cards[cards.length - 1];
}

export default function Review({ cards, setCards, loading }) {
  const [current, setCurrent] = useState(null);
  const [swiping, setSwiping] = useState(false);
  const [popup, setPopup] = useState(null);
  const cardRef = useRef(null);
  const cardsRef = useRef(cards);
  const popupTimer = useRef(null);

  useEffect(() => { cardsRef.current = cards; }, [cards]);

  useEffect(() => {
    if (cards.length > 0 && !current) {
      setCurrent(weightedRandom(cards));
    }
  }, [cards]);

  const handleSwipe = async (direction) => {
    if (!current) return;
    const isBoost = direction === "right";

    if (popupTimer.current) clearTimeout(popupTimer.current);
    setPopup(isBoost ? "Boost" : "Pass");
    popupTimer.current = setTimeout(() => setPopup(null), 700);

    const newWeight = isBoost
      ? Math.min((current.weight || 1) + 2, 10)
      : Math.max((current.weight || 1) - 1, 1);
    const newBoostCount = isBoost ? (current.boostCount || 0) + 1 : (current.boostCount || 0);
    const newNoteCount = !isBoost ? (current.noteCount || 0) + 1 : (current.noteCount || 0);

    try {
      await updateDoc(doc(db, "cards", current.id), {
        weight: newWeight,
        boostCount: newBoostCount,
        noteCount: newNoteCount,
      });
    } catch (err) {
      console.error(err);
    }

    const updatedCards = cardsRef.current.map(c =>
      c.id === current.id
        ? { ...c, weight: newWeight, boostCount: newBoostCount, noteCount: newNoteCount }
        : c
    );
    setCards(updatedCards);
  };

  const handleCardLeftScreen = () => {
    setSwiping(false);
    setCurrent(weightedRandom(cardsRef.current));
  };

  const swipe = async (dir) => {
    if (swiping || !cardRef.current) return;
    setSwiping(true);
    await cardRef.current.swipe(dir);
  };

  if (loading) return <div className="empty-state"><p>載入中...</p></div>;
  if (cards.length === 0) return (
    <div className="empty-state">
      <p>還沒有卡片</p>
      <p>點上方 Add 新增你的第一張</p>
    </div>
  );
  if (!current) return <div className="empty-state"><p>載入中...</p></div>;

  return (
    <div className="review">
      {popup && (
        <div key={popup + Date.now()} className="swipe-popup">{popup}</div>
      )}
      <div className="card-area">
        <TinderCard
          ref={cardRef}
          key={current.id}
          onSwipe={handleSwipe}
          onCardLeftScreen={handleCardLeftScreen}
          preventSwipe={["up", "down"]}
          className="tinder-card-wrapper"
          swipeRequirementType="position"
          swipeThreshold={40}
        >
          <div className="card">
            {current.imageUrl && (
              <img src={current.imageUrl} alt="card" className="card-image" />
            )}
            {current.content && (
              <p className="card-content">{current.content}</p>
            )}
            {current.link && (
              <a href={current.link} target="_blank" rel="noreferrer" className="card-link">
                查看原文 →
              </a>
            )}
          </div>
        </TinderCard>
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
