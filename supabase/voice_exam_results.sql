-- Optional SQL scaffold for later persistence of voice exam evaluations.
-- Run manually in Supabase SQL Editor when you want to store results.

create table if not exists public.voice_exam_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id text not null default '',
  diagnosis_text text not null,
  history_json jsonb not null default '[]'::jsonb,
  evaluation_json jsonb not null default '{}'::jsonb,
  overall_score integer not null default 0,
  anamnesis_score integer not null default 0,
  diagnosis_score integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists voice_exam_results_user_created_idx
  on public.voice_exam_results(user_id, created_at desc);

alter table public.voice_exam_results enable row level security;

drop policy if exists "voice_exam_results_select_own" on public.voice_exam_results;
create policy "voice_exam_results_select_own"
on public.voice_exam_results
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "voice_exam_results_insert_own" on public.voice_exam_results;
create policy "voice_exam_results_insert_own"
on public.voice_exam_results
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "voice_exam_results_update_own" on public.voice_exam_results;
create policy "voice_exam_results_update_own"
on public.voice_exam_results
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

