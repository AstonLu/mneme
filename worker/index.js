import { cleanAvatar } from "../src/domain/avatars.js";
import { recordSwipe } from "../src/domain/rank.js";
import { cleanTemplate } from "../src/domain/templates.js";
import { cleanCard } from "./cards.js";
import { cleanCode, makePass, passCookie, passIsValid, passPerson, readPass } from "./code.js";
import { addPerson, avatarOf, listPeople, personByCode, personById, removePerson, setAvatar, setCanDelete } from "./people.js";

const MAX_IMAGE = 10 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png"];
const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const reply = (status, body = {}, headers = {}) => Response.json(body, { status, headers: { ...HEADERS, ...headers } });

const NEW = { likes: 0, skips: 0, lastSeenAt: null };
const toCard = (row) => ({ ...JSON.parse(row.data), ...(row.mine ? JSON.parse(row.mine) : NEW), id: row.id, imageUrl: row.image ? `/api/images/${row.image}` : null });

async function signingKey(db) {
  await db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('signing', ?)")
    .bind(crypto.randomUUID() + crypto.randomUUID()).run();
  return (await db.prepare("SELECT value FROM settings WHERE key = 'signing'").first()).value;
}

async function session(request, env, key, secure) {
  if (request.method === "DELETE") return reply(200, {}, { "Set-Cookie": passCookie("", secure) });
  if (request.method !== "POST") return reply(405);
  const { code } = await request.json().catch(() => ({}));
  const person = await personByCode(env, code);
  if (!person) return reply(401);
  return reply(200, {}, { "Set-Cookie": passCookie(await makePass(key, person, Date.now()), secure) });
}

/** Only the owner reaches this. */
async function people(request, env, id) {
  if (!id && request.method === "GET") return reply(200, await listPeople(env));
  const body = request.method === "DELETE" ? {} : await request.json().catch(() => ({}));
  if (!id && request.method === "POST") {
    const person = await addPerson(env, body.code);
    return person ? reply(201, person) : reply(409);
  }
  if (id && request.method === "PATCH") return reply((await setCanDelete(env, id, body.canDelete === true)) ? 200 : 404);
  if (id && request.method === "DELETE") return reply((await removePerson(env, id)) ? 200 : 404);
  return reply(405);
}

async function addCard(request, env) {
  if (Number(request.headers.get("Content-Length")) > MAX_IMAGE + 100_000) return reply(413);
  let form;
  let raw;
  try {
    form = await request.formData();
    raw = JSON.parse(form.get("card"));
  } catch {
    return reply(400);
  }
  const image = form.get("image");
  const hasImage = Boolean(image && typeof image !== "string");
  if (hasImage && (!TYPES.includes(image.type) || image.size > MAX_IMAGE)) return reply(415);
  const card = cleanCard(raw, hasImage, Date.now());
  if (!card) return reply(400);
  const id = crypto.randomUUID();
  const name = hasImage ? id : null;
  if (name) await env.IMAGES.put(name, image.stream(), { metadata: { type: image.type } });
  try {
    await env.DB.prepare("INSERT INTO cards (id, data, image) VALUES (?, ?, ?)").bind(id, JSON.stringify(card), name).run();
  } catch (err) {
    if (name) await env.IMAGES.delete(name);
    throw err;
  }
  return reply(201, toCard({ id, data: JSON.stringify(card), image: name }));
}

/** Each person has their own counts. Two open tabs of one person do not overwrite each other. */
async function swipeCard(id, person, request, env) {
  const { direction } = await request.json().catch(() => ({}));
  if (direction !== "left" && direction !== "right") return reply(400);
  for (let tries = 0; tries < 5; tries += 1) {
    const row = await env.DB.prepare("SELECT s.data FROM cards c LEFT JOIN stats s ON s.card = c.id AND s.person = ? WHERE c.id = ?")
      .bind(person, id).first();
    if (!row) return reply(404);
    const next = JSON.stringify(recordSwipe(row.data ? JSON.parse(row.data) : NEW, direction, Date.now()));
    const write = row.data
      ? env.DB.prepare("UPDATE stats SET data = ? WHERE person = ? AND card = ? AND data = ?").bind(next, person, id, row.data)
      : env.DB.prepare("INSERT OR IGNORE INTO stats (data, person, card) VALUES (?, ?, ?)").bind(next, person, id);
    if ((await write.run()).meta.changes) return reply(200);
  }
  return reply(409);
}

