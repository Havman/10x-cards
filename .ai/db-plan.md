# Database Schema Plan - AI Flashcard Generator

## 1. Tables

### 1.1. users

Stores user account information and authentication credentials.
This table is managed by Supabase Auth.

| Column        | Type         | Constraints                         | Description                        |
| ------------- | ------------ | ----------------------------------- | ---------------------------------- |
| id            | SERIAL       | PRIMARY KEY                         | Auto-incrementing user identifier  |
| username      | VARCHAR(50)  | NOT NULL, UNIQUE                    | Unique username for login          |
| password_hash | VARCHAR(255) | NOT NULL                            | Hashed password for authentication |
| created_at    | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Account creation timestamp         |
| updated_at    | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp              |
| metadata      | JSONB        | DEFAULT '{}'                        | Additional user metadata           |

### 1.2. decks

Stores flashcard decks owned by users.

| Column     | Type         | Constraints                                         | Description                        |
| ---------- | ------------ | --------------------------------------------------- | ---------------------------------- |
| id         | SERIAL       | PRIMARY KEY                                         | Auto-incrementing deck identifier  |
| user_id    | INTEGER      | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | Owner of the deck                  |
| name       | VARCHAR(100) | NOT NULL                                            | Deck name                          |
| created_at | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP                 | Deck creation timestamp            |
| updated_at | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP                 | Last update timestamp              |
| CONSTRAINT | -            | UNIQUE(user_id, name)                               | Ensures unique deck names per user |

### 1.3. flashcards

Stores individual flashcards with spaced repetition data.

| Column           | Type         | Constraints                                                              | Description                            |
| ---------------- | ------------ | ------------------------------------------------------------------------ | -------------------------------------- |
| id               | SERIAL       | PRIMARY KEY                                                              | Auto-incrementing flashcard identifier |
| deck_id          | INTEGER      | NOT NULL, FOREIGN KEY → decks(id) ON DELETE CASCADE                      | Parent deck                            |
| front            | VARCHAR(200) | NOT NULL                                                                 | Question/front side of card            |
| back             | VARCHAR(500) | NOT NULL                                                                 | Answer/back side of card               |
| status           | VARCHAR(20)  | NOT NULL, DEFAULT 'new', CHECK (status IN ('draft', 'new', 'finalized')) | Card status for workflow management    |
| source           | VARCHAR      | NOT NULL, CHECK (source IN ('ai', 'manual'))                             | Card source for AI check               |
| ease_factor      | DECIMAL(4,2) | NOT NULL, DEFAULT 2.50                                                   | FSRS ease factor (typically 1.3 - 4.0) |
| interval         | INTEGER      | NOT NULL, DEFAULT 0                                                      | Days until next review                 |
| next_review_date | DATE         | NOT NULL, DEFAULT CURRENT_DATE                                           | Scheduled review date                  |
| created_at       | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP                                      | Card creation timestamp                |
| updated_at       | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP                                      | Last update timestamp                  |

### 1.4. ai_generation_logs

Tracks AI flashcard generation usage to enforce daily limits.

| Column       | Type      | Constraints                                         | Description                               |
| ------------ | --------- | --------------------------------------------------- | ----------------------------------------- |
| id           | SERIAL    | PRIMARY KEY                                         | Auto-incrementing log identifier          |
| user_id      | INTEGER   | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | User who requested generation             |
| generated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP                 | Timestamp of generation request           |
| cards_count  | INTEGER   | NOT NULL, DEFAULT 0                                 | Number of cards generated in this request |

### 1.5. study_sessions

Records study session details and performance metrics.

| Column         | Type      | Constraints                                         | Description                          |
| -------------- | --------- | --------------------------------------------------- | ------------------------------------ |
| id             | SERIAL    | PRIMARY KEY                                         | Auto-incrementing session identifier |
| user_id        | INTEGER   | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | User conducting the session          |
| deck_id        | INTEGER   | NOT NULL, FOREIGN KEY → decks(id) ON DELETE CASCADE | Deck being studied                   |
| started_at     | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP                 | Session start time                   |
| ended_at       | TIMESTAMP | NULL                                                | Session end time (NULL if ongoing)   |
| cards_reviewed | INTEGER   | NOT NULL, DEFAULT 0                                 | Total cards reviewed in session      |
| cards_correct  | INTEGER   | NOT NULL, DEFAULT 0                                 | Cards graded as "Good" or "Easy"     |

### 1.6. flashcard_performance

Stores historical grading data for flashcards to support FSRS algorithm.

