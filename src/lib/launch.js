// The launch cover is in index.html, so it is there before any script. Timing follows Personal CFO.
const MIN_MS = 2500; // the intro plays once, until the slogan is written
const EXIT_MS = 800; // matches the CSS in index.html
let lifting = false;

/** Lifts the cover once the intro has played and the first card's image is ready. */
export async function liftLaunch(imageUrl) {
  if (lifting) return;
  lifting = true;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
  if (imageUrl) {
    const image = new Image();
    image.src = imageUrl;
    await Promise.race([image.decode().catch(() => {}), wait(3000)]);
  }
  await wait(MIN_MS - performance.now());
  const cover = document.getElementById("launch");
  cover?.classList.add("leaving");
  setTimeout(() => cover?.remove(), EXIT_MS);
}
