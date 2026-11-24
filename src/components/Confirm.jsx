import { useState } from "react";
import View from "./View";

export default function Confirm({ title, action, keep, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const confirm = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await onConfirm();
    } catch (err) {
      console.error(err);
      setFailed(true);
      setBusy(false);
    }
  };
  return (
    <View className="scrim" role="alertdialog" label={title} onClose={busy ? undefined : onClose}
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="sheet">
        <p>{title}</p>
        {failed && <p className="err" role="alert">沒有成功，請再試一次</p>}
        <button type="button" className="go" disabled={busy} onClick={confirm}>{busy ? "處理中" : action}</button>
        <button type="button" data-focus disabled={busy} onClick={onClose}>{keep}</button>
      </div>
    </View>
  );
}
