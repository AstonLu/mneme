import { useEffect, useState } from "react";
import Avatar from "../components/Avatar";
import Confirm from "../components/Confirm";
import Glass, { Icon } from "../components/Glass";
import View from "../components/View";

/** Your code, sign-out, and for the owner: who else has a code and who may delete cards. */
export default function Account({ me, getPeople, onSignOut, onClose }) {
  const [list, setList] = useState(null); // null while loading
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(null); // "leave" | a person to remove

  useEffect(() => {
    if (!me.owner) return undefined;
    let live = true;
    getPeople().list().then((found) => { if (live) setList(found); }, (err) => {
      console.error(err);
      if (live) setError("成員讀取失敗");
    });
    return () => { live = false; };
  }, [me.owner, getPeople]);

  const attempt = async (work, text) => {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (err) {
      console.error(err);
      setError(err.status === 409 ? "這個 code 已經有人用" : text);
    } finally {
      setBusy(false);
    }
  };
  const add = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    attempt(async () => {
      const person = await getPeople().add(new FormData(form).get("code"));
      setList((l) => [...l, person]);
      form.reset();
    }, "沒有加入，請再試一次");
  };
  const toggle = (person) => attempt(async () => {
    await getPeople().setCanDelete(person.id, !person.canDelete);
    setList((l) => l.map((p) => (p.id === person.id ? { ...p, canDelete: !p.canDelete } : p)));
  }, "沒有改成功，請再試一次");

  return (
    <>
      <View label="帳號" onClose={onClose} inert={Boolean(asking)}>
        <Glass icon="back" label="回到收藏" className="round float left" data-focus onClick={onClose} />
        <Glass icon="leave" label="登出" className="round float" onClick={() => setAsking("leave")} />
        <div className="body account">
          <Avatar code={me.code} big />
          <h2>{me.code}</h2>
          {me.owner && (
            <section aria-label="成員">
              {list?.map((person) => (
                <div className="person" key={person.id}>
                  <Avatar code={person.code} />
                  <span>{person.code}</span>
                  <button type="button" className="chip" aria-pressed={person.canDelete} disabled={busy}
                    aria-label={`${person.code} 可以刪除卡片`} onClick={() => toggle(person)}>可刪卡</button>
                  <button type="button" className="chip plain" disabled={busy} aria-label={`移除 ${person.code}`} onClick={() => setAsking(person)}><Icon name="no" /></button>
                </div>
              ))}
              {list && (
                <form className="person" onSubmit={add}>
                  <input name="code" aria-label="新成員的 code" placeholder="新成員的 code" maxLength="40" autoComplete="off"
                    autoCapitalize="none" autoCorrect="off" spellCheck="false" required />
                  <button type="submit" className="chip" disabled={busy} aria-label="加入成員"><Icon name="add" /></button>
                </form>
              )}
              {!list && !error && <p>讀取中</p>}
            </section>
          )}
          {error && <p className="err" role="alert">{error}</p>}
        </div>
      </View>
      {asking === "leave" && <Confirm title="要登出嗎？" action="登出" keep="取消" onConfirm={onSignOut} onClose={() => setAsking(null)} />}
      {asking?.id && (
        <Confirm title={`移除 ${asking.code}？滑卡紀錄會一起刪除`} action="移除" keep="保留" onClose={() => setAsking(null)}
          onConfirm={async () => {
            await getPeople().remove(asking.id);
            setList((l) => l.filter((p) => p.id !== asking.id));
            setAsking(null);
          }} />
      )}
    </>
  );
}
