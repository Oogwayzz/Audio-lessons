-- Audio Lessons Library schema (Supabase)

create extension if not exists pgcrypto;

-- 1) Lessons
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  module_slug text not null,
  week int not null check (week >= 1),
  title text not null,
  tags text[] not null default '{}'::text[],
  audio_path text not null,
  duration_seconds int,
  created_at timestamptz not null default now()
);

create index if not exists lessons_module_slug_idx on public.lessons (module_slug);
create index if not exists lessons_module_week_idx on public.lessons (module_slug, week);
create index if not exists lessons_tags_gin on public.lessons using gin (tags);

-- 2) User progress
create table if not exists public.user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  position_seconds int not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists user_progress_updated_at_idx on public.user_progress (updated_at desc);

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_user_progress_updated_at'
  ) then
    create trigger trg_user_progress_updated_at
    before update on public.user_progress
    for each row execute function public.set_updated_at();
  end if;
end
$$;

-- Row Level Security (RLS)
alter table public.lessons enable row level security;
alter table public.user_progress enable row level security;

-- Lessons: for an MVP, allow any authenticated user to read/write.
-- If you want only you to upload, we can lock this down later.
drop policy if exists lessons_select_authed on public.lessons;
create policy lessons_select_authed on public.lessons
for select to authenticated
using (true);

drop policy if exists lessons_write_authed on public.lessons;
create policy lessons_write_authed on public.lessons
for all to authenticated
using (true)
with check (true);

-- Progress: only the owner can read/write their rows.
drop policy if exists progress_select_own on public.user_progress;
create policy progress_select_own on public.user_progress
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists progress_insert_own on public.user_progress;
create policy progress_insert_own on public.user_progress
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists progress_update_own on public.user_progress;
create policy progress_update_own on public.user_progress
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists progress_delete_own on public.user_progress;
create policy progress_delete_own on public.user_progress
for delete to authenticated
using (auth.uid() = user_id);

-- 3) Storage policies
-- Create a private bucket called: audio
-- These policies allow any authenticated user to upload/read.
-- Tighten later if needed.

drop policy if exists audio_read_authed on storage.objects;
create policy audio_read_authed on storage.objects
for select to authenticated
using (bucket_id = 'audio');

drop policy if exists audio_insert_authed on storage.objects;
create policy audio_insert_authed on storage.objects
for insert to authenticated
with check (bucket_id = 'audio');

drop policy if exists audio_update_authed on storage.objects;
create policy audio_update_authed on storage.objects
for update to authenticated
using (bucket_id = 'audio')
with check (bucket_id = 'audio');

drop policy if exists audio_delete_authed on storage.objects;
create policy audio_delete_authed on storage.objects
for delete to authenticated
using (bucket_id = 'audio');
