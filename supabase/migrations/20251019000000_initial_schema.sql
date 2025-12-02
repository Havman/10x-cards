-- =====================================================================================
-- Migration: Initial Schema for AI Flashcard Generator
-- =====================================================================================
-- Description: Creates the complete database schema for the flashcard application
--              including tables, indexes, and Row Level Security policies.
--
-- Affected Tables:
--   - decks: Stores user flashcard decks
--   - flashcards: Individual flashcards with spaced repetition data
--   - ai_generation_logs: Tracks AI generation usage for daily limits
--   - study_sessions: Records study session details and metrics
--   - flashcard_performance: Historical grading data for FSRS algorithm
--
-- Special Considerations:
--   - Relies on Supabase Auth for user management (auth.users table)
--   - All tables have RLS enabled with policies for authenticated users
--   - Cascade deletions ensure referential integrity
--   - Indexes optimized for common query patterns
--   - FSRS algorithm fields included for spaced repetition
--
-- Author: Database Schema Plan v1.0
-- Date: 2025-10-19
-- =====================================================================================

-- =====================================================================================
-- 1. TABLES
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- 1.1. decks table
-- -------------------------------------------------------------------------------------
-- Stores flashcard decks owned by authenticated users.
-- Each user can have multiple decks with unique names.
create table if not exists public.decks (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(100) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- ensure each user has unique deck names
  constraint unique_user_deck_name unique(user_id, name)
);

-- add comment to table
comment on table public.decks is 'Stores flashcard decks owned by users';

-- add comments to columns
comment on column public.decks.id is 'Auto-incrementing deck identifier';
comment on column public.decks.user_id is 'Owner of the deck (references auth.users)';
comment on column public.decks.name is 'Deck name (must be unique per user)';
comment on column public.decks.created_at is 'Deck creation timestamp';
comment on column public.decks.updated_at is 'Last update timestamp';

-- -------------------------------------------------------------------------------------
-- 1.2. flashcards table
-- -------------------------------------------------------------------------------------
-- Stores individual flashcards with spaced repetition algorithm data.
-- Supports FSRS (Free Spaced Repetition Scheduler) algorithm parameters.
-- Status workflow: draft (AI-generated) → new (accepted) → finalized (studied)
create table if not exists public.flashcards (
  id bigserial primary key,
  deck_id bigint not null references public.decks(id) on delete cascade,
  front varchar(200) not null,
  back varchar(500) not null,
  status varchar(20) not null default 'new',
  source varchar(20) not null,
  ease_factor decimal(4,2) not null default 2.50,
  interval integer not null default 0,
  next_review_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- ensure valid status values
  constraint valid_status check (status in ('draft', 'new', 'finalized')),
  -- ensure valid source values
  constraint valid_source check (source in ('ai', 'manual'))
);

-- add comment to table
comment on table public.flashcards is 'Individual flashcards with spaced repetition data';

-- add comments to columns
comment on column public.flashcards.id is 'Auto-incrementing flashcard identifier';
comment on column public.flashcards.deck_id is 'Parent deck (references decks table)';
comment on column public.flashcards.front is 'Question/front side of card (max 200 chars)';
comment on column public.flashcards.back is 'Answer/back side of card (max 500 chars)';
comment on column public.flashcards.status is 'Card status: draft (AI-generated), new (accepted), finalized (studied)';
comment on column public.flashcards.source is 'Card origin: ai (generated) or manual (user-created)';
comment on column public.flashcards.ease_factor is 'FSRS ease factor (typically 1.3 - 4.0, default 2.50)';
comment on column public.flashcards.interval is 'Days until next review (default 0 for new cards)';
comment on column public.flashcards.next_review_date is 'Scheduled review date';
comment on column public.flashcards.created_at is 'Card creation timestamp';
comment on column public.flashcards.updated_at is 'Last update timestamp';

-- -------------------------------------------------------------------------------------
-- 1.3. ai_generation_logs table
-- -------------------------------------------------------------------------------------
-- Tracks AI flashcard generation requests to enforce daily limits.
-- Each request logs the timestamp and number of cards generated.
create table if not exists public.ai_generation_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  generated_at timestamptz not null default now(),
  cards_count integer not null default 0
);

-- add comment to table
comment on table public.ai_generation_logs is 'Tracks AI flashcard generation usage for daily limit enforcement';

