import type { RequestStatus } from "./types";

// Optional allowlist of accepted email domains, e.g. "kosen-ac.jp,*.kosen-ac.jp".
// When unset, any syntactically valid email is accepted (unchanged behaviour).
export function getAllowedEmailDomains(): string[] {
  return (process.env.ALLOWED_EMAIL_DOMAINS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailDomainAllowed(email: string): boolean {
  const allowed = getAllowedEmailDomains();
  if (allowed.length === 0) return true;

  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  if (!domain) return false;

  return allowed.some((pattern) => {
    if (pattern.startsWith("*.")) {
      const suffix = pattern.slice(1); // ".kosen-ac.jp"
      return domain === pattern.slice(2) || domain.endsWith(suffix);
    }
    return domain === pattern;
  });
}

// Whether new submissions are published immediately ("auto", default) or held for
// admin review ("review"). Review mode reuses the existing "pending" status, which
// is filtered out of the public list.
export function getInitialStatus(): RequestStatus {
  return process.env.SUBMISSION_MODE === "review" ? "pending" : "approved";
}

export function isReviewMode(): boolean {
  return process.env.SUBMISSION_MODE === "review";
}
