// A code is a person. It works on any device.
const DAYS = 180;
const COOKIE = "nudge";
const bytes = (text) => new TextEncoder().encode(text);

/** Spaces around the code and capitals do not matter: phone keyboards add them. */
export const cleanCode = (code) => (typeof code === "string" ? code.trim().toLowerCase().slice(0, 40) : "");

async function sign(key, text) {
  const imported = await crypto.subtle.importKey("raw", bytes(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", imported, bytes(text)));
  return [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function same(a, b) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i % Math.max(b.length, 1));
  return diff === 0;
}

/** A pass stops working when the person is removed or gets a new code. */
export async function makePass(key, person, now) {
  const until = now + DAYS * 86_400_000;
  return `${until}.${person.id}.${await sign(key, `${until}|${person.id}|${person.code}`)}`;
}

export const passPerson = (pass) => (pass || "").split(".")[1] || null;

export async function passIsValid(key, person, pass, now) {
  const [until, id, mac] = (pass || "").split(".");
  if (!mac || id !== person.id || !(Number(until) > now)) return false;
  return same(mac, await sign(key, `${until}|${id}|${person.code}`));
}

export const readPass = (request) => (request.headers.get("Cookie") || "").split(/;\s*/)
  .find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);

export function passCookie(pass, secure) {
  return `${COOKIE}=${pass}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${pass ? DAYS * 86_400 : 0}${secure ? "; Secure" : ""}`;
}