-- add comments to columns
comment on column public.ai_generation_logs.id is 'Auto-incrementing log identifier';
comment on column public.ai_generation_logs.user_id is 'User who requested generation';
comment on column public.ai_generation_logs.generated_at is 'Timestamp of generation request';
comment on column public.ai_generation_logs.cards_count is 'Number of cards generated in this request';

-- -------------------------------------------------------------------------------------
-- 1.4. study_sessions table
-- -------------------------------------------------------------------------------------
-- Records study session details and performance metrics.
-- Sessions can be ongoing (ended_at is null) or completed.
create table if not exists public.study_sessions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id bigint not null references public.decks(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  cards_reviewed integer not null default 0,
  cards_correct integer not null default 0
);

-- add comment to table
comment on table public.study_sessions is 'Records study session details and performance metrics';

-- add comments to columns
comment on column public.study_sessions.id is 'Auto-incrementing session identifier';
comment on column public.study_sessions.user_id is 'User conducting the session';
comment on column public.study_sessions.deck_id is 'Deck being studied';
comment on column public.study_sessions.started_at is 'Session start time';
comment on column public.study_sessions.ended_at is 'Session end time (null if ongoing)';
comment on column public.study_sessions.cards_reviewed is 'Total cards reviewed in session';
comment on column public.study_sessions.cards_correct is 'Cards graded as "good" or "easy"';

-- -------------------------------------------------------------------------------------
-- 1.5. flashcard_performance table
-- -------------------------------------------------------------------------------------
-- Stores historical grading data for flashcards to support FSRS algorithm.
-- Intentionally denormalizes previous values for analytical purposes and algorithm tuning.
create table if not exists public.flashcard_performance (
  id bigserial primary key,
  flashcard_id bigint not null references public.flashcards(id) on delete cascade,
  study_session_id bigint not null references public.study_sessions(id) on delete cascade,
  grade varchar(10) not null,
  reviewed_at timestamptz not null default now(),
  previous_ease_factor decimal(4,2) not null,
  previous_interval integer not null,
  new_ease_factor decimal(4,2) not null,
  new_interval integer not null,
  -- ensure valid grade values
  constraint valid_grade check (grade in ('again', 'hard', 'good', 'easy'))
);

-- add comment to table
comment on table public.flashcard_performance is 'Historical grading data for flashcards (supports FSRS algorithm)';

-- add comments to columns
comment on column public.flashcard_performance.id is 'Auto-incrementing performance record identifier';
comment on column public.flashcard_performance.flashcard_id is 'Flashcard being reviewed';
comment on column public.flashcard_performance.study_session_id is 'Session in which card was reviewed';
comment on column public.flashcard_performance.grade is 'Self-assessment grade: again, hard, good, easy';
comment on column public.flashcard_performance.reviewed_at is 'Timestamp of review';
comment on column public.flashcard_performance.previous_ease_factor is 'Ease factor before this review (for analytics)';
comment on column public.flashcard_performance.previous_interval is 'Interval before this review (for analytics)';
comment on column public.flashcard_performance.new_ease_factor is 'Updated ease factor after review';
comment on column public.flashcard_performance.new_interval is 'Updated interval after review';

-- =====================================================================================
-- 2. INDEXES
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- 2.1. flashcards indexes
-- -------------------------------------------------------------------------------------
-- Critical index for study sessions: finds cards due for review
-- Filtered index only includes finalized cards to improve performance
create index if not exists idx_flashcards_next_review_date 
on public.flashcards(next_review_date) 
where status = 'finalized';

comment on index public.idx_flashcards_next_review_date is 
'Optimizes queries for cards due for review (filtered by finalized status)';

-- Index for filtering flashcards by status
create index if not exists idx_flashcards_status 
on public.flashcards(status);

comment on index public.idx_flashcards_status is 
'Optimizes status-based filtering queries';

-- Index for deck-based flashcard queries
create index if not exists idx_flashcards_deck_id 
on public.flashcards(deck_id);

comment on index public.idx_flashcards_deck_id is 
'Optimizes queries for flashcards within a specific deck';

-- -------------------------------------------------------------------------------------
-- 2.2. decks indexes
-- -------------------------------------------------------------------------------------
-- Index for user's decks lookup
create index if not exists idx_decks_user_id 
on public.decks(user_id);

comment on index public.idx_decks_user_id is 
'Optimizes queries for all decks owned by a user';

