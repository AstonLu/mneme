export default function Gallery({ cards, loading }) {
  if (loading) return <div className="empty-state"><p>載入中...</p></div>;
  if (cards.length === 0) return (
    <div className="empty-state"><p>還沒有卡片</p></div>
  );

  const sorted = [...cards].sort((a, b) => (b.boostCount || 0) - (a.boostCount || 0));

  return (
    <div className="gallery">
      {sorted.map(card => (
        <div key={card.id} className="gallery-card">
          {card.imageUrl && (
            <img src={card.imageUrl} alt="card" className="gallery-image" />
          )}
          {card.content && (
            <p className="gallery-content">{card.content}</p>
          )}
          {card.link && (
            <a href={card.link} target="_blank" rel="noreferrer" className="card-link">
              查看原文 →
            </a>
          )}
          <div className="gallery-footer">
            <div className="gallery-counts">
              <div className="gallery-count">
                再推給我 <span>{card.boostCount || 0}</span>
              </div>
              <div className="gallery-count">
                知悉 <span>{card.noteCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
