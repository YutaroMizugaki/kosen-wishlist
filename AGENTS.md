# AGENTS.md

## Cursor Cloud specific instructions

KOSEN BOOKS is a single Next.js 16 (App Router) + React 19 + TypeScript + Tailwind
app (package `kosen-books-mvp`). There is only one service. Standard commands and the
Supabase/admin setup live in `README.md` and `package.json`; the notes below are the
non-obvious bits.

### Running

- Dev server: `npm run dev` (Next.js on `http://localhost:3000`).
- Lint: `npm run lint`. Build: `npm run build`.
- There is **no test script** in `package.json`; verify changes with `npm run lint`
  and `npm run build`.
- The app runs in **demo mode** whenever `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset (see `lib/supabase.ts` `isDemoMode()`).
  In demo mode, data is kept in an in-memory store (`lib/demo-store.ts`) that
  **resets on every server restart**, so no Supabase project or env vars are needed
  to run/develop the public list and the submission flow.

### Important gotcha: admin is not available in demo mode

- The admin screen (`/admin`) and `GET`/`PATCH /api/admin` require **Supabase Auth**:
  a `Bearer <access_token>` for a user that is also listed in the `admin_users` table
  (see `lib/admin-auth.ts`). There is no static admin key/`x-admin-key` anymore, so the
  admin flow **cannot be exercised in demo mode** — it needs a configured Supabase
  project. To test admin end-to-end, follow the Supabase + first-admin setup in
  `README.md` (copy `.env.example` to `.env.local`, run `supabase/schema.sql`, and
  register an admin via `admin_users`). Restart the dev server after changing env vars.

### `POST /api/requests` contract (non-obvious validation)

Fields are **snake_case**: `title`, `author`, `isbn`, `book_url`, `price`,
`department`, `grade`, `category`, `contact_email`. Enforced in
`app/api/requests/route.ts`:

- `isbn` is **required and validated** (ISBN-10/13, normalized to ISBN-13).
- `book_url` must start with `http(s)://`; `price` must be an integer 1–50000.
- `department`, `grade`, `category` must exactly match the fixed lists defined at the
  top of the route file.
- Rate limit: 3 submissions per email per 24h (override with `MAX_SUBMISSIONS_PER_DAY`);
  duplicate non-rejected ISBNs are rejected.
- `GET /api/books/lookup?isbn=...` looks up bibliographic info from openBD to
  pre-fill the form.
