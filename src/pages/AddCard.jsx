import { useEffect, useRef, useState } from "react";
import { CardFace } from "../components/CardFace";
import Confirm from "../components/Confirm";
import Glass, { Icon } from "../components/Glass";
import TemplateStrip from "../components/TemplateStrip";
import View from "../components/View";
import { isWebLink } from "../domain/card";
import { linkSource } from "../domain/templates";
import { readImage } from "../lib/image";

const EMPTY = { id: "new", content: "", link: "", author: "", handle: "", template: "plain", imageUrl: null, tiny: null, blob: null, art: null };

/** iPhone: the keyboard covers the page. Keep the tools above it. */
function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const view = window.visualViewport;
    if (!view) return undefined;
    const measure = () => setHeight(Math.max(0, Math.round(window.innerHeight - view.height - view.offsetTop)));
    view.addEventListener("resize", measure);
    view.addEventListener("scroll", measure);
    return () => { view.removeEventListener("resize", measure); view.removeEventListener("scroll", measure); };
  }, []);
  return height;
}

function Row({ icon, label, inputRef, value, onChange, onClear, ...rest }) {
  return (
    <div className="meta">
      <Icon name={icon} />
      <input ref={inputRef} aria-label={label} placeholder={label} value={value} autoComplete="off" onChange={(e) => onChange(e.target.value)} {...rest} />
      <button type="button" aria-label={`移除${label}`} onClick={onClear}><Icon name="no" /></button>
    </div>
  );
}

/** Two steps: write, then choose how it looks. */
export default function AddCard({ onSave, onClose }) {
  const [draft, setDraft] = useState(EMPTY);
  const [rows, setRows] = useState({ link: false, author: false });
  const [step, setStep] = useState("write"); // write | style | discard
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const text = useRef(null);
  const linkInput = useRef(null);
  const authorInput = useRef(null);
  const keyboard = useKeyboardHeight();
  const ready = Boolean(draft.imageUrl || draft.content.trim());
  const card = { ...draft, content: draft.content.trim(), link: draft.link.trim(), author: draft.author.trim() };

  useEffect(() => () => { if (draft.imageUrl) URL.revokeObjectURL(draft.imageUrl); }, [draft.imageUrl]);

  const set = (change) => setDraft((d) => ({ ...d, ...change }));
  const setLink = (link) => {
    const { handle, template } = linkSource(link.trim());
    setError("");
    set({ link, handle, ...(template && { template }) });
  };
  const show = (key) => {
    setRows((r) => ({ ...r, [key]: true }));
    requestAnimationFrame(() => (key === "link" ? linkInput : authorInput).current?.focus());
  };
  const hide = (key) => {
    setRows((r) => ({ ...r, [key]: false }));
    if (key === "link") setLink(""); else set({ [key]: "" });
    text.current.focus();
  };

  // A link pasted alone is the source, not the text.
  const onPaste = (e) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (/\s/.test(pasted) || !isWebLink(pasted)) return;
    e.preventDefault();
    setLink(pasted);
  };
  const pickImage = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    try {
      const { url, blob, tiny } = await readImage(file);
      set({ imageUrl: url, blob, tiny });
    } catch (err) {
      console.error(err);
      setError("這張圖片讀不到，請換一張");
    }
  };
  const toStyle = () => {
    if (card.link && !isWebLink(card.link)) { setError("連結要以 http:// 或 https:// 開頭"); return; }
    setError("");
    setStep("style");
  };
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave({ ...card, template: card.imageUrl ? null : card.template });
    } catch (err) {
      console.error(err);
      setError("儲存失敗，內容還在，請再試一次");
      setSaving(false);
    }
  };
  const cancel = () => (ready || draft.link ? setStep("discard") : onClose());

  return (
    <>
      <View label="新增卡片" onClose={cancel} inert={step !== "write"} style={{ paddingBottom: keyboard || undefined }}>
        <div className="head fixed">
          <Glass icon="no" label="取消" className="round first" onClick={cancel} />
          <button type="button" className="act" disabled={!ready} onClick={toStyle}>下一步</button>
        </div>
        <div className="write">
          {draft.imageUrl && (
            <div className="shot">
              <img src={draft.imageUrl} alt="選好的圖片" />
              <button type="button" aria-label="移除圖片" onClick={() => set({ imageUrl: null, blob: null, tiny: null })}><i><Icon name="no" /></i></button>
            </div>
          )}
          <textarea ref={text} rows="2" maxLength="5000" data-focus aria-label="文字" placeholder="寫下一句話，或貼上連結" value={draft.content}
            onPaste={onPaste} onChange={(e) => set({ content: e.target.value })} />
          {(rows.link || draft.link) && (
            <Row icon="chain" label="連結" type="url" autoCapitalize="none" inputRef={linkInput} value={draft.link} onChange={setLink} onClear={() => hide("link")} />
          )}
          {(rows.author || draft.author) && (
            <Row icon="person" label="作者" maxLength="80" inputRef={authorInput} value={draft.author} onChange={(author) => set({ author })} onClear={() => hide("author")} />
          )}
          {error && step === "write" && <p className="err" role="alert">{error}</p>}
        </div>
        <div className="tb">
          <label>
            <input type="file" accept="image/*" aria-label={draft.imageUrl ? "換圖片" : "選圖片"} onChange={pickImage} /><Icon name="image" />
          </label>
          <button type="button" aria-label="連結" aria-pressed={Boolean(rows.link || draft.link)} onClick={() => show("link")}><Icon name="chain" /></button>
          <button type="button" aria-label="作者" aria-pressed={Boolean(rows.author || draft.author)} onClick={() => show("author")}><Icon name="person" /></button>
        </div>
      </View>
      {step === "style" && (
        <View label="選模板" onClose={saving ? undefined : () => setStep("write")}>
          <div className="head fixed">
            <Glass icon="back" label="返回" className="round first" disabled={saving} onClick={() => setStep("write")} />
            <button type="button" className="act" data-focus disabled={saving} onClick={save}>{saving ? "儲存中" : "加入"}</button>
          </div>
          <div className="style">
            <div className="prev"><CardFace card={card} still /></div>
            {!card.imageUrl && <TemplateStrip card={card} onChoose={(template) => set({ template })} />}
            {error && <p className="err" role="alert">{error}</p>}
          </div>
        </View>
      )}
      {step === "discard" && (
        <Confirm title="還沒加入，要放棄嗎？" action="放棄" keep="繼續編輯" onConfirm={onClose} onClose={() => setStep("write")} />
      )}
    </>
  );
}
