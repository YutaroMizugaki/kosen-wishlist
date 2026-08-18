import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  getAllowedEmailDomains,
  getInitialStatus,
  isEmailDomainAllowed,
  isReviewMode,
} from "../lib/submission";

afterEach(() => {
  delete process.env.ALLOWED_EMAIL_DOMAINS;
  delete process.env.SUBMISSION_MODE;
});

test("getAllowedEmailDomains parses comma-separated list", () => {
  process.env.ALLOWED_EMAIL_DOMAINS = "kosen-ac.jp, *.kosen-ac.jp ,";
  assert.deepEqual(getAllowedEmailDomains(), ["kosen-ac.jp", "*.kosen-ac.jp"]);
});

test("isEmailDomainAllowed allows any email when no allowlist is set", () => {
  assert.equal(isEmailDomainAllowed("anyone@example.com"), true);
});

test("isEmailDomainAllowed enforces exact and wildcard domains", () => {
  process.env.ALLOWED_EMAIL_DOMAINS = "kosen-ac.jp,*.kosen-ac.jp";
  assert.equal(isEmailDomainAllowed("student@kosen-ac.jp"), true);
  assert.equal(isEmailDomainAllowed("student@sub.kosen-ac.jp"), true);
  assert.equal(isEmailDomainAllowed("student@example.com"), false);
  assert.equal(isEmailDomainAllowed("student@evilkosen-ac.jp"), false);
});

test("getInitialStatus and isReviewMode follow SUBMISSION_MODE", () => {
  assert.equal(getInitialStatus(), "approved");
  assert.equal(isReviewMode(), false);
  process.env.SUBMISSION_MODE = "review";
  assert.equal(getInitialStatus(), "pending");
  assert.equal(isReviewMode(), true);
});
