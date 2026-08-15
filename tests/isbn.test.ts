import assert from "node:assert/strict";
import test from "node:test";
import { InvalidIsbnError, toIsbn13 } from "../lib/isbn.ts";

test("empty ISBN becomes null", () => {
  assert.equal(toIsbn13(""), null);
  assert.equal(toIsbn13("   "), null);
  assert.equal(toIsbn13(null), null);
  assert.equal(toIsbn13(undefined), null);
});

test("ISBN-13 is stored as 13 digits", () => {
  assert.equal(toIsbn13("978-0-306-40615-7"), "9780306406157");
  assert.equal(toIsbn13("9780306406157"), "9780306406157");
  assert.equal(toIsbn13("979-8-6013-4028-1"), "9798601340281");
});

test("ISBN-10 is converted to ISBN-13", () => {
  assert.equal(toIsbn13("0-306-40615-2"), "9780306406157");
  assert.equal(toIsbn13("0306406152"), "9780306406157");
  assert.equal(toIsbn13("4-06-519511-X"), "9784065195116");
});

test("invalid ISBN is rejected", () => {
  assert.throws(() => toIsbn13("9780306406158"), InvalidIsbnError);
  assert.throws(() => toIsbn13("0306406153"), InvalidIsbnError);
  assert.throws(() => toIsbn13("12345"), InvalidIsbnError);
  assert.throws(() => toIsbn13("9800306406157"), InvalidIsbnError);
});
