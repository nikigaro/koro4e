-- Выполни этот SQL в Supabase: SQL Editor -> New query -> Run.
-- После этого приложение сможет читать и писать состояние в таблицу koroche_state.

create table if not exists public.koroche_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.koroche_state enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.koroche_state to anon, authenticated;

drop policy if exists "koroche_read" on public.koroche_state;
drop policy if exists "koroche_insert" on public.koroche_state;
drop policy if exists "koroche_update" on public.koroche_state;

create policy "koroche_read" on public.koroche_state
  for select to anon, authenticated using (true);

create policy "koroche_insert" on public.koroche_state
  for insert to anon, authenticated with check (true);

create policy "koroche_update" on public.koroche_state
  for update to anon, authenticated using (true) with check (true);
