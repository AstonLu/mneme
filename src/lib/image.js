function load(src, crossOrigin) {
  const image = new Image();
  if (crossOrigin) image.crossOrigin = "anonymous";
  image.src = src;
  return image.decode().then(() => image);
}

function drawTo(image, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(image, 0, 0, width, height);
  return canvas;
}

/** A 4x5 copy of an image. Scaled up, it is a soft light that needs no blur filter. */
export async function tinyOf(url) {
  try {
    return drawTo(await load(url, true), 4, 5).toDataURL();
  } catch {
    return null; // no read permission: the card uses its fixed color pair
  }
}

/** Reads a picked file, at most 1400 px on the long side. Throws when it is not a readable image. */
export async function readImage(file) {
  const source = URL.createObjectURL(file);
  try {
    const image = await load(source);
    const k = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * k));
    const height = Math.max(1, Math.round(image.naturalHeight * k));
    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise((resolve) => drawTo(image, width, height).toBlob(resolve, type, 0.88));
    if (!blob) throw new Error("image encode failed");
    return { blob, url: URL.createObjectURL(blob), tiny: drawTo(image, 4, 5).toDataURL() };
  } finally {
    URL.revokeObjectURL(source);
  }
}

/** A light version of the color around the edge of a tiny copy: the backdrop of the picture, not its subject. */
export async function edgeOf(tiny) {
  const { data } = drawTo(await load(tiny), 4, 5).getContext("2d").getImageData(0, 0, 4, 5);
  const sum = [0, 0, 0];
  let n = 0;
  for (let i = 0; i < 20; i += 1) {
    if (i >= 4 && i % 4 !== 0 && i % 4 !== 3) continue; // the top row and both sides
    for (let k = 0; k < 3; k += 1) sum[k] += data[i * 4 + k];
    n += 1;
  }
  const color = sum.map((v) => v / n);
  // Add only as much white as the dark icons and text need.
  const mean = (color[0] + color[1] + color[2]) / 3;
  const white = Math.max(0.35, (208 - mean) / (246 - mean));
  return `rgb(${color.map((v) => Math.round(v + (246 - v) * white)).join(", ")})`;
}
