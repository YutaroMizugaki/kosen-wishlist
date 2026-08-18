import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { assertRuntimeConfig, isProductionMode } from "../lib/env";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

afterEach(() => {
  delete process.env.APP_MODE;
  delete process.env.VERCEL_ENV;
  restore("NEXT_PUBLIC_SUPABASE_URL", originalUrl);
  restore("NEXT_PUBLIC_SUPABASE_ANON_KEY", originalKey);
});

function restore(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

test("isProductionMode reflects APP_MODE and VERCEL_ENV", () => {
  assert.equal(isProductionMode(), false);
  process.env.APP_MODE = "production";
  assert.equal(isProductionMode(), true);
});

test("assertRuntimeConfig throws in production when Supabase env is missing", () => {
  process.env.APP_MODE = "production";
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.throws(() => assertRuntimeConfig(), /Supabase/);
});

test("assertRuntimeConfig passes in production when Supabase env is set", () => {
  process.env.APP_MODE = "production";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  assert.doesNotThrow(() => assertRuntimeConfig());
});

test("assertRuntimeConfig passes in demo/dev mode", () => {
  delete process.env.APP_MODE;
  delete process.env.VERCEL_ENV;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.doesNotThrow(() => assertRuntimeConfig());
});
