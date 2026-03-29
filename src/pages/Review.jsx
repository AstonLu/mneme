import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
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

export default function Review() {
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNote, setShowNote] = useState(false);
  const [swipeResult, setSwipeResult] = useState(null);

  useEffect(() => { fetchCards(); }, []);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "cards"));
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCards(data);
      if (data.length > 0) setCurrent(weightedRandom(data));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction) => {
    if (!current) return;
    const isImportant = direction === "right";
    setSwipeResult(isImportant ? "重要 ⭐" : "普通");

    const newWeight = isImportant
      ? Math.min((current.weight || 1) + 2, 5)
      : Math.max((current.weight || 1) - 1, 1);

    try {
      await updateDoc(doc(db, "cards", current.id), { weight: newWeight });
    } catch (err) {
      console.error(err);
    }

    const updatedCards = cards.map(c =>
      c.id === current.id ? { ...c, weight: newWeight } : c
    );
    setCards(updatedCards);

    setTimeout(() => {
      setSwipeResult(null);
      setShowNote(false);
      setCurrent(weightedRandom(updatedCards));
    }, 500);
  };

  if (loading) return <div className="empty-state">載入中...</div>;

  if (!current) return (
    <div className="empty-state">
      <p>還沒有卡片</p>
      <p>點右上角 + 新增你的第一張卡片</p>
    </div>
  );

  return (
    <div className="review">
      <div className="card-area">
        {swipeResult && (
          <div className={`swipe-label ${swipeResult.includes("重要") ? "right" : "left"}`}>
            {swipeResult}
          </div>
        )}
        <TinderCard
          key={current.id + Math.random()}
          onSwipe={handleSwipe}
          preventSwipe={["up", "down"]}
          className="tinder-card-wrapper"
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
            {current.note && (
              <button className="note-toggle" onClick={() => setShowNote(!showNote)}>
                {showNote ? "收起心得" : "查看我的心得"}
              </button>
            )}
            {showNote && current.note && (
              <p className="card-note">{current.note}</p>
            )}
          </div>
        </TinderCard>
      </div>

      <div className="swipe-hint">
        <span>← 普通</span>
        <span>重要 →</span>
      </div>

      <div className="manual-buttons">
        <button className="btn-left" onClick={() => handleSwipe("left")}>普通</button>
        <button className="btn-right" onClick={() => handleSwipe("right")}>重要 ⭐</button>
      </div>
    </div>
  );
}
