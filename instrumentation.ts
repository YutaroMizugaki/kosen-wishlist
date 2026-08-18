// Runs once when the server process starts. We use it to fail fast if a
// production deployment is accidentally missing its Supabase configuration.
export async function register() {
  const { assertRuntimeConfig } = await import("./lib/env");
  assertRuntimeConfig();
}
