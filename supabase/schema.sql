-- SpecForge database schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).

create table if not exists feedback_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  raw_items text[] not null,
  created_at timestamptz not null default now()
);

create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references feedback_batches(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  theme_id text not null,
  title text not null,
  summary text not null,
  priority text not null check (priority in ('high', 'medium', 'low')),
  confidence_score numeric not null check (confidence_score >= 0 and confidence_score <= 1),
  feedback_count integer not null,
  sample_quotes text[] not null,
  created_at timestamptz not null default now()
);

create table if not exists specifications (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references analyses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  problem_statement text not null,
  description text not null,
  acceptance_criteria text[] not null,
  technical_tasks text[] not null,
  edge_cases text[] not null,
  implementation_notes text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: each PM can only see their own workspace data.
-- These are ready to enable once Supabase Auth is wired into the app
-- (see SETUP.md, step 4). Until then, API routes use the service role
-- key server-side, which bypasses RLS entirely.

alter table feedback_batches enable row level security;
alter table analyses enable row level security;
alter table specifications enable row level security;

create policy "Users manage their own feedback batches"
  on feedback_batches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own analyses"
  on analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own specifications"
  on specifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
