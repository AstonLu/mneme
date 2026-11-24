const $ = (s, root = document) => root.querySelector(s);
const el = (h) => { const t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstElementChild; };
const I = {
  all: '<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>',
  deck: '<rect x="8" y="4" width="12" height="16" rx="3"/><path d="M5 7v10"/>',
  add: '<path d="M12 5v14M5 12h14"/>', no: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  yes: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  sort: '<path d="M4 7h16M7 12h10M10 17h4"/>', back: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  edit: '<path d="M5 19l1-4L15.5 5.5l3 3L9 18z"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};
const svg = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;
const glass = (k, label, cls = "") => `<button class="glass ${cls}" aria-label="${label}">${svg(k)}</button>`;
const page = $(".page"), screenEl = $(".screen"), frame = $(".frame"), fit = $(".fit");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const REASON = { fresh: "新卡優先", lost: "好久沒看", wild: "隨機驚喜", taste: "依喜好" };
const SORTS = { ratio: "喜歡率", likes: "喜歡數量", seen: "累積次數", added: "加入時間" };
// Example history: [likes, skips, added days ago, last seen days ago]
const HISTORY = { walk: [22, 2, 160, 3], tide: [9, 6, 120, 20], list: [14, 3, 95, 1], lamp: [31, 9, 210, 2], ridge: [3, 11, 80, 12], seed: [5, 0, 30, 18], short: [40, 22, 240, 1], medium: [12, 1, 60, 33], link: [1, 0, 6, 5], long: [2, 8, 45, 9] };
const start = Date.now();
let cards = demoCards.map((c) => {
  const [likes, skips, added, seen] = HISTORY[c.id.slice(5)];
  return { ...c, likes, skips, createdAt: start - added * DAY, lastSeenAt: start - seen * DAY };
});
let scale = 1, top = null, under = null, swipeTop = () => {}, full = false, env = "home", recent = [];
let sortKey = "ratio", ascending = false;

const PAIRS = [["#f0b68b", "#a3b6ee"], ["#abd6bb", "#f0d488"], ["#cbb0ea", "#f2aea8"], ["#9bd0e0", "#dcc0f0"]];
const pairOf = (c) => PAIRS[[...c.id].reduce((n, x) => n + x.charCodeAt(0), 0) % PAIRS.length];
const lightOf = (c) => c.imageUrl ? `url("${c.tiny || c.imageUrl}")` : `radial-gradient(at 15% 10%,${pairOf(c)[0]},transparent 70%),radial-gradient(at 88% 90%,${pairOf(c)[1]},transparent 70%),linear-gradient(#fff,#fff)`;
const wash = (c) => `linear-gradient(rgba(255,255,255,.35),rgba(255,255,255,.35)),${lightOf(c)}`;
const day = (t) => new Intl.DateTimeFormat("zh-TW", { year: "numeric", month: "numeric", day: "numeric" }).format(t);
const percent = (c) => { const r = likeRatio(c); return r === null ? "尚無" : `${Math.round(r * 100)}%`; };

function artNode(card) {
  const a = card.art, n = el('<div class="art"></div>');
  if (card.imageUrl) {
    const i = new Image(); i.src = card.imageUrl; i.alt = card.content || "圖片卡片"; i.draggable = false;
    i.style.cssText = `left:${a.image.x}%;top:${a.image.y}%;width:${a.image.s}%`; n.append(i);
  }
  if (card.content) {
    const p = el("<p><span></span></p>"); p.firstChild.textContent = card.content;
    p.className = `${a.text.color}${a.text.plate ? " plate" : ""}`;
    p.style.cssText = `left:${a.text.x}%;top:${a.text.y}%;--size:${a.text.size}`; n.append(p);
  }
  return n;
}
function node(card) {
  const kind = card.art ? "composed" + (card.imageUrl ? " image" : " text") : card.imageUrl ? (card.content ? "both" : "image") : "text" + (card.content.length < 40 ? " short" : "");
  const n = el(`<div class="card ${kind}"><div class="ambient"></div><div class="scroll"></div><div class="sheen"></div></div>`);
  const box = $(".scroll", n);
  if (card.art) box.append(artNode(card));
  else {
    if (card.imageUrl) { const i = new Image(); i.src = card.imageUrl; i.alt = card.content ? "" : "圖片卡片"; i.draggable = false; box.append(i); }
    if (card.content) { const p = el("<p></p>"); p.textContent = card.content; box.append(p); }
  }
  $(".ambient", n).style.backgroundImage = lightOf(card);
  return n;
}
function thumb(card) {
  const t = el(`<div class="thumb${card.imageUrl || card.art ? " pic" : ""}"></div>`);
  if (card.art) t.append(artNode(card));
  else if (card.imageUrl) { const i = new Image(); i.src = card.imageUrl; i.alt = card.content || "圖片卡片"; t.append(i); }
  else t.textContent = card.content.length > 46 ? card.content.slice(0, 44) + "…" : card.content;
  if (!card.imageUrl) t.style.backgroundImage = wash(card);
  return t;
}

/* Deck */
const place = (n, p) => { n.style.transform = `translateY(${30 * (1 - p)}px) scale(${.94 + .06 * p})`; };
function signal(q) { for (const [k, v] of [["--q", q], ["--r", Math.max(q, 0)], ["--l", Math.max(-q, 0)]]) page.style.setProperty(k, v); }
function relight() {
  const box = $(".light", page), layer = el("<div></div>"), old = [...box.children];
  layer.style.backgroundImage = lightOf(top.card);
  // Fade the old light out above the new one, so the resting layer is never animated.
  box.prepend(layer);
  old.forEach((x) => x.animate([{ opacity: .9 }, { opacity: 0 }], { duration: reduced.matches ? 1 : 420, fill: "forwards" }).finished.then(() => x.remove()));
}
function draw(previousId) {
  const { card, reason } = chooseNext(cards, { now: Date.now(), recentIds: [...recent, previousId].filter(Boolean) });
  return { card, reason, node: node(card) };
}
function addUnder(forced) {
  under?.node.remove();
  under = forced ? { card: forced, reason: "fresh", node: node(forced) } : draw(top.card.id);
  $(".deck", page).prepend(under.node); place(under.node, 0);
}
function resetDeck(first) {
  const deck = $(".deck", page);
  deck.replaceChildren(); under = null; swipeTop = () => {};
  $(".no", page).disabled = $(".yes", page).disabled = cards.length === 0;
  if (!cards.length) { top = null; deck.append(el('<div class="empty">還沒有卡片</div>')); $(".why").textContent = ""; return; }
  top = first ? { card: first, reason: "taste", node: node(first) } : draw();
  deck.append(top.node); addUnder(); activate();
}
function activate() {
  relight();
  $(".why").textContent = `這張出現的原因：${REASON[top.reason]}`;
  const n = top.node, deck = $(".deck", page);
  n.style.transition = "";
  let pid = null, sx = 0, sy = 0, x = 0, locked = false, samples = [];
  const W = () => deck.clientWidth;
  const paint = () => {
    const p = Math.min(Math.abs(x) / (W() * .35), 1);
    n.style.transform = `translateX(${x}px) rotate(${reduced.matches ? 0 : x / W() * 10}deg)`;
    n.style.setProperty("--x", x / W()); signal(Math.sign(x) * p); place(under.node, p);
  };
  const leave = (sign, v = 0) => {
    if (n.leaving) return;
    n.leaving = true; n.style.pointerEvents = "none";
    const to = sign * W() * 1.35, ms = reduced.matches ? 120 : Math.max(160, Math.min(320, Math.abs(to - x) / Math.max(Math.abs(v), 1.2)));
    n.animate(reduced.matches ? [{ opacity: 1 }, { opacity: 0 }] : [{ transform: n.style.transform || "none" }, { transform: `translateX(${to}px) rotate(${sign * 14}deg)` }], { duration: ms, easing: "cubic-bezier(.2,.6,.4,1)", fill: "forwards" }).finished.then(() => n.remove());
    signal(0);
    if (!reduced.matches) $(sign > 0 ? ".yes" : ".no", page).animate([{ scale: 1 }, { scale: 1.2 }, { scale: 1 }], { duration: 300, easing: "ease-out" });
    $(sign > 0 ? ".er" : ".el", page).animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380 });
    const id = top.card.id;
    cards = cards.map((c) => c.id === id ? { ...c, ...recordSwipe(c, sign > 0 ? "right" : "left", Date.now()) } : c);
    recent = [...recent, id].slice(-12);
    under.node.style.transition = "transform 180ms cubic-bezier(.22,1,.36,1)"; place(under.node, 1);
    top = under; under = null; deck.append(n); addUnder(); activate();
  };
  const back = () => {
    page.classList.add("settle"); setTimeout(() => page.classList.remove("settle"), 260);
    const from = n.style.transform; x = 0; paint();
    if (!reduced.matches) n.animate([{ transform: from }, { transform: "none" }], { duration: 260, easing: "cubic-bezier(.2,1.25,.4,1)" });
  };
  swipeTop = leave;
  n.onpointerdown = (e) => {
    if (pid !== null || e.button) return;
    // Safari owns the screen edge for back and forward.
    const r = screenEl.getBoundingClientRect(), at = (e.clientX - r.left) / scale;
    if ((env === "safari" || full) && (at < 24 || at > r.width / scale - 24)) return;
    pid = e.pointerId; sx = e.clientX; sy = e.clientY; locked = false; samples = [[e.timeStamp, 0]]; n.style.transition = "none";
  };
  n.onpointermove = (e) => {
    if (e.pointerId !== pid) return;
    const dx = (e.clientX - sx) / scale, dy = (e.clientY - sy) / scale;
    if (!locked) {
      if (Math.hypot(dx, dy) < 8) return;
      if (Math.abs(dx) < Math.abs(dy)) { pid = null; return; }
      locked = true; n.setPointerCapture(pid);
    }
    samples = [...samples.filter(([t]) => e.timeStamp - t < 100), [e.timeStamp, dx]]; x = dx; paint();
  };
  n.onpointerup = n.onpointercancel = (e) => {
    if (e.pointerId !== pid) return;
    pid = null; if (!locked) return;
    const [t0, x0] = samples.find(([t]) => e.timeStamp - t < 100) || [e.timeStamp, x];
    const v = (x - x0) / Math.max(e.timeStamp - t0, 1);
    const flick = Math.abs(v) > .5 && Math.abs(x) > 24 && Math.sign(v) === Math.sign(x);
    if (e.type === "pointerup" && (Math.abs(x) > W() * .28 || flick)) leave(Math.sign(x), v); else back();
  };
}

