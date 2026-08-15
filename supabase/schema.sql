create extension if not exists pgcrypto;

do $$ begin
  create type public.request_status as enum ('pending', 'approved', 'rejected', 'fulfilled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.book_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  author text not null check (char_length(author) between 1 and 100),
  isbn text, -- ISBN-13 digits only; the API normalizes ISBN-10 on save
  book_url text not null check (book_url ~ '^https?://'),
  price integer not null check (price between 1 and 50000),
  reason text not null check (char_length(reason) between 40 and 300),
  department text not null,
  grade text not null,
  category text not null,
  contact_email text not null,
  status public.request_status not null default 'approved',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing installations also switch new submissions to immediate publication.
alter table public.book_requests alter column status set default 'approved';

create index if not exists book_requests_status_created_at_idx
  on public.book_requests (status, created_at desc);

alter table public.book_requests enable row level security;

drop policy if exists "Public can read approved requests" on public.book_requests;
create policy "Public can read approved requests"
  on public.book_requests for select
  to anon, authenticated
  using (status in ('approved', 'fulfilled'));

-- Anon/authenticated keys must not read contact_email or admin_note.
-- The service-role key still has full access for the admin API.
revoke all on public.book_requests from anon, authenticated;
grant select (
  id, title, author, isbn, book_url, price, reason,
  department, grade, category, status, created_at, updated_at
) on public.book_requests to anon, authenticated;

-- New applications and all administration go through the server-side API.
-- The service-role key bypasses RLS and must never be exposed to the browser.

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_book_requests_updated_at on public.book_requests;
create trigger set_book_requests_updated_at
before update on public.book_requests
for each row execute function public.set_updated_at();
