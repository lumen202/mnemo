-- StudyMind Supabase Schema
-- Run this in the Supabase SQL editor to set up your database.

create extension if not exists "uuid-ossp";

-- ─── Subjects ─────────────────────────────────────────────────────────────────
create table if not exists public.subjects (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  name             text not null,
  slug             text not null,
  description      text,
  color            text,
  icon             text,
  target_hours     numeric(6, 2) not null default 10,
  completed_hours  numeric(6, 2) not null default 0,
  material_count   int not null default 0,
  period           text not null default 'monthly' check (period in ('weekly', 'monthly')),
  ai_recommended   boolean default false,
  created_at       timestamptz default now()
);

alter table public.subjects enable row level security;

create policy "Users can manage own subjects"
  on public.subjects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Study Materials ──────────────────────────────────────────────────────────
create table if not exists public.study_materials (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  title        text not null,
  subject      text not null,
  type         text not null check (type in ('pdf', 'note', 'video', 'link', 'textbook')),
  status       text not null default 'pending' check (status in ('pending', 'summarized', 'reviewed', 'mastered')),
  upload_date  date not null default current_date,
  description  text,
  summary      text,
  tags         text[],
  pages        int,
  word_count   int,
  source       text,
  created_at   timestamptz default now()
);

alter table public.study_materials enable row level security;

create policy "Users can manage own materials"
  on public.study_materials for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Flashcards ───────────────────────────────────────────────────────────────
create table if not exists public.flashcards (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  material_id     uuid references public.study_materials(id) on delete set null,
  subject_id      text not null,
  front           text not null,
  back            text not null,
  difficulty      text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  times_reviewed  int not null default 0,
  last_reviewed   date,
  next_review     date,
  created_at      timestamptz default now()
);

alter table public.flashcards enable row level security;

create policy "Users can manage own flashcards"
  on public.flashcards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Quizzes ──────────────────────────────────────────────────────────────────
create table if not exists public.quizzes (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  subject_id       text not null,
  material_id      uuid references public.study_materials(id) on delete set null,
  title            text not null,
  questions        jsonb not null default '[]',
  score            int,
  total_questions  int not null,
  completed_at     timestamptz,
  created_at       timestamptz default now()
);

alter table public.quizzes enable row level security;

create policy "Users can manage own quizzes"
  on public.quizzes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Study Sessions ───────────────────────────────────────────────────────────
create table if not exists public.study_sessions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references auth.users(id) on delete cascade not null,
  subject_id          text not null,
  date                date not null default current_date,
  duration_minutes    int not null check (duration_minutes > 0),
  notes               text,
  materials_reviewed  text[],
  created_at          timestamptz default now()
);

alter table public.study_sessions enable row level security;

create policy "Users can manage own sessions"
  on public.study_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Study Goals ──────────────────────────────────────────────────────────────
create table if not exists public.study_goals (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  title        text not null,
  description  text,
  target_date  date not null,
  completed    boolean not null default false,
  subject_id   text,
  progress     int not null default 0 check (progress between 0 and 100),
  created_at   timestamptz default now()
);

alter table public.study_goals enable row level security;

create policy "Users can manage own goals"
  on public.study_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── AI Insights ──────────────────────────────────────────────────────────────
create table if not exists public.ai_insights (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text not null check (type in ('warning', 'tip', 'achievement', 'prediction')),
  title       text not null,
  description text not null,
  subject     text,
  actionable  text,
  priority    text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at  timestamptz default now()
);

alter table public.ai_insights enable row level security;

create policy "Users can view own insights"
  on public.ai_insights for select
  using (auth.uid() = user_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_materials_user_subject
  on public.study_materials(user_id, subject);

create index if not exists idx_flashcards_user_next_review
  on public.flashcards(user_id, next_review);

create index if not exists idx_sessions_user_date
  on public.study_sessions(user_id, date desc);

create index if not exists idx_quizzes_user
  on public.quizzes(user_id);