/* Views stack: opening one freezes everything below, closing restores exactly that state. */
function open(view, { onEscape } = {}) {
  const opener = document.activeElement;
  const rest = [...page.children].map((c) => [c, c.inert]);
  rest.forEach(([c]) => { c.inert = true; });
  page.append(view);
  if (!reduced.matches) view.animate([{ transform: "translateY(24px)" }, { transform: "none" }], { duration: 220, easing: "cubic-bezier(.22,1,.36,1)" });
  const close = () => { view.remove(); rest.forEach(([c, was]) => { c.inert = was; }); if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  view.onEscape = onEscape || close;
  return close;
}
function toast(text) {
  const t = el('<div class="toast" role="status"></div>'); t.textContent = text; page.append(t);
  setTimeout(() => t.remove(), 1800);
}

/* Collection */
function openAll() {
  const v = el(`<div class="view" role="dialog" aria-label="收藏"><header><h2>收藏</h2><button class="glass pill sorter" aria-haspopup="menu" aria-expanded="false">${svg("sort")}<span></span></button></header><div class="body"><div class="grid"></div></div>${glass("deck", "回到滑卡", "corner all")}</div>`);
  const close = open(v);
  const paint = () => {
    $(".sorter span", v).textContent = SORTS[sortKey];
    $(".sorter", v).setAttribute("aria-label", `排序：${SORTS[sortKey]}，${ascending ? "由低到高" : "由高到低"}`);
    $(".grid", v).replaceChildren(...sortCards(cards, sortKey, ascending).map((c) => {
      const b = el('<button class="tile"><div class="meta"><b></b><span></span></div></button>');
      b.prepend(thumb(c));
      const n = seenCount(c);
      const pair = { ratio: [percent(c), `${n} 次`], likes: [`喜歡 ${c.likes}`, percent(c)], seen: [`${n} 次`, percent(c)], added: [day(c.createdAt), percent(c)] }[sortKey];
      $("b", b).textContent = pair[0]; $("span", b).textContent = pair[1];
      b.onclick = () => openDetail(c.id, paint);
      return b;
    }));
    if (!cards.length) $(".grid", v).replaceChildren(el("<p>還沒有卡片</p>"));
  };
  let menu = null;
  const closeMenu = () => { menu?.remove(); menu = null; $(".sorter", v).setAttribute("aria-expanded", "false"); };
  v.onEscape = () => (menu ? (closeMenu(), $(".sorter", v).focus()) : close());
  $(".sorter", v).onclick = (e) => {
    e.stopPropagation();
    if (menu) { closeMenu(); return; }
    menu = el(`<div class="menu" role="menu">${Object.entries(SORTS).map(([k, t]) => `<button role="menuitemradio" data-k="${k}" aria-checked="${k === sortKey}">${t}</button>`).join("")}<hr><button role="menuitemradio" data-d="0" aria-checked="${!ascending}">由高到低</button><button role="menuitemradio" data-d="1" aria-checked="${ascending}">由低到高</button></div>`);
    menu.onclick = (ev) => {
      ev.stopPropagation();
      const { k, d } = ev.target.dataset;
      if (k) sortKey = k; else if (d) ascending = d === "1"; else return;
      closeMenu(); paint(); $(".body", v).scrollTop = 0; $(".sorter", v).focus();
    };
    v.append(menu); $(".sorter", v).setAttribute("aria-expanded", "true");
    $('[aria-checked="true"]', menu).focus();
  };
  v.onclick = closeMenu;
  $(".corner", v).onclick = close;
  paint(); $(".corner", v).focus({ preventScroll: true });
}
function openDetail(id, changed) {
  const c = cards.find((x) => x.id === id), n = seenCount(c);
  const v = el(`<div class="view" role="dialog" aria-label="卡片紀錄"><header>${glass("back", "回到收藏", "round")}</header><div class="body"><div class="hero"></div>
    <div class="big"><b>${percent(c)}</b><span>喜歡率</span></div>
    ${n ? `<div class="ratio" aria-hidden="true">${c.likes ? `<i class="a" style="flex:${c.likes}"></i>` : ""}${c.skips ? `<i class="z" style="flex:${c.skips}"></i>` : ""}</div>` : ""}
    <div class="sides"><span>喜歡 ${c.likes}</span><span>略過 ${c.skips}</span></div>
    <dl><dt>滑到</dt><dd>${n} 次</dd><dt>加入時間</dt><dd>${day(c.createdAt)}</dd><dt>上次看到</dt><dd>${c.lastSeenAt ? day(c.lastSeenAt) : "還沒看過"}</dd></dl>
    <button class="danger">刪除</button></div></div>`);
  $(".hero", v).append(thumb(c));
  const close = open(v);
  $(".round", v).onclick = close; $(".round", v).focus({ preventScroll: true });
  $(".danger", v).onclick = () => {
    const s = el('<div class="scrim"><div class="sheet" role="alertdialog" aria-label="刪除卡片"><p>刪除後無法復原</p><button class="go">刪除這張卡</button><button class="keep">保留</button></div></div>');
    const shut = open(s);
    $(".keep", s).onclick = shut; $(".keep", s).focus();
    s.onclick = (e) => { if (e.target === s) shut(); };
    $(".go", s).onclick = () => {
      cards = cards.filter((x) => x.id !== id); recent = recent.filter((x) => x !== id);
      shut(); close(); changed(); toast("已刪除");
      if (!cards.length || top.card.id === id) resetDeck(); else if (under.card.id === id) addUnder();
    };
  };
}

/* Add: edit, then preview, then save */
const LONG = 100;
async function readImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const i = new Image(); i.src = url; await i.decode();
    const k = Math.min(1, 1400 / Math.max(i.naturalWidth, i.naturalHeight)), c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(i.naturalWidth * k)); c.height = Math.max(1, Math.round(i.naturalHeight * k));
    c.getContext("2d").drawImage(i, 0, 0, c.width, c.height);
    return { url: c.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", .88), ratio: c.height / c.width };
  } finally { URL.revokeObjectURL(url); }
}
function openAdd() {
  const draft = { id: "new-" + Date.now(), content: "", link: "", imageUrl: null, likes: 0, skips: 0, art: { image: { x: 50, y: 50, s: 100 }, text: { x: 50, y: 50, size: 9, color: "ink", plate: false } } };
  const v = el(`<div class="view" role="dialog" aria-label="新增卡片"><header>${glass("no", "取消", "round")}<h2>新增</h2><span class="round"></span></header>
    <div class="body" style="padding-bottom:8px"><div class="canvas"></div><div class="tools">
    <div class="row"><label class="chip"><input type="file" id="pick" accept="image/*"><span>選圖片</span></label><button class="chip drop">移除圖片</button></div>
    <textarea id="words" aria-label="文字" placeholder="寫下一句話"></textarea>
    <label class="slide img"><span>圖片大小</span><input type="range" id="isize" min="30" max="260" value="100"></label>
    <label class="slide txt"><span>文字大小</span><input type="range" id="tsize" min="4" max="18" step=".5" value="9"></label>
    <div class="row txt"><button class="chip" data-color="ink">深字</button><button class="chip" data-color="paper">白字</button><button class="chip plate">文字底色</button></div>
    <p class="err" role="alert"></p></div></div><div class="foot"><button class="primary">預覽</button></div></div>`);
  const close = open(v), canvas = $(".canvas", v), a = draft.art;
  let chosen = "text", moved = false;
  const isLong = () => !draft.imageUrl && draft.content.length > LONG;
  const ready = () => draft.imageUrl || draft.content.trim();
  function paint() {
    canvas.style.backgroundImage = draft.imageUrl ? (draft.tiny ? `linear-gradient(rgba(255,255,255,.12),rgba(255,255,255,.12)),url("${draft.tiny}")` : "") : wash(draft);
    if (isLong()) { const d = el('<div class="longtext"></div>'); d.textContent = draft.content; canvas.replaceChildren(d); }
    else {
      const art = artNode(draft); canvas.replaceChildren(art);
      if (!ready()) art.append(el('<div class="hint">圖片或文字</div>'));
      for (const [key, n] of [["image", $("img", art)], ["text", $("p", art)]]) {
        if (!n) continue;
        n.tabIndex = 0; n.setAttribute("role", "group"); n.setAttribute("aria-label", key === "image" ? "圖片，方向鍵移動" : "文字，方向鍵移動");
        n.classList.toggle("on", key === chosen && draft.imageUrl !== null);
        n.dataset.key = key;
        n.onkeydown = (e) => {
          const d = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[e.key];
          if (!d) return;
          e.preventDefault(); e.stopPropagation(); move(key, d[0], d[1]); if (key === "text") moved = true;
          paint(); $(`[data-key=${key}]`, canvas).focus();
        };
      }
    }
    v.querySelectorAll(".img").forEach((n) => { n.hidden = !draft.imageUrl; });
    v.querySelectorAll(".txt").forEach((n) => { n.hidden = !draft.content.trim() || isLong(); });
    $(".drop", v).hidden = !draft.imageUrl;
    $(".chip span", v).textContent = draft.imageUrl ? "換圖片" : "選圖片";
    v.querySelectorAll("[data-color]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.color === a.text.color));
    $(".plate.chip", v).setAttribute("aria-pressed", a.text.plate);
    $(".primary", v).disabled = !ready();
  }
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  function move(key, dx, dy) { a[key].x = clamp(a[key].x + dx, 0, 100); a[key].y = clamp(a[key].y + dy, 0, 100); }
  // One finger moves the touched layer. Two fingers resize it.
  const fingers = new Map();
  let grab = null;
  const spread = () => { const [p, q] = [...fingers.values()]; return Math.hypot(p.x - q.x, p.y - q.y); };
  canvas.onpointerdown = (e) => {
    if (isLong() || !ready()) return;
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    if (fingers.size === 1) {
      const hit = e.target.closest("img,p");
      if (hit) chosen = hit.tagName === "P" ? "text" : "image"; else if (draft.imageUrl) chosen = "image";
      if (chosen === "text" && !draft.content.trim()) chosen = "image";
      grab = { x: e.clientX, y: e.clientY }; paint();
    } else grab = { pinch: spread(), size: chosen === "image" ? a.image.s : a.text.size };
  };
  canvas.onpointermove = (e) => {
    if (!fingers.has(e.pointerId) || !grab) return;
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (fingers.size > 1 && grab.pinch) {
      const size = grab.size * spread() / grab.pinch;
      if (chosen === "image") $("#isize", v).value = a.image.s = clamp(size, 30, 260); else $("#tsize", v).value = a.text.size = clamp(size, 4, 18);
    } else if (!grab.pinch) {
      const r = canvas.getBoundingClientRect();
      move(chosen, (e.clientX - grab.x) / r.width * 100, (e.clientY - grab.y) / r.height * 100);
      if (chosen === "text") moved = true;
      grab = { x: e.clientX, y: e.clientY };
    }
    paint();
  };
  canvas.onpointerup = canvas.onpointercancel = (e) => {
    fingers.delete(e.pointerId);
    const rest = [...fingers.values()][0]; grab = rest ? { ...rest } : null;
  };
  $("#pick", v).onchange = async (e) => {
    const file = e.target.files[0]; e.target.value = "";
    if (!file) return;
    $(".err", v).textContent = "";
    try {
      const { url, ratio } = await readImage(file);
      draft.imageUrl = url; draft.tiny = null; await shrink(draft);
      // Start with the whole image visible: never cropped unless the person enlarges it.
      a.image = { x: 50, y: 50, s: Math.min(100, 150 / ratio) };
      $("#isize", v).value = a.image.s; chosen = "image";
      if (!moved) { a.text.y = 82; a.text.plate = true; }
    } catch { $(".err", v).textContent = "這張圖片讀不到，請換一張"; }
    paint();
  };
  $(".drop", v).onclick = () => { draft.imageUrl = draft.tiny = null; if (!moved) { a.text.y = 50; a.text.plate = false; } chosen = "text"; paint(); };
  $("#words", v).oninput = (e) => { draft.content = e.target.value; if (draft.content.trim()) chosen = "text"; paint(); };
  $("#isize", v).oninput = (e) => { a.image.s = +e.target.value; chosen = "image"; paint(); };
  $("#tsize", v).oninput = (e) => { a.text.size = +e.target.value; chosen = "text"; paint(); };
  v.querySelectorAll("[data-color]").forEach((b) => { b.onclick = () => { a.text.color = b.dataset.color; paint(); }; });
  $(".plate.chip", v).onclick = () => { a.text.plate = !a.text.plate; paint(); };
  $(".round", v).onclick = () => {
    if (!ready()) { close(); return; }
    const s = el('<div class="scrim"><div class="sheet" role="alertdialog" aria-label="放棄編輯"><p>還沒加入，要放棄嗎？</p><button class="go">放棄</button><button class="keep">繼續編輯</button></div></div>');
    const shut = open(s); $(".keep", s).onclick = shut; $(".keep", s).focus();
    $(".go", s).onclick = () => { shut(); close(); };
  };
  v.onEscape = () => $(".round", v).click();
  $(".primary", v).onclick = () => {
    const c = { ...draft, content: draft.content.trim(), art: isLong() ? undefined : structuredClone(a) };
    const p = el(`<div class="view preview" role="dialog" aria-label="預覽"><div class="light"><div></div></div><div class="deck"></div><div class="acts"><button class="glass pill redo">${svg("edit")}修改</button><button class="glass pill save">${svg("check")}加入</button></div></div>`);
    $(".light div", p).style.backgroundImage = lightOf(c);
    $(".deck", p).append(node(c));
    const shut = open(p); $(".redo", p).onclick = shut; $(".save", p).focus({ preventScroll: true });
    $(".save", p).onclick = () => {
      const saved = { ...c, createdAt: Date.now() };
      cards = [...cards, saved]; shut(); close();
      if (top) addUnder(saved); else resetDeck(saved);
      toast("已加入");
    };
  };
  paint(); $(".round", v).focus({ preventScroll: true });
}

/* Stage */
function render() {
  document.querySelectorAll("[data-frame]").forEach((b) => b.setAttribute("aria-pressed", (b.dataset.frame === "off") === full));
  document.querySelectorAll("[data-env]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.env === env));
  document.body.classList.toggle("full", full); screenEl.classList.toggle("safari", env === "safari");
}
function resize() {
  scale = full ? 1 : Math.max(.4, Math.min(1, (innerHeight - fit.offsetTop - 14) / 872, (document.documentElement.clientWidth - 32) / 421));
  frame.style.transform = `translate(${8 * scale}px,4px) scale(${scale})`;
  fit.style.width = `${421 * scale}px`; fit.style.height = `${872 * scale}px`;
}
page.append(el('<div class="light"></div>'), el('<div class="deck"></div>'), el('<div class="edge er"></div>'), el('<div class="edge el"></div>'),
  el(glass("add", "新增", "corner add")), el(glass("no", "略過", "no")), el(glass("yes", "多看到", "yes")), el(glass("all", "收藏", "corner all")));
$(".no", page).onclick = () => swipeTop(-1); $(".yes", page).onclick = () => swipeTop(1);
$(".corner.all", page).onclick = openAll; $(".corner.add", page).onclick = openAdd;
document.querySelectorAll("[data-frame]").forEach((b) => { b.onclick = () => { full = b.dataset.frame === "off"; render(); resize(); }; });
document.querySelectorAll("[data-env]").forEach((b) => { b.onclick = () => { env = b.dataset.env; render(); }; });
addEventListener("keydown", (e) => {
  const view = [...page.children].filter((n) => n.onEscape).at(-1);
  if (view) { if (e.key === "Escape") view.onEscape(); return; }
  if (!e.repeat && e.key === "ArrowLeft") swipeTop(-1);
  if (!e.repeat && e.key === "ArrowRight") swipeTop(1);
});
addEventListener("resize", resize);
// A 4x5 copy of each image, scaled up, gives a soft light with no blur filter.
async function shrink(c) {
  try {
    const i = new Image(); i.src = c.imageUrl; await i.decode();
    const k = document.createElement("canvas"); k.width = 4; k.height = 5;
    k.getContext("2d").drawImage(i, 0, 0, 4, 5); c.tiny = k.toDataURL();
  } catch { /* keeps the full image as the light source */ }
}
render(); resize();
Promise.all(cards.filter((c) => c.imageUrl).map(shrink)).then(() => resetDeck(cards.find((c) => c.id === "demo-tide")));
