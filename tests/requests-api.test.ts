import assert from "node:assert/strict";
import { beforeEach, afterEach, test } from "node:test";
import { POST } from "../app/api/requests/route";
import { getDemoRequests } from "../lib/demo-store";

type DemoGlobal = typeof globalThis & { __kosenBooksDemoRequests?: unknown };

// The submission route falls back to the in-memory demo store when Supabase env
// vars are absent, so these tests exercise the real validation + storage logic.
beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.ALLOWED_EMAIL_DOMAINS;
  delete process.env.SUBMISSION_MODE;
  delete (globalThis as DemoGlobal).__kosenBooksDemoRequests;
});

afterEach(() => {
  delete (globalThis as DemoGlobal).__kosenBooksDemoRequests;
});

function submit(body: Record<string, unknown>) {
  return POST(new Request("http://localhost/api/requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
}

const validBody = {
  isbn: "9784873115658",
  title: "リーダブルコード",
  author: "Dustin Boswell",
  book_url: "https://example.com/book",
  price: 2640,
  department: "情報工学科",
  grade: "3年",
  category: "プログラミング",
  contact_email: "student@example.com",
};

test("accepts a valid submission and stores it as approved", async () => {
  const response = await submit(validBody);
  assert.equal(response.status, 201);
  const stored = getDemoRequests();
  assert.equal(stored.some((item) => item.title === "リーダブルコード" && item.status === "approved"), true);
});

test("rejects a missing/invalid ISBN", async () => {
  const response = await submit({ ...validBody, isbn: "123" });
  assert.equal(response.status, 400);
});

test("rejects an out-of-range price", async () => {
  const response = await submit({ ...validBody, price: 0 });
  assert.equal(response.status, 400);
});

test("rejects a value outside the allowed option lists", async () => {
  const response = await submit({ ...validBody, department: "存在しない学科" });
  assert.equal(response.status, 400);
});

test("rejects an email outside the configured allowlist", async () => {
  process.env.ALLOWED_EMAIL_DOMAINS = "kosen-ac.jp";
  const response = await submit(validBody);
  assert.equal(response.status, 403);
});

test("holds submissions as pending in review mode", async () => {
  process.env.SUBMISSION_MODE = "review";
  const response = await submit(validBody);
  assert.equal(response.status, 201);
  const stored = getDemoRequests();
  assert.equal(stored.some((item) => item.title === "リーダブルコード" && item.status === "pending"), true);
});
