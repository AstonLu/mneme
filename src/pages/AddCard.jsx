import { useEffect, useRef, useState } from "react";
import { Art, CardFace, Light } from "../components/CardFace";
import Confirm from "../components/Confirm";
import Glass, { Icon } from "../components/Glass";
import View from "../components/View";
import { isLongText, isWebLink } from "../domain/card";
import { readImage } from "../lib/image";
import { washOf } from "../lib/light";
import { useTone } from "../lib/useTone";

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const IMAGE = { min: 30, max: 260 };
const TEXT = { min: 4, max: 18 };
const ARROWS = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] };
const NEW_ART = { image: { x: 50, y: 50, s: 100 }, text: { x: 50, y: 50, size: 9, color: "ink", plate: false } };

export default function AddCard({ onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({ id: `new-${Date.now()}`, content: "", link: "", imageUrl: null, tiny: null, blob: null, art: NEW_ART }));
  const [chosen, setChosen] = useState("text");
  const [textMoved, setTextMoved] = useState(false);
  const [step, setStep] = useState("edit"); // edit | preview | discard
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { art } = draft;
  const hasText = Boolean(draft.content.trim());
  const long = isLongText(draft);
  const ready = Boolean(draft.imageUrl || hasText);

  useEffect(() => () => { if (draft.imageUrl) URL.revokeObjectURL(draft.imageUrl); }, [draft.imageUrl]);

  const setLayer = (key, change) => setDraft((d) => ({
    ...d, art: { ...d.art, [key]: { ...d.art[key], ...(typeof change === "function" ? change(d.art[key]) : change) } },
  }));
  const move = (key, dx, dy) => {
    setLayer(key, (l) => ({ x: clamp(l.x + dx, 0, 100), y: clamp(l.y + dy, 0, 100) }));
    if (key === "text") setTextMoved(true);
  };
  const resizeTo = (key, size) => setLayer(key, key === "image" ? { s: clamp(size, IMAGE.min, IMAGE.max) } : { size: clamp(size, TEXT.min, TEXT.max) });

  const pickImage = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    try {
      const { url, blob, tiny, ratio } = await readImage(file);
      setDraft((d) => ({
        ...d, imageUrl: url, blob, tiny,
        art: {
          // Start with the whole image visible. It is cropped only when the person enlarges it.
          image: { x: 50, y: 50, s: clamp(Math.min(100, 150 / ratio), IMAGE.min, 100) },
          text: textMoved ? d.art.text : { ...d.art.text, y: 82, plate: true },
        },
      }));
      setChosen("image");
    } catch (err) {
      console.error(err);
      setError("這張圖片讀不到，請換一張");
    }
  };
  const dropImage = () => {
    setDraft((d) => ({
      ...d, imageUrl: null, blob: null, tiny: null,
      art: { ...d.art, text: textMoved ? d.art.text : { ...d.art.text, y: 50, plate: false } },
    }));
    setChosen("text");
  };

  // One finger moves the touched layer. Two fingers resize it.
  const touch = useRef({ fingers: new Map(), grab: null, key: "text" });
  const spread = () => {
    const [p, q] = [...touch.current.fingers.values()];
    return Math.hypot(p.x - q.x, p.y - q.y);
  };
  const onPointerDown = (e) => {
    if (long || !ready) return;
    const t = touch.current;
    t.fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
    if (t.fingers.size === 1) {
      const hit = e.target.closest("[data-layer]")?.dataset.layer;
      t.key = hit ?? (draft.imageUrl ? "image" : "text");
      setChosen(t.key);
      t.grab = { x: e.clientX, y: e.clientY };
    } else if (t.fingers.size === 2) {
      t.grab = { pinch: Math.max(spread(), 1), size: t.key === "image" ? art.image.s : art.text.size };
    }
  };
  const onPointerMove = (e) => {
    const t = touch.current;
    if (!t.fingers.has(e.pointerId) || !t.grab) return;
    t.fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (t.grab.pinch) {
      if (t.fingers.size > 1) resizeTo(t.key, (t.grab.size * spread()) / t.grab.pinch);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    move(t.key, ((e.clientX - t.grab.x) / r.width) * 100, ((e.clientY - t.grab.y) / r.height) * 100);
    t.grab = { x: e.clientX, y: e.clientY };
  };
  const onPointerEnd = (e) => {
    const t = touch.current;
    t.fingers.delete(e.pointerId);
    const [rest] = t.fingers.values();
    t.grab = rest ? { ...rest } : null;
  };
  const layer = (key) => ({
    "data-layer": key, tabIndex: 0, role: "group",
    "aria-label": key === "image" ? "圖片，方向鍵移動" : "文字，方向鍵移動",
    className: draft.imageUrl && chosen === key ? "on" : "",
    onFocus: () => setChosen(key),
    onKeyDown: (e) => {
      const d = ARROWS[e.key];
      if (d) { e.preventDefault(); move(key, d[0], d[1]); }
    },
  });

  const card = { ...draft, content: draft.content.trim(), link: draft.link.trim(), art: long ? null : art };
  const tone = useTone(card);
  const toPreview = () => {
    if (card.link && !isWebLink(card.link)) { setError("連結要以 http:// 或 https:// 開頭"); return; }
    setError("");
    setStep("preview");
  };
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave(card);
    } catch (err) {
      console.error(err);
      setError("儲存失敗，內容還在，請再試一次");
      setSaving(false);
    }
  };
  const cancel = () => (ready ? setStep("discard") : onClose());

  return (
    <>
      <View label="新增卡片" onClose={cancel} inert={step !== "edit"}>
        <header>
          <Glass icon="no" label="取消" className="round" data-focus onClick={cancel} />
          <h2>新增</h2>
          <span className="round" />
        </header>
        <div className="body">
          <div className="canvas" style={{ backgroundImage: draft.imageUrl ? `linear-gradient(rgba(255,255,255,.12),rgba(255,255,255,.12)),url("${draft.tiny}")` : washOf(draft) }}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>
            {long ? <div className="longtext">{draft.content}</div> : (
              <Art card={draft} layer={layer}>{!ready && <div className="hint">圖片或文字</div>}</Art>
            )}
          </div>
          <div className="tools">
            <div className="row">
              <label className="chip">
                <input type="file" accept="image/*" onChange={pickImage} />
                <Icon name="image" /><span className="sr">{draft.imageUrl ? "換圖片" : "選圖片"}</span>
              </label>
              {draft.imageUrl && <button type="button" className="chip" aria-label="移除圖片" onClick={dropImage}><Icon name="trash" /></button>}
            </div>
            <textarea aria-label="文字" placeholder="寫下一句話" value={draft.content}
              onChange={(e) => { const content = e.target.value; setDraft((d) => ({ ...d, content })); if (content.trim()) setChosen("text"); }} />
            {draft.imageUrl && (
              <label className="slide"><Icon name="image" />
                <input aria-label="圖片大小" type="range" min={IMAGE.min} max={IMAGE.max} value={art.image.s} onChange={(e) => { setChosen("image"); resizeTo("image", Number(e.target.value)); }} />
              </label>
            )}
            {hasText && !long && (
              <>
                <label className="slide"><Icon name="text" />
                  <input aria-label="文字大小" type="range" min={TEXT.min} max={TEXT.max} step=".5" value={art.text.size} onChange={(e) => { setChosen("text"); resizeTo("text", Number(e.target.value)); }} />
                </label>
                <div className="row">
                  <button type="button" className="chip" aria-pressed={art.text.color === "ink"} aria-label="深色文字" onClick={() => setLayer("text", { color: "ink" })}><i className="dot ink" /></button>
                  <button type="button" className="chip" aria-pressed={art.text.color === "paper"} aria-label="白色文字" onClick={() => setLayer("text", { color: "paper" })}><i className="dot paper" /></button>
                  <button type="button" className="chip" aria-pressed={art.text.plate} onClick={() => setLayer("text", (t) => ({ plate: !t.plate }))} aria-label="文字底色"><Icon name="plate" /></button>
                </div>
              </>
            )}
            <input type="url" className="linkbox" aria-label="連結（選填）" placeholder="連結（選填）" value={draft.link}
              onChange={(e) => { const link = e.target.value; setDraft((d) => ({ ...d, link })); }} />
            {error && step === "edit" && <p className="err" role="alert">{error}</p>}
          </div>
        </div>
        <div className="foot"><button type="button" className="primary" disabled={!ready} onClick={toPreview}>預覽</button></div>
      </View>
      {step === "preview" && (
        <View className={`view preview ${tone}`} label="預覽" onClose={saving ? undefined : () => setStep("edit")}>
          <Light card={card} />
          <div className="deck"><div className="card"><CardFace card={card} /></div></div>
          {error && <p className="toast" role="alert">{error}</p>}
          <div className="acts">
            <Glass icon="edit" label="修改" disabled={saving} onClick={() => setStep("edit")} />
            <Glass icon="check" label={saving ? "儲存中" : "加入"} className={saving ? "busy" : ""} data-focus disabled={saving} onClick={save} />
          </div>
        </View>
      )}
      {step === "discard" && (
        <Confirm title="還沒加入，要放棄嗎？" action="放棄" keep="繼續編輯" onConfirm={onClose} onClose={() => setStep("edit")} />
      )}
    </>
  );
}
