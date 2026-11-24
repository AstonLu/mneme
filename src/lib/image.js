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
    return { blob, url: URL.createObjectURL(blob), ratio: height / width, tiny: drawTo(image, 4, 5).toDataURL() };
  } finally {
    URL.revokeObjectURL(source);
  }
}

const toLinear = (v) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);

/** Is the bottom of a card dark? `white` is how much white lies over it on screen. Icons on glass follow this. */
export async function isDarkBottom(tiny, white) {
  const context = drawTo(await load(tiny), 4, 5).getContext("2d");
  const { data } = context.getImageData(0, 4, 4, 1);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [0, 1, 2].map((k) => toLinear(data[i + k] * (1 - white) + 255 * white));
    sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  return sum / 4 < 0.2;
}
