-- SpecForge database schema (Public / Guest mode compatible)
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).

create table if not exists feedback_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  raw_items text[] not null,
  created_at timestamptz not null default now()
);

create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references feedback_batches(id) on delete cascade,
  user_id uuid,
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
  user_id uuid,
  title text not null,
  problem_statement text not null,
  description text not null,
  acceptance_criteria text[] not null,
  technical_tasks text[] not null,
  edge_cases text[] not null,
  implementation_notes text not null,
  created_at timestamptz not null default now()
);

-- Public policies (allows anonymous access when auth is disabled)
alter table feedback_batches disable row level security;
alter table analyses disable row level security;
alter table specifications disable row level security;
