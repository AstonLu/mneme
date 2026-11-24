import { useRef, useState } from "react";
import { Icon } from "../components/Glass";
import { signInErrorText } from "../domain/signInError";
import slogan from "../slogan.svg?raw";
import wordmark from "../wordmark.svg?raw";

const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A card: a wrong code shakes it, a right code swipes it away. */
export default function SignIn({ onSignIn, onEnter }) {
  const card = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const code = new FormData(e.currentTarget).get("code");
    setBusy(true);
    setError("");
    try {
      await onSignIn(code);
    } catch (err) {
      console.error(err);
      setError(signInErrorText(err));
      setBusy(false);
      if (!calm()) {
        card.current.animate([0, -10, 9, -6, 4, 0].map((x) => ({ transform: `translateX(${x}px) rotate(${x / 5}deg)` })), { duration: 420, easing: "ease-out" });
      }
      return;
    }
    const away = calm() ? null : card.current.animate(
      [{ transform: "none" }, { transform: "translateX(140%) rotate(14deg)" }],
      { duration: 320, easing: "cubic-bezier(.4,.1,.6,1)", fill: "forwards" },
    );
    await away?.finished.catch(() => {});
    await onEnter();
    // Still here: the code was taken back in between.
    away?.cancel();
    setBusy(false);
  };

  return (
    <main className="page signin">
      <div className="hand">
        <div className="under" />
        <form ref={card} className="over" onSubmit={submit}>
          <h1 aria-label="Nudge" dangerouslySetInnerHTML={{ __html: wordmark }} />
          <div className="written" role="img" aria-label="Swipe what matters" dangerouslySetInnerHTML={{ __html: slogan }} />
          <div className="codebox">
            <input name="code" aria-label="code" placeholder="code" autoComplete="username" autoCapitalize="none"
              autoCorrect="off" spellCheck="false" maxLength="40" required />
            <button type="submit" disabled={busy} aria-label="進入"><Icon name="next" /></button>
          </div>
          <p className="err" role="alert">{error}</p>
        </form>
      </div>
    </main>
  );
}
