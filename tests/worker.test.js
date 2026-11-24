import assert from "node:assert/strict";
import test from "node:test";
import { cleanCard } from "../worker/cards.js";
import { cleanCode, makePass, passCookie, passIsValid, passPerson } from "../worker/code.js";

test("the code ignores outer spaces and capitals", () => {
  assert.equal(cleanCode(" Maple "), "maple");
  for (const bad of ["", " ", undefined, 5, null]) assert.equal(cleanCode(bad), "");
});

test("a pass ends with time, a new code, a new key, another person, or any change", async () => {
  const ann = { id: "ann", code: "maple" };
  const pass = await makePass("k", ann, 1000);
  assert.equal(passPerson(pass), "ann");
  assert.equal(await passIsValid("k", ann, pass, 2000), true);
  assert.equal(await passIsValid("k", ann, pass, 1000 + 181 * 86_400_000), false);
  assert.equal(await passIsValid("k", { ...ann, code: "other" }, pass, 2000), false);
  assert.equal(await passIsValid("k", { id: "owner", code: "maple" }, pass, 2000), false);
  assert.equal(await passIsValid("k", { id: "owner", code: "maple" }, pass.replace("ann", "owner"), 2000), false);
  assert.equal(await passIsValid("k2", ann, pass, 2000), false);
  assert.equal(await passIsValid("k", ann, pass.replace(/^\d/, "9"), 2000), false);
  for (const bad of ["", undefined, "..", "9999999999999.ann."]) assert.equal(await passIsValid("k", ann, bad, 2000), false);
});

test("the cookie is hidden from scripts and stays on this site", () => {
  const cookie = passCookie("x", true);
  for (const part of ["HttpOnly", "Secure", "SameSite=Strict"]) assert.ok(cookie.includes(part));
});

test("only known, safe card fields are saved", () => {
  const card = cleanCard({ content: " a ", link: "javascript:1", tiny: 'data:image/png;base64,AA");x', likes: 99, art: { image: { x: 999 }, text: { color: "z" } } }, false, 5);
  assert.deepEqual(card, {
    content: "a", link: "", tiny: null, createdAt: 5, template: null, author: "", handle: "",
    art: { image: { x: 100, y: 50, s: 100 }, text: { x: 50, y: 50, size: 9, color: "ink", plate: false } },
  });
  assert.equal(cleanCard({ content: " " }, false, 5), null);
  assert.equal(cleanCard(null, true, 5), null);
});
