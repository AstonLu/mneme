import assert from "node:assert/strict";
import test from "node:test";
import { signInErrorText } from "../src/domain/signInError.js";

test("each sign-in failure has its own text", () => {
  const texts = [401, 503, 500].map((status) => signInErrorText({ status }));
  assert.equal(new Set(texts).size, 3);
});
