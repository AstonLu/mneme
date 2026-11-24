import { lightOf } from "../lib/light";

/** The colors follow the code, so one person looks the same on every device. */
export default function Avatar({ code, big = false }) {
  return (
    <span className={big ? "avatar big" : "avatar"} style={{ backgroundImage: lightOf({ id: code }) }} aria-hidden="true">
      {[...code][0]?.toUpperCase()}
    </span>
  );
}