-- -------------------------------------------------------------------------------------
-- 2.3. ai_generation_logs indexes
-- -------------------------------------------------------------------------------------
-- Composite index for daily limit checks
create index if not exists idx_ai_generation_logs_user_date 
on public.ai_generation_logs(user_id, generated_at);

comment on index public.idx_ai_generation_logs_user_date is 
'Optimizes daily AI generation limit checks for users';

-- -------------------------------------------------------------------------------------
-- 2.4. study_sessions indexes
-- -------------------------------------------------------------------------------------
-- Index for study session history queries
create index if not exists idx_study_sessions_user_id 
on public.study_sessions(user_id);

comment on index public.idx_study_sessions_user_id is 
'Optimizes queries for user study session history';

-- Index for deck study session history
create index if not exists idx_study_sessions_deck_id 
on public.study_sessions(deck_id);

comment on index public.idx_study_sessions_deck_id is 
'Optimizes queries for deck-specific study session history';

-- -------------------------------------------------------------------------------------
-- 2.5. flashcard_performance indexes
-- -------------------------------------------------------------------------------------
-- Index for flashcard performance lookups
create index if not exists idx_flashcard_performance_flashcard_id 
on public.flashcard_performance(flashcard_id);

comment on index public.idx_flashcard_performance_flashcard_id is 
'Optimizes queries for performance history of a specific flashcard';

-- Index for session performance lookups
create index if not exists idx_flashcard_performance_session_id 
on public.flashcard_performance(study_session_id);

comment on index public.idx_flashcard_performance_session_id is 
'Optimizes queries for all performance records in a specific study session';

-- =====================================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- 3.1. decks table RLS
-- -------------------------------------------------------------------------------------
-- Enable RLS on decks table
alter table public.decks enable row level security;

-- Policy: authenticated users can view their own decks
create policy decks_select_own 
on public.decks 
for select 
to authenticated
using (auth.uid() = user_id);

comment on policy decks_select_own on public.decks is 
'Allows authenticated users to view only their own decks';

-- Policy: authenticated users can insert decks for themselves
create policy decks_insert_own 
on public.decks 
for insert 
to authenticated
with check (auth.uid() = user_id);

comment on policy decks_insert_own on public.decks is 
'Allows authenticated users to create decks only for themselves';

-- Policy: authenticated users can update their own decks
create policy decks_update_own 
on public.decks 
for update 
to authenticated
using (auth.uid() = user_id);

comment on policy decks_update_own on public.decks is 
'Allows authenticated users to update only their own decks';

-- Policy: authenticated users can delete their own decks
create policy decks_delete_own 
on public.decks 
for delete 
to authenticated
using (auth.uid() = user_id);

comment on policy decks_delete_own on public.decks is 
'Allows authenticated users to delete only their own decks';

-- -------------------------------------------------------------------------------------
-- 3.2. flashcards table RLS
-- -------------------------------------------------------------------------------------
-- Enable RLS on flashcards table
alter table public.flashcards enable row level security;

-- Policy: authenticated users can view flashcards from their own decks
create policy flashcards_select_own 
on public.flashcards 
for select 
to authenticated
using (
  exists (
    select 1 
    from public.decks 
    where decks.id = flashcards.deck_id 
    and decks.user_id = auth.uid()
  )
);

comment on policy flashcards_select_own on public.flashcards is 
'Allows authenticated users to view flashcards only from their own decks';

-- Policy: authenticated users can insert flashcards into their own decks
create policy flashcards_insert_own 
on public.flashcards 
for insert 
to authenticated
with check (
  exists (
    select 1 
    from public.decks 
    where decks.id = flashcards.deck_id 
    and decks.user_id = auth.uid()
  )
);

comment on policy flashcards_insert_own on public.flashcards is 
'Allows authenticated users to create flashcards only in their own decks';

-- Policy: authenticated users can update flashcards in their own decks
create policy flashcards_update_own 
on public.flashcards 
for update 
to authenticated
using (
  exists (
    select 1 
    from public.decks 
    where decks.id = flashcards.deck_id 
    and decks.user_id = auth.uid()
  )
);

comment on policy flashcards_update_own on public.flashcards is 
'Allows authenticated users to update flashcards only in their own decks';

-- Policy: authenticated users can delete flashcards from their own decks
create policy flashcards_delete_own 
on public.flashcards 
for delete 
to authenticated
using (
  exists (
    select 1 
    from public.decks 
    where decks.id = flashcards.deck_id 
    and decks.user_id = auth.uid()
  )
);

