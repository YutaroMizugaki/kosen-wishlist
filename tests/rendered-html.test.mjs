import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

test("public pages stay lightweight", () => {
  const layout = read("app/layout.tsx");
  const css = read("app/globals.css");
  const card = read("app/components/book-card.tsx");
  const header = read("app/components/site-header.tsx");

  assert.doesNotMatch(layout, /next\/font/);
  assert.doesNotMatch(layout, /fonts\.googleapis/);
  assert.doesNotMatch(css, /@font-face/);
  assert.doesNotMatch(css, /fonts\.googleapis/);
  assert.doesNotMatch(card, /<img\b/);
  assert.match(header, /no-html-link-for-pages/);
});

test("public request loading omits personal fields", () => {
  const source = read("lib/requests.ts");
  const types = read("lib/types.ts");
  assert.doesNotMatch(source, /contact_email/);
  assert.doesNotMatch(source, /admin_note/);
  assert.match(types, /publicRequestColumns/);
});
