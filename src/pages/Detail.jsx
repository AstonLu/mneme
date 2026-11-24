import { useState } from "react";
import { CardFace } from "../components/CardFace";
import Confirm from "../components/Confirm";
import Glass, { Icon } from "../components/Glass";
import TemplateStrip from "../components/TemplateStrip";
import View from "../components/View";
import { isWebLink } from "../domain/card";
import { likeRatio, seenCount } from "../domain/rank";
import { formatDay, formatRatio } from "../lib/format";

function Count({ icon, label, value, most, tone }) {
  return (
    <div className="count" role="img" aria-label={`${label} ${value} 次`}>
      <Icon name={icon} />
      <span className="lane"><i className={tone} style={{ width: `${(value / most) * 100}%` }} /></span>
      <b>{value}</b>
    </div>
  );
}

function Moment({ icon, time }) {
  return <div><Icon name={icon} /><span>{time ? formatDay(time) : "–"}</span></div>;
}

export default function Detail({ card, canDelete, onTemplate, onDelete, onClose }) {
  const [asking, setAsking] = useState(false);
  const times = seenCount(card);
  const most = Math.max(card.likes, card.skips, 1);
  return (
    <>
      <View label="卡片紀錄" onClose={onClose} inert={asking}>
        <div className="head">
          <Glass icon="back" label="回到收藏" className="round first" data-focus onClick={onClose} />
          {isWebLink(card.link) && (
            <a className="glass round" href={card.link} target="_blank" rel="noreferrer" aria-label="查看原文"><Icon name="link" /></a>
          )}
          {canDelete && <Glass icon="trash" label="刪除" className="round danger" onClick={() => setAsking(true)} />}
        </div>
        <div className="body">
          <div className="prev"><CardFace card={card} still /></div>
          {canDelete && !card.imageUrl && <TemplateStrip card={card} onChoose={onTemplate} />}
          <div className="stats">
            <div className="ring" role="img" aria-label={`喜歡率 ${formatRatio(card)}，滑到 ${times} 次`}>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle className="track" cx="50" cy="50" r="42" pathLength="100" />
                {times > 0 && card.likes > 0 && <circle className="arc" cx="50" cy="50" r="42" pathLength="100" strokeDasharray={`${likeRatio(card) * 100} 100`} />}
              </svg>
              <Icon name="yes" />
            </div>
            <div className="counts">
              <Count icon="yes" label="喜歡" value={card.likes} most={most} tone="a" />
              <Count icon="no" label="略過" value={card.skips} most={most} tone="z" />
            </div>
          </div>
          <div className="when" role="img" aria-label={`加入 ${formatDay(card.createdAt)}，上次看到 ${formatDay(card.lastSeenAt)}`}>
            <Moment icon="add" time={card.createdAt} />
            <i />
            <Moment icon="eye" time={card.lastSeenAt} />
          </div>
        </div>
      </View>
      {asking && (
        <Confirm title="刪除後無法復原" action="刪除這張卡" keep="保留" onConfirm={onDelete} onClose={() => setAsking(false)} />
      )}
    </>
  );
}
