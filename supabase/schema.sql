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
  isbn text not null check (isbn ~ '^[0-9]{13}$'),
  book_url text not null check (book_url ~ '^https?://'),
  price integer not null check (price between 1 and 50000),
  department text not null,
  grade text not null,
  category text not null,
  contact_email text not null,
  status public.request_status not null default 'approved',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.book_requests
  add column if not exists isbn_normalized text
  generated always as (upper(regexp_replace(coalesce(isbn, ''), '[^0-9Xx]', '', 'g'))) stored;

-- Existing installations also switch new submissions to immediate publication.
alter table public.book_requests alter column status set default 'approved';

-- Existing installations stop collecting the applicant's reason as well.
alter table public.book_requests drop column if exists reason;

create index if not exists book_requests_status_created_at_idx
  on public.book_requests (status, created_at desc);

create index if not exists book_requests_email_created_at_idx
  on public.book_requests (contact_email, created_at desc);

drop index if exists public.book_requests_isbn_unique_idx;
create unique index book_requests_isbn_unique_idx
  on public.book_requests (isbn_normalized)
  where isbn_normalized <> '' and status <> 'rejected';

drop index if exists public.book_requests_title_author_unique_idx;
alter table public.book_requests drop column if exists title_normalized;
alter table public.book_requests drop column if exists author_normalized;

alter table public.book_requests drop constraint if exists book_requests_isbn_check;
alter table public.book_requests alter column isbn set not null;
alter table public.book_requests
  add constraint book_requests_isbn_check check (isbn ~ '^[0-9]{13}$');

alter table public.book_requests enable row level security;

drop policy if exists "Public can read approved requests" on public.book_requests;
create policy "Public can read approved requests"
  on public.book_requests for select
  to anon, authenticated
  using (status in ('approved', 'fulfilled'));

-- RLS filters rows, while column privileges prevent direct API access to private fields.
revoke all on public.book_requests from anon, authenticated;
grant select (
  id, title, author, isbn, book_url, price,
  department, grade, category, status, created_at
) on public.book_requests to anon, authenticated;

-- Server-side API access. The secret key maps to service_role and bypasses RLS,
-- but still needs explicit table privileges when automatic grants are disabled.
grant select, insert, update on public.book_requests to service_role;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to service_role;

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
