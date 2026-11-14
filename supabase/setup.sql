-- ============================================================
--  Clean Gudlavalleru - Supabase setup
--  Run this ONCE in Supabase: SQL Editor -> New query -> paste -> Run
-- ============================================================

-- Staff and worker accounts
create table if not exists gw_users (
  id   text primary key,
  data jsonb not null
);
create unique index if not exists gw_users_username on gw_users ((data->>'username'));

-- Citizen reports (the whole report, with its timeline, is kept in "data")
create table if not exists gw_reports (
  id         text primary key,
  data       jsonb not null,
  created_at timestamptz not null default now()
);

-- Login sessions
create table if not exists gw_sessions (
  token   text primary key,
  user_id text not null,
  at      timestamptz not null default now()
);
create index if not exists gw_sessions_user on gw_sessions (user_id);

-- Small settings, e.g. the list of blocked devices
create table if not exists gw_meta (
  key   text primary key,
  value jsonb not null
);

-- Tracking numbers GW-2026-00001, 00002, ... (safe even when two people report at once)
create sequence if not exists gw_report_seq;
create or replace function gw_next_report_no() returns bigint
  language sql security definer set search_path = public
  as $$ select nextval('gw_report_seq') $$;

-- Lock the tables: only the website's server (service role key) may read or write.
-- Browsers using the public "anon" key get nothing.
alter table gw_users    enable row level security;
alter table gw_reports  enable row level security;
alter table gw_sessions enable row level security;
alter table gw_meta     enable row level security;
revoke execute on function gw_next_report_no() from public, anon, authenticated;
grant  execute on function gw_next_report_no() to service_role;

-- Photo storage: a public bucket so photos can be shown on the pages
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 6291456, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;
