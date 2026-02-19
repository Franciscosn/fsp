-- Prompt feedback + global prompt profiles (Testphase)
-- Run manually in Supabase SQL Editor.
--
-- Hinweis: In dieser Testphase duerfen ALLE authenticated User globale Prompt-Profile
-- schreiben (direkte Uebernahme). Fuer Produktion diese Policies unbedingt einschraenken.

create extension if not exists pgcrypto;

create table if not exists public.prompt_feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  proposal_name text not null,
  proposal_note text not null default '',
  target_prompt_key text not null,
  prompt_text text not null,
  prompt_payload_json jsonb not null default '{}'::jsonb,
  direct_adopt_requested boolean not null default false,
  direct_adopt_applied boolean not null default false,
  adoption_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prompt_feedback_submissions_user_created_idx
  on public.prompt_feedback_submissions(user_id, created_at desc);

create table if not exists public.prompt_profiles (
  prompt_key text primary key,
  prompt_text text not null,
  version integer not null default 1,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  source_submission_id uuid references public.prompt_feedback_submissions(id) on delete set null
);

alter table public.prompt_feedback_submissions enable row level security;
alter table public.prompt_profiles enable row level security;

drop policy if exists "prompt_feedback_select_own" on public.prompt_feedback_submissions;
drop policy if exists "prompt_feedback_select_all_authenticated" on public.prompt_feedback_submissions;
create policy "prompt_feedback_select_all_authenticated"
on public.prompt_feedback_submissions
for select
to authenticated
using (true);

drop policy if exists "prompt_feedback_insert_own" on public.prompt_feedback_submissions;
create policy "prompt_feedback_insert_own"
on public.prompt_feedback_submissions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "prompt_feedback_update_own" on public.prompt_feedback_submissions;
create policy "prompt_feedback_update_own"
on public.prompt_feedback_submissions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "prompt_profiles_select_all_authenticated" on public.prompt_profiles;
create policy "prompt_profiles_select_all_authenticated"
on public.prompt_profiles
for select
to authenticated
using (true);

drop policy if exists "prompt_profiles_insert_testphase" on public.prompt_profiles;
create policy "prompt_profiles_insert_testphase"
on public.prompt_profiles
for insert
to authenticated
with check (true);

drop policy if exists "prompt_profiles_update_testphase" on public.prompt_profiles;
create policy "prompt_profiles_update_testphase"
on public.prompt_profiles
for update
to authenticated
using (true)
with check (true);
