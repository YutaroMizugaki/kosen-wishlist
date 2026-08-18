import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidIsbn, normalizeIsbn, toIsbn13 } from "../lib/isbn";

test("normalizeIsbn strips separators and uppercases X", () => {
  assert.equal(normalizeIsbn("4-87311-565-8"), "4873115658");
  assert.equal(normalizeIsbn("978 4 8731 1565 8"), "9784873115658");
  assert.equal(normalizeIsbn("080442957x"), "080442957X");
  assert.equal(normalizeIsbn(null), "");
});

test("isValidIsbn accepts valid ISBN-10 and ISBN-13", () => {
  assert.equal(isValidIsbn("4873115655"), true); // valid ISBN-10
  assert.equal(isValidIsbn("9784873115658"), true); // valid ISBN-13
  assert.equal(isValidIsbn("080442957X"), true); // X check digit
});

test("isValidIsbn rejects malformed or bad-checksum values", () => {
  assert.equal(isValidIsbn("9784873115659"), false); // bad ISBN-13 checksum
  assert.equal(isValidIsbn("1234567890"), false); // bad ISBN-10 checksum
  assert.equal(isValidIsbn("123"), false); // wrong length
  assert.equal(isValidIsbn(""), false);
});

test("toIsbn13 converts ISBN-10 to ISBN-13 and passes through ISBN-13", () => {
  assert.equal(toIsbn13("4873115655"), "9784873115658");
  assert.equal(toIsbn13("9784873115658"), "9784873115658");
  assert.equal(toIsbn13("invalid"), null);
});