| Column               | Type         | Constraints                                                  | Description                                     |
| -------------------- | ------------ | ------------------------------------------------------------ | ----------------------------------------------- |
| id                   | SERIAL       | PRIMARY KEY                                                  | Auto-incrementing performance record identifier |
| flashcard_id         | INTEGER      | NOT NULL, FOREIGN KEY → flashcards(id) ON DELETE CASCADE     | Flashcard being reviewed                        |
| study_session_id     | INTEGER      | NOT NULL, FOREIGN KEY → study_sessions(id) ON DELETE CASCADE | Session in which card was reviewed              |
| grade                | VARCHAR(10)  | NOT NULL, CHECK (grade IN ('again', 'hard', 'good', 'easy')) | Self-assessment grade                           |
| reviewed_at          | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP                          | Timestamp of review                             |
| previous_ease_factor | DECIMAL(4,2) | NOT NULL                                                     | Ease factor before this review                  |
| previous_interval    | INTEGER      | NOT NULL                                                     | Interval before this review                     |
| new_ease_factor      | DECIMAL(4,2) | NOT NULL                                                     | Updated ease factor after review                |
| new_interval         | INTEGER      | NOT NULL                                                     | Updated interval after review                   |

## 2. Relationships

### users → decks

- **Type**: One-to-Many
- **Relationship**: One user can own multiple decks
- **Foreign Key**: decks.user_id → users.id
- **On Delete**: CASCADE (deleting a user removes all their decks)

### users → ai_generation_logs

- **Type**: One-to-Many
- **Relationship**: One user can have multiple AI generation log entries
- **Foreign Key**: ai_generation_logs.user_id → users.id
- **On Delete**: CASCADE (deleting a user removes their generation logs)

### users → study_sessions

- **Type**: One-to-Many
- **Relationship**: One user can have multiple study sessions
- **Foreign Key**: study_sessions.user_id → users.id
- **On Delete**: CASCADE (deleting a user removes their study sessions)

### decks → flashcards

- **Type**: One-to-Many
- **Relationship**: One deck contains multiple flashcards
- **Foreign Key**: flashcards.deck_id → decks.id
- **On Delete**: CASCADE (deleting a deck removes all its flashcards)

### decks → study_sessions

- **Type**: One-to-Many
- **Relationship**: One deck can be studied in multiple sessions
- **Foreign Key**: study_sessions.deck_id → decks.id
- **On Delete**: CASCADE (deleting a deck removes associated study sessions)

### flashcards → flashcard_performance

- **Type**: One-to-Many
- **Relationship**: One flashcard can have multiple performance records
- **Foreign Key**: flashcard_performance.flashcard_id → flashcards.id
- **On Delete**: CASCADE (deleting a flashcard removes its performance history)

### study_sessions → flashcard_performance

- **Type**: One-to-Many
- **Relationship**: One study session contains multiple flashcard reviews
- **Foreign Key**: flashcard_performance.study_session_id → study_sessions.id
- **On Delete**: CASCADE (deleting a session removes associated performance records)

## 3. Indexes

### Performance Optimization Indexes

```sql
-- Index for flashcard review date lookups (critical for study sessions)
CREATE INDEX idx_flashcards_next_review_date
ON flashcards(next_review_date)
WHERE status = 'finalized';

-- Index for flashcard status filtering
CREATE INDEX idx_flashcards_status
ON flashcards(status);

-- Index for deck-based flashcard queries
CREATE INDEX idx_flashcards_deck_id
ON flashcards(deck_id);

-- Index for user's decks lookup
CREATE INDEX idx_decks_user_id
ON decks(user_id);

-- Index for AI generation daily limit checks
CREATE INDEX idx_ai_generation_logs_user_date
ON ai_generation_logs(user_id, generated_at);

-- Index for study session history queries
CREATE INDEX idx_study_sessions_user_id
ON study_sessions(user_id);

-- Index for deck study session history
CREATE INDEX idx_study_sessions_deck_id
ON study_sessions(deck_id);

-- Index for flashcard performance lookups
CREATE INDEX idx_flashcard_performance_flashcard_id
ON flashcard_performance(flashcard_id);

-- Index for session performance lookups
CREATE INDEX idx_flashcard_performance_session_id
ON flashcard_performance(study_session_id);
```

## 4. Row-Level Security (RLS) Policies

### 4.1. users Table Policies

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only view and update their own record
CREATE POLICY users_select_own
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY users_update_own
ON users FOR UPDATE
USING (auth.uid() = id);

-- Note: INSERT is handled by Supabase Auth, DELETE may be restricted or handled separately
```

### 4.2. decks Table Policies

```sql
-- Enable RLS on decks table
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

-- Users can view only their own decks
CREATE POLICY decks_select_own
ON decks FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert decks only for themselves
CREATE POLICY decks_insert_own
ON decks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update only their own decks
CREATE POLICY decks_update_own
ON decks FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete only their own decks
CREATE POLICY decks_delete_own
ON decks FOR DELETE
USING (auth.uid() = user_id);
```

### 4.3. flashcards Table Policies

```sql
-- Enable RLS on flashcards table
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Users can view flashcards only from their own decks
CREATE POLICY flashcards_select_own
ON flashcards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  )
);

