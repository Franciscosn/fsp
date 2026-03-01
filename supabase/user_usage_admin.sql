-- User usage tracking + admin dashboard support
-- Run this once in Supabase SQL Editor.

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text default '',
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

drop policy if exists "app_admins_select_own" on public.app_admins;
create policy "app_admins_select_own"
on public.app_admins
for select
to authenticated
using (auth.uid() = user_id);

create table if not exists public.user_daily_metrics (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  user_email text default '',
  active_seconds integer not null default 0,
  attempts integer not null default 0,
  correct integer not null default 0,
  wrong integer not null default 0,
  xp_total integer not null default 0,
  level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index if not exists user_daily_metrics_day_idx
  on public.user_daily_metrics(day desc);

create index if not exists user_daily_metrics_user_day_idx
  on public.user_daily_metrics(user_id, day desc);

alter table public.user_daily_metrics enable row level security;

drop policy if exists "user_daily_metrics_select_own_or_admin" on public.user_daily_metrics;
create policy "user_daily_metrics_select_own_or_admin"
on public.user_daily_metrics
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.app_admins as admins
    where admins.user_id = auth.uid()
  )
);

drop policy if exists "user_daily_metrics_insert_own" on public.user_daily_metrics;
create policy "user_daily_metrics_insert_own"
on public.user_daily_metrics
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_daily_metrics_update_own" on public.user_daily_metrics;
create policy "user_daily_metrics_update_own"
on public.user_daily_metrics
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Optional fallback for admin dashboard from existing progress table.
-- This enables admin read access to all app-state rows.
drop policy if exists "progress_select_admin" on public.progress;
create policy "progress_select_admin"
on public.progress
for select
to authenticated
using (
  exists (
    select 1
    from public.app_admins as admins
    where admins.user_id = auth.uid()
  )
);

-- Helper: make yourself admin (replace with your auth.users.id)
-- insert into public.app_admins (user_id, note) values ('YOUR-USER-UUID', 'owner');
