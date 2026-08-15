# AGENTS.md

## Cursor Cloud specific instructions

KOSEN BOOKS is a single Next.js 16 (App Router) + React 19 + TypeScript + Tailwind
app (package `kosen-books-mvp`). There is only one service. Standard commands live in
`package.json`; the notes below are the non-obvious bits.

### Running

- Dev server: `npm run dev` (Next.js on `http://localhost:3000`).
- Lint: `npm run lint`. Build: `npm run build`.
- The app runs in **demo mode** whenever `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset (see `lib/supabase.ts` `isDemoMode()`).
  In demo mode data is kept in an in-memory store (`lib/demo-store.ts`) that
  **resets on every server restart**, so no Supabase project or env vars are needed
  to run/develop the app. The demo admin key is `demo-admin`.
- To exercise real persistence, copy `.env.example` to `.env.local` and fill in the
  Supabase values plus `ADMIN_ACCESS_KEY`, then run `supabase/schema.sql` in the
  Supabase SQL editor. Restart the dev server after changing env vars.

### Testing gotchas

- `npm test` is currently **broken in the repo**: the script runs
  `next build && node --test tests/rendered-html.test.mjs`, but the `tests/`
  directory does not exist, so the test step fails with a missing-file error. This
  is a pre-existing repository issue, not an environment problem. Use `npm run build`
  and `npm run lint` for verification until the test file is added.
- `POST /api/requests` expects **snake_case** field names
  (`title`, `author`, `book_url`, `price`, `reason`, `department`, `grade`,
  `category`, `contact_email`). `reason` must be 40–300 characters and `book_url`
  must start with `http(s)://`, otherwise the API returns a 400.
- Admin API: `GET`/`PATCH /api/admin` require the admin key via the `x-admin-key`
  header (`demo-admin` in demo mode).

### Optional

- `npm run sites:dev` / `npm run sites:build` run the Cloudflare-compatible `vinext`
  preview (Wrangler). Not required for normal development; the standard Next.js
  commands above are sufficient.