-- Users can insert flashcards only into their own decks
CREATE POLICY flashcards_insert_own
ON flashcards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  )
);

-- Users can update flashcards only in their own decks
CREATE POLICY flashcards_update_own
ON flashcards FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  )
);

-- Users can delete flashcards only from their own decks
CREATE POLICY flashcards_delete_own
ON flashcards FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  )
);
```

### 4.4. ai_generation_logs Table Policies

```sql
-- Enable RLS on ai_generation_logs table
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- Users can view only their own generation logs
CREATE POLICY ai_generation_logs_select_own
ON ai_generation_logs FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert logs only for themselves
CREATE POLICY ai_generation_logs_insert_own
ON ai_generation_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 4.5. study_sessions Table Policies

```sql
-- Enable RLS on study_sessions table
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view only their own study sessions
CREATE POLICY study_sessions_select_own
ON study_sessions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert sessions only for themselves
CREATE POLICY study_sessions_insert_own
ON study_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update only their own sessions
CREATE POLICY study_sessions_update_own
ON study_sessions FOR UPDATE
USING (auth.uid() = user_id);
```

### 4.6. flashcard_performance Table Policies

```sql
-- Enable RLS on flashcard_performance table
ALTER TABLE flashcard_performance ENABLE ROW LEVEL SECURITY;

-- Users can view performance records only from their own study sessions
CREATE POLICY flashcard_performance_select_own
ON flashcard_performance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM study_sessions
    WHERE study_sessions.id = flashcard_performance.study_session_id
    AND study_sessions.user_id = auth.uid()
  )
);

-- Users can insert performance records only for their own sessions
CREATE POLICY flashcard_performance_insert_own
ON flashcard_performance FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM study_sessions
    WHERE study_sessions.id = flashcard_performance.study_session_id
    AND study_sessions.user_id = auth.uid()
  )
);
```

## 5. Additional Design Notes

### 5.1. Spaced Repetition Algorithm (FSRS)

- The `flashcards` table includes fields specifically designed for the FSRS algorithm: `ease_factor`, `interval`, and `next_review_date`.
- Default values are set for new cards: `ease_factor = 2.50`, `interval = 0`, `next_review_date = CURRENT_DATE`.
- The `flashcard_performance` table maintains a complete history of reviews, storing both previous and new values for ease factor and interval to support algorithm refinement and analytics.

### 5.2. Flashcard Status Workflow

The `status` field supports three states:

- **draft**: AI-generated cards awaiting user review
- **new**: Cards that have been accepted but not yet studied
- **finalized**: Cards that have been reviewed at least once

### 5.3. Content Constraints

- Front of flashcard: Maximum 200 characters
- Back of flashcard: Maximum 500 characters
- These limits are enforced at the database level via VARCHAR constraints

### 5.4. AI Generation Daily Limits

- The `ai_generation_logs` table tracks all generation requests with timestamps
- Daily limits can be enforced by querying this table for the current user and date
- The `cards_count` field allows tracking individual card generation for more granular limits

### 5.5. Cascade Deletions

All foreign key relationships use `ON DELETE CASCADE` to ensure data integrity:

- Deleting a user removes all their decks, flashcards, sessions, and logs
- Deleting a deck removes all associated flashcards and study sessions
- Deleting a study session removes all associated performance records
- Deleting a flashcard removes all its performance history

### 5.6. Timestamp Tracking

All tables include `created_at` and `updated_at` timestamps (where applicable) to support:

- Audit trails
- Data synchronization
- User activity analytics
- Future features requiring temporal data

### 5.7. Supabase Integration

- RLS policies assume Supabase Auth integration using `auth.uid()` function
- The users table will integrate with Supabase Auth for authentication
- Password reset functionality will leverage Supabase Auth features

### 5.8. Performance Considerations

- The critical index on `flashcards.next_review_date` includes a WHERE clause filtering by status to improve query performance for study sessions
- Composite index on `ai_generation_logs(user_id, generated_at)` optimizes daily limit checks
- All foreign key columns are indexed for efficient JOIN operations

### 5.9. Future Scalability

While not implemented in the MVP, the schema is designed to accommodate:

- Additional metadata fields via JSONB columns
- Partitioning of large tables (flashcard_performance) by date
- Materialized views for analytics and reporting
- Additional indexing on timestamp fields if query patterns require it

### 5.10. Data Normalization

The schema follows Third Normal Form (3NF):

- No transitive dependencies
- All non-key attributes depend on the primary key
- No data duplication except for necessary foreign keys
- Historical data (flashcard_performance) intentionally denormalizes previous values for analytical purposes
