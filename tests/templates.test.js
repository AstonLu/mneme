import test from "node:test";
import assert from "node:assert/strict";
import { cleanAvatar } from "../src/domain/avatars.js";
import { cleanTemplate, fontSize, linkSource, lyricLines, templateOf, threadParts } from "../src/domain/templates.js";
import { cleanCard } from "../worker/cards.js";

test("only known templates and avatars are kept; an old card is plain text", () => {
  for (const bad of ["x", "toString", "__proto__", 3, null, undefined]) {
    assert.equal(cleanTemplate(bad), null);
    assert.equal(cleanAvatar(bad), null);
  }
  assert.equal(templateOf({}), "plain");
  const card = cleanCard({ content: "a", template: "tweet", author: " Ann ", handle: 5 }, false, 1);
  assert.deepEqual([card.template, card.author, card.handle], ["tweet", "Ann", ""]);
});

test("only a post link gives an account", () => {
  assert.deepEqual(linkSource("https://x.com/ann/status/1"), { handle: "ann", template: "tweet" });
  assert.deepEqual(linkSource("https://www.threads.com/@ann.b/post/1"), { handle: "ann.b", template: "thread" });
  for (const other of ["https://x.com/i/status/1", "https://x.com/home", "https://notx.com/ann/1", "https://example.com/ann/1", "", undefined]) {
    assert.deepEqual(linkSource(other), { handle: "", template: null });
  }
});

test("lyrics and threads lose no words, also when the text is only punctuation", () => {
  assert.deepEqual(lyricLines("先睡，再想。"), ["先睡", "再想"]);
  assert.deepEqual(lyricLines("！？"), ["！？"]);
  assert.deepEqual(threadParts("a\n\n b\n \n\nc"), ["a", " b", "c"]);
  assert.deepEqual(threadParts("a\nb"), ["a\nb"]);
});

test("longer text is never larger", () => {
  for (const key of ["tweet", "thread", "memo", "book", "lyric", "plain"]) {
    const sizes = [1, 13, 30, 50, 95, 130, 5000].map((n) => fontSize(key, "字".repeat(n)));
    assert.deepEqual(sizes, [...sizes].sort((a, b) => b - a));
  }
});
