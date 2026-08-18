import { isDemoMode } from "./supabase";

// A deployment is considered "production" when it explicitly opts in via APP_MODE
// or when running on Vercel's production environment. Anything else (local dev,
// preview) keeps the lenient, demo-friendly behaviour.
export function isProductionMode() {
  return process.env.APP_MODE === "production" || process.env.VERCEL_ENV === "production";
}

// Guards against the most dangerous silent failure mode: shipping to production
// with missing/typo'd Supabase env vars, which would fall back to the in-memory
// demo store. Submissions would appear to succeed but be lost on every restart.
// We fail fast at startup instead so the misconfiguration is caught immediately.
export function assertRuntimeConfig() {
  if (isProductionMode() && isDemoMode()) {
    throw new Error(
      "本番モード(APP_MODE=production または VERCEL_ENV=production)で起動しましたが、" +
        "Supabaseの環境変数が設定されていません。デモモード(メモリ保存・再起動でデータ消失)での" +
        "本番稼働を防ぐため起動を中止します。NEXT_PUBLIC_SUPABASE_URL / " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY を設定してください。",
    );
  }
}
