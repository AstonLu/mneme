import { useEffect, useRef } from "react";

/** A layer above the page. Takes focus, closes on Escape, and gives focus back when it closes. */
export default function View({ label, onClose, role = "dialog", className = "view", inert, children, ...rest }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement;
    const node = ref.current;
    (node.querySelector("[data-focus]") ?? node).focus({ preventScroll: true });
    const onKey = (e) => {
      // Only the layer on top reacts.
      if (e.key === "Escape" && !e.defaultPrevented && !node.inert) {
        e.preventDefault();
        closeRef.current?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      // Wait until React has lifted `inert` from the layer below.
      requestAnimationFrame(() => { if (opener?.isConnected) opener.focus({ preventScroll: true }); });
    };
  }, []);

  return (
    <section ref={ref} className={className} role={role} aria-label={label} aria-modal="true" tabIndex={-1} inert={inert} {...rest}>
      {children}
    </section>
  );
}