async function changeTemplate(id, request, env) {
  const template = cleanTemplate((await request.json().catch(() => ({})))?.template);
  if (!template) return reply(400);
  const { meta } = await env.DB.prepare("UPDATE cards SET data = json_set(data, '$.template', ?) WHERE id = ?").bind(template, id).run();
  return reply(meta.changes ? 200 : 404);
}

async function changeAvatar(person, request, env) {
  const avatar = cleanAvatar((await request.json().catch(() => ({})))?.avatar);
  if (!avatar) return reply(400);
  await setAvatar(env, person, avatar);
  return reply(200);
}

async function deleteCard(id, env) {
  const [{ results: [row] }] = await env.DB.batch([
    env.DB.prepare("DELETE FROM cards WHERE id = ? RETURNING image").bind(id),
    env.DB.prepare("DELETE FROM stats WHERE card = ?").bind(id),
  ]);
  if (!row) return reply(404);
  if (row.image) await env.IMAGES.delete(row.image).catch((err) => console.error("image left behind", err));
  return reply(200);
}

async function getImage(name, env) {
  const { value, metadata } = await env.IMAGES.getWithMetadata(name, { type: "stream", cacheTtl: 86_400 });
  if (!value) return reply(404);
  return new Response(value, {
    headers: {
      ...HEADERS, "Cache-Control": "private, max-age=31536000, immutable",
      "Content-Type": metadata?.type || "application/octet-stream",
    },
  });
}

async function handle(request, env) {
  const url = new URL(request.url);
  const [, , kind, id, action] = url.pathname.split("/");
  const origin = request.headers.get("Origin");
  if (request.method !== "GET" && origin && origin !== url.origin) return reply(403);
  if (!cleanCode(env.OWNER_CODE)) return reply(503, { reason: "no-code" });

  const key = await signingKey(env.DB);
  if (kind === "session" && !id) return session(request, env, key, url.protocol === "https:");
  const pass = readPass(request);
  const person = await personById(env, passPerson(pass));
  if (!person || !(await passIsValid(key, person, pass, Date.now()))) return reply(401);

  if (kind === "people") return person.owner ? people(request, env, id) : reply(403);
  if (kind === "cards" && !id && request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT c.id, c.data, c.image, s.data AS mine FROM cards c LEFT JOIN stats s ON s.card = c.id AND s.person = ?",
    ).bind(person.id).all();
    const { code, owner, canDelete } = person;
    return reply(200, { me: { code, owner, canDelete, avatar: await avatarOf(env, person) }, cards: results.map(toCard) });
  }
  if (kind === "cards" && !id && request.method === "POST") return addCard(request, env);
  if (kind === "cards" && id && action === "swipe" && request.method === "POST") return swipeCard(id, person.id, request, env);
  if (kind === "cards" && id && !action && request.method === "DELETE") return person.canDelete ? deleteCard(id, env) : reply(403);
  if (kind === "cards" && id && !action && request.method === "PATCH") return person.canDelete ? changeTemplate(id, request, env) : reply(403);
  if (kind === "me" && !id && request.method === "PATCH") return changeAvatar(person, request, env);
  if (kind === "images" && id && request.method === "GET") return getImage(id, env);
  return reply(404);
}

export default {
  async fetch(request, env) {
    if (!new URL(request.url).pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    try {
      return await handle(request, env);
    } catch (err) {
      console.error(err);
      return reply(500);
    }
  },
};
