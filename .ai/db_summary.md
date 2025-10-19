<decisions>
Implement a users table with fields for username, password hash, and metadata with unique constraints.
Establish a one-to-many relationship between users and decks so that each deck is owned by a specific user.
Create a flashcards table that includes a status flag (draft, new or finalized) along with spaced repetition fields: ease_factor, interval, and next_review_date.
Create a table to log AI generation usage with user_id, timestamp, and count to enforce daily limits.
Enforce ON DELETE CASCADE on the relationship between decks and flashcards.
Create a study_sessions table to capture session details and performance metrics.
Add an index on the flashcards table for the next_review_date column to optimize study session due lookups.
Create a flashcard_performance table with foreign keys to flashcards and study_sessions to record historical grading data.
Limit flashcard content to 200 characters for the front and 500 characters for the back.
Use auto-incrementing integers as primary keys for tables.
Enforce Row-Level Security (RLS) on users, decks, and flashcards to ensure data access is limited to the owner.
</decisions>

<matched_recommendations>
Implementation of a users table with proper constraints and metadata.
Establishing a one-to-many relationship between users and decks.
Creation of a flashcards table with a status flag and spaced repetition fields.
Logging AI generation attempts using a dedicated table.
Enforcing ON DELETE CASCADE between decks and flashcards.
Creating a study_sessions table to track session details.
Adding an index on the next_review_date in the flashcards table.
Creating a flashcard_performance table for historical grading data.
Imposing flashcard content limits (200 chars for front, 500 chars for back).
Using auto-incrementing integer primary keys.
Enforcing RLS for security.
</matched_recommendations>

<database_planning_summary>
The database schema is required to support user authentication, deck management, flashcard creation and review (including AI-generated drafts), and spaced repetition-based study sessions. Key entities include:
• Users: Stores credentials and metadata with unique constraints.
• Decks: Belong to users (one-to-many relationship) and include deck names and creation metadata.
• Flashcards: Linked to decks, contain front and back text (limited to 200 and 500 characters respectively), include a status flag, and hold spaced repetition fields (ease_factor, interval, next_review_date).
• AI Generation Logs: Track daily usage of AI-powered flashcard creation to enforce usage limits.
• Study_sessions: Record details of study sessions including times and performance metrics.
• Flashcard_performance: Stores historical grading data linked to flashcards and study sessions to support spaced repetition algorithms.
Security is addressed by enforcing Row-Level Security (RLS) policies on key tables (users, decks, flashcards) to restrict data access to the record owners. Scalability and performance optimizations include adding an index on the next_review_date field in flashcards. Advanced partitioning, tagging, audit logging, and additional indexing on timestamps are deferred for future iterations beyond the MVP.
</database_planning_summary>

<unresolved_issues>
Determining the necessity of additional indexing on timestamp fields in tables other than flashcards for future scalability.
</unresolved_issues>