comment on policy flashcards_delete_own on public.flashcards is 
'Allows authenticated users to delete flashcards only from their own decks';

-- -------------------------------------------------------------------------------------
-- 3.3. ai_generation_logs table RLS
-- -------------------------------------------------------------------------------------
-- Enable RLS on ai_generation_logs table
alter table public.ai_generation_logs enable row level security;

-- Policy: authenticated users can view their own generation logs
create policy ai_generation_logs_select_own 
on public.ai_generation_logs 
for select 
to authenticated
using (auth.uid() = user_id);

comment on policy ai_generation_logs_select_own on public.ai_generation_logs is 
'Allows authenticated users to view only their own AI generation logs';

-- Policy: authenticated users can insert logs for themselves
create policy ai_generation_logs_insert_own 
on public.ai_generation_logs 
for insert 
to authenticated
with check (auth.uid() = user_id);

comment on policy ai_generation_logs_insert_own on public.ai_generation_logs is 
'Allows authenticated users to create AI generation logs only for themselves';

-- -------------------------------------------------------------------------------------
-- 3.4. study_sessions table RLS
-- -------------------------------------------------------------------------------------
-- Enable RLS on study_sessions table
alter table public.study_sessions enable row level security;

-- Policy: authenticated users can view their own study sessions
create policy study_sessions_select_own 
on public.study_sessions 
for select 
to authenticated
using (auth.uid() = user_id);

comment on policy study_sessions_select_own on public.study_sessions is 
'Allows authenticated users to view only their own study sessions';

-- Policy: authenticated users can insert sessions for themselves
create policy study_sessions_insert_own 
on public.study_sessions 
for insert 
to authenticated
with check (auth.uid() = user_id);

comment on policy study_sessions_insert_own on public.study_sessions is 
'Allows authenticated users to create study sessions only for themselves';

-- Policy: authenticated users can update their own sessions
create policy study_sessions_update_own 
on public.study_sessions 
for update 
to authenticated
using (auth.uid() = user_id);

comment on policy study_sessions_update_own on public.study_sessions is 
'Allows authenticated users to update only their own study sessions';

-- -------------------------------------------------------------------------------------
-- 3.5. flashcard_performance table RLS
-- -------------------------------------------------------------------------------------
-- Enable RLS on flashcard_performance table
alter table public.flashcard_performance enable row level security;

-- Policy: authenticated users can view performance records from their own sessions
create policy flashcard_performance_select_own 
on public.flashcard_performance 
for select 
to authenticated
using (
  exists (
    select 1 
    from public.study_sessions 
    where study_sessions.id = flashcard_performance.study_session_id 
    and study_sessions.user_id = auth.uid()
  )
);

comment on policy flashcard_performance_select_own on public.flashcard_performance is 
'Allows authenticated users to view performance records only from their own study sessions';

-- Policy: authenticated users can insert performance records for their own sessions
create policy flashcard_performance_insert_own 
on public.flashcard_performance 
for insert 
to authenticated
with check (
  exists (
    select 1 
    from public.study_sessions 
    where study_sessions.id = flashcard_performance.study_session_id 
    and study_sessions.user_id = auth.uid()
  )
);

comment on policy flashcard_performance_insert_own on public.flashcard_performance is 
'Allows authenticated users to create performance records only for their own study sessions';

-- =====================================================================================
-- 4. TRIGGERS
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- 4.1. updated_at trigger function
-- -------------------------------------------------------------------------------------
-- Function to automatically update the updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function public.update_updated_at_column() is 
'Automatically updates the updated_at column to the current timestamp';

-- -------------------------------------------------------------------------------------
-- 4.2. Apply updated_at trigger to decks table
-- -------------------------------------------------------------------------------------
create trigger update_decks_updated_at
before update on public.decks
for each row
execute function public.update_updated_at_column();

comment on trigger update_decks_updated_at on public.decks is 
'Automatically updates updated_at timestamp when a deck is modified';

-- -------------------------------------------------------------------------------------
-- 4.3. Apply updated_at trigger to flashcards table
-- -------------------------------------------------------------------------------------
create trigger update_flashcards_updated_at
before update on public.flashcards
for each row
execute function public.update_updated_at_column();

comment on trigger update_flashcards_updated_at on public.flashcards is 
'Automatically updates updated_at timestamp when a flashcard is modified';

-- =====================================================================================
-- END OF MIGRATION
-- =====================================================================================
