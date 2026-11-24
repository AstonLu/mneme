import { cleanCode } from "./code.js";

const OWNER = "owner"; // the owner's counts stay when the owner's code changes

const toPerson = (row) => row && { id: row.id, code: row.code, owner: false, canDelete: Boolean(row.can_delete) };
const ownerOf = (env) => ({ id: OWNER, code: cleanCode(env.OWNER_CODE), owner: true, canDelete: true });

export async function personByCode(env, code) {
  const clean = cleanCode(code);
  if (!clean) return null;
  const owner = ownerOf(env);
  if (clean === owner.code) return owner;
  return toPerson(await env.DB.prepare("SELECT * FROM people WHERE code = ?").bind(clean).first());
}

export async function personById(env, id) {
  if (!id) return null;
  if (id === OWNER) return ownerOf(env);
  return toPerson(await env.DB.prepare("SELECT * FROM people WHERE id = ?").bind(id).first());
}

export async function listPeople(env) {
  const { results } = await env.DB.prepare("SELECT * FROM people ORDER BY code").all();
  return results.map(toPerson);
}

/** Returns null when the code is empty or taken. */
export async function addPerson(env, code) {
  const clean = cleanCode(code);
  if (!clean || (await personByCode(env, clean))) return null;
  const id = crypto.randomUUID();
  const { meta } = await env.DB.prepare("INSERT OR IGNORE INTO people (id, code) VALUES (?, ?)").bind(id, clean).run();
  return meta.changes ? toPerson({ id, code: clean, can_delete: 0 }) : null;
}

export async function setCanDelete(env, id, allowed) {
  const { meta } = await env.DB.prepare("UPDATE people SET can_delete = ? WHERE id = ?").bind(allowed ? 1 : 0, id).run();
  return meta.changes > 0;
}

export async function removePerson(env, id) {
  const [{ meta }] = await env.DB.batch([
    env.DB.prepare("DELETE FROM people WHERE id = ?").bind(id),
    env.DB.prepare("DELETE FROM stats WHERE person = ?").bind(id),
  ]);
  return meta.changes > 0;
}
