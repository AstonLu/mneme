import { useEffect, useRef, useState } from "react";
import { Thumb } from "../components/CardFace";
import Avatar from "../components/Avatar";
import Glass, { Icon } from "../components/Glass";
import View from "../components/View";
import { seenCount, sortCards } from "../domain/rank";
import { formatDay, formatRatio } from "../lib/format";
import Account from "./Account";
import Detail from "./Detail";

const SORTS = {
  ratio: ["喜歡率", "half"], likes: ["喜歡數量", "yes"], seen: ["累積次數", "eye"], added: ["加入時間", "clock"],
};

/** Length = how often it was seen. Split = liked and skipped. */
function Bar({ card, most }) {
  const times = seenCount(card);
  if (!times) return <span className="bar" />;
  return (
    <span className="bar">
      <span style={{ width: `${Math.max(8, (times / most) * 100)}%` }}>
        {card.likes > 0 && <i className="a" style={{ flex: card.likes }} />}
        {card.skips > 0 && <i className="z" style={{ flex: card.skips }} />}
      </span>
    </span>
  );
}

const describe = (card) => `${card.content || "圖片卡片"}，喜歡率 ${formatRatio(card)}，滑到 ${seenCount(card)} 次，加入 ${formatDay(card.createdAt)}`;

export default function Collection({ cards, me, getPeople, onDelete, onSignOut, onClose }) {
  const [sort, setSort] = useState({ key: "ratio", ascending: false });
  const [menu, setMenu] = useState(false);
  const [account, setAccount] = useState(false);
  const [openId, setOpenId] = useState(null);
  const menuRef = useRef(null);
  const sorter = useRef(null);
  const opened = cards.find((c) => c.id === openId);
  const most = Math.max(1, ...cards.map(seenCount));
  const order = sort.ascending ? "由低到高" : "由高到低";

  useEffect(() => { if (menu) menuRef.current.querySelector('[aria-checked="true"]').focus(); }, [menu]);

  const closeMenu = () => { setMenu(false); sorter.current.focus(); };
  const choose = (change) => { setSort((s) => ({ ...s, ...change })); closeMenu(); };

  return (
    <>
      <View label="收藏" onClose={menu ? closeMenu : onClose} inert={Boolean(opened) || account} onClick={() => setMenu(false)}>
        <button ref={sorter} type="button" className="glass pill float" aria-haspopup="menu" aria-expanded={menu}
          aria-label={`排序：${SORTS[sort.key][0]}，${order}`} onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); }}>
          <Icon name={SORTS[sort.key][1]} /><Icon name={sort.ascending ? "up" : "down"} />
        </button>
        {menu && (
          <div ref={menuRef} className="menu" role="menu" onClick={(e) => e.stopPropagation()}>
            {Object.entries(SORTS).map(([key, [text, icon]]) => (
              <button key={key} type="button" role="menuitemradio" aria-checked={key === sort.key} onClick={() => choose({ key })}><Icon name={icon} />{text}</button>
            ))}
            <hr />
            <button type="button" role="menuitemradio" aria-checked={!sort.ascending} onClick={() => choose({ ascending: false })}><Icon name="down" />由高到低</button>
            <button type="button" role="menuitemradio" aria-checked={sort.ascending} onClick={() => choose({ ascending: true })}><Icon name="up" />由低到高</button>
          </div>
        )}
        <div className="body under">
          <div className="titlerow">
            <h2>收藏</h2>
            <button type="button" className="avatarbtn" aria-label={`帳號 ${me.code}`} onClick={() => setAccount(true)}><Avatar code={me.code} /></button>
          </div>
          {cards.length === 0 && <p>還沒有卡片</p>}
          <div className="grid">
            {sortCards(cards, sort.key, sort.ascending).map((card) => (
              <button key={card.id} type="button" className="tile" aria-label={describe(card)} onClick={() => setOpenId(card.id)}>
                <Thumb card={card} />
                <Bar card={card} most={most} />
              </button>
            ))}
          </div>
        </div>
        <Glass icon="deck" label="回到滑卡" className="corner all" data-focus onClick={onClose} />
      </View>
      {account && <Account me={me} getPeople={getPeople} onSignOut={onSignOut} onClose={() => setAccount(false)} />}
      {opened && (
        <Detail card={opened} canDelete={me.canDelete} onClose={() => setOpenId(null)}
          onDelete={async () => { await onDelete(opened); setOpenId(null); }} />
      )}
    </>
  );
}
