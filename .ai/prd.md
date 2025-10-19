# Product Requirements Document (PRD) - AI Flashcard Generator

## 1. Product Overview

The AI Flashcard Generator is a web-based application designed to streamline the creation of educational flashcards. By leveraging AI, the application automates the conversion of raw text, such as lecture notes or articles, into digital flashcards. This significantly reduces the manual effort and time required for card creation, thereby encouraging the adoption of spaced repetition, a highly effective learning technique. The platform supports manual flashcard creation and editing, deck management, and a study mode powered by the FSRS spaced repetition algorithm. The primary goal is to provide students and lifelong learners with an efficient tool to enhance their study habits and improve knowledge retention.

## 2. User Problem

The manual creation of high-quality educational flashcards is a time-consuming and often tedious process. For learners who wish to use spaced repetition systems, this initial barrier can be significant enough to discourage them from using this effective learning method altogether. Students and other learners need a faster, more efficient way to create study materials from their notes, textbooks, and other text-based resources, allowing them to spend more time studying and less time on preparation.

## 3. Functional Requirements

### 3.1. User Authentication

- Users must be able to create a new account using a username and password.
- Registered users must be able to log in to their accounts.
- A simplified, insecure password reset mechanism will be available for users who forget their password.

### 3.2. Deck Management

- Authenticated users can create new, empty decks of flashcards.
- Users can view a list of all their created decks.
- Users can rename existing decks.
- Users can delete decks, which will also delete all associated flashcards.

### 3.3. Flashcard Generation and Management

- Users can manually create individual flashcards (with a front and back) and add them to a specific deck.
- Users can paste raw text into a generator to have flashcards automatically created by the Gemini AI.
- AI-generated cards are created as drafts and are not immediately added to a deck for studying.
- Users must be able to review, edit, accept, or delete these draft flashcards.
- Accepting a draft card moves it into the selected deck.
- AI generation is subject to a daily usage limit per user.

### 3.4. Studying

- Users can initiate a study session for any of their decks.
- The study session will present cards that are due for review based on the FSRS (Free Spaced Repetition Scheduler) algorithm with default settings.
- During a session, users view the front of a card, can choose to reveal the back, and then self-grade their recall ability (e.g., "Again," "Hard," "Good," "Easy").
- The user's self-assessment determines the next review date for that card.
- The session concludes when all cards due for that day have been reviewed.

### 3.5. System and Database

- All user data, including accounts, decks, and flashcards, will be stored in a PostgreSQL database.
- The database will run within a Docker container, and data will be persisted using a named volume.

## 4. Product Boundaries

### What is Included in the MVP:

- User account system for storing personal flashcards.
- AI-powered flashcard generation from pasted text.
- Manual creation, viewing, editing, and deletion of flashcards.
- Organization of flashcards into decks.
- Integration with the FSRS spaced repetition algorithm for studying.
- A web-only application accessible via modern browsers.

### What is NOT Included in the MVP:

- Development of a proprietary, advanced spaced repetition algorithm (like SuperMemo or Anki's).
- Import capabilities for various file formats (e.g., PDF, DOCX, CSV).
- Features for sharing decks or flashcards between users.
- Integrations with external educational platforms or APIs.
- Native mobile applications for iOS or Android.

## 5. User Stories

### User Authentication

- ID: US-001
- Title: New User Registration
- Description: As a new user, I want to create an account using a username and password so that I can save my flashcards and track my progress.
- Acceptance Criteria:
  - A user can navigate to a registration page.
  - A user can enter a username and a password.
  - The system validates that the username is not already taken.
  - Upon successful registration, the user is logged in and redirected to the main dashboard.
  - An error message is displayed if the username is already in use.

- ID: US-002
- Title: User Login
- Description: As a returning user, I want to log in to my account so that I can access my decks and continue studying.
- Acceptance Criteria:
  - A user can navigate to a login page.
  - A user can enter their username and password.
  - Upon successful authentication, the user is redirected to their dashboard.
  - An error message is displayed for invalid credentials.

- ID: US-003
- Title: User Logout
- Description: As a logged-in user, I want to log out of my account to ensure my session is secure.
- Acceptance Criteria:
  - A logged-in user can find and click a "Logout" button.
  - Upon clicking, the user's session is terminated, and they are redirected to the login or home page.

- ID: US-004
- Title: Simplified Password Reset
- Description: As a user who has forgotten my password, I want a way to reset it so I can regain access to my account.
- Acceptance Criteria:
  - A user can access a "Forgot Password" link from the login page.
  - The user enters their username.
  - The system provides a (simplified, insecure) method to set a new password.
  - The user can log in with the new password.

### Deck Management

- ID: US-005
- Title: Create a New Deck
- Description: As a logged-in user, I want to create a new deck so I can organize my flashcards by subject or topic.
- Acceptance Criteria:
  - The user is prompted to create their first deck upon first login.
  - A logged-in user can access a "Create Deck" button or form.
  - The user must provide a name for the deck.
  - The new deck appears in the user's list of decks.
  - An error message is shown if the user tries to create a deck with a name that already exists for them.

- ID: US-006
- Title: View All Decks
- Description: As a logged-in user, I want to see a list of all my decks so I can choose which one to study or manage.
- Acceptance Criteria:
  - The user's dashboard displays a list of all their created decks.
  - Each item in the list shows the deck's name and the number of cards it contains.

- ID: US-007
- Title: Rename a Deck
- Description: As a logged-in user, I want to rename a deck to better reflect its contents.
- Acceptance Criteria:
  - A user can select an option to edit a deck's name from the deck list.
  - The user can enter a new name and save the change.
  - The deck list updates to show the new name.

- ID: US-008
- Title: Delete a Deck
- Description: As a logged-in user, I want to delete a deck that I no longer need.
- Acceptance Criteria:
  - A user can select an option to delete a deck.
  - A confirmation prompt is displayed to prevent accidental deletion.
  - Upon confirmation, the deck and all its flashcards are permanently removed.
  - The deck no longer appears in the user's list of decks.

### Flashcard Management

- ID: US-009
- Title: Manually Create a Flashcard
- Description: As a user, I want to manually add a new flashcard to one of my decks.
- Acceptance Criteria:
  - From a deck's management page, a user can access a form to create a new flashcard.
  - The form has fields for the "front" (question) and "back" (answer) of the card.
  - Upon saving, the new flashcard is added to the selected deck.
  - The card count for the deck is updated.

- ID: US-010
- Title: Edit an Existing Flashcard
- Description: As a user, I want to edit the content of a flashcard to correct a mistake or add more information.
- Acceptance Criteria:
  - A user can select a flashcard from within a deck to edit.
  - The user can modify the text on the front and/or back of the card.
  - The changes are saved and reflected when studying.

- ID: US-011
- Title: Delete a Flashcard
- Description: As a user, I want to delete a flashcard that is no longer relevant or useful.
- Acceptance Criteria:
  - A user can select a flashcard from within a deck to delete.
  - A confirmation prompt is displayed.
  - Upon confirmation, the flashcard is permanently removed from the deck.
  - The card count for the deck is updated.

### AI Flashcard Generation

- ID: US-012
- Title: Generate Flashcards from Text
- Description: As a user, I want to paste a block of text and have the AI generate flashcards from it to save time.
- Acceptance Criteria:
  - A user can access the AI generation feature.
  - There is a text area where the user can paste their notes.
  - The user selects the destination deck for the generated cards.
  - Upon submission, the AI processes the text and creates a set of draft flashcards.
  - The user is redirected to a review screen to manage the drafts.

- ID: US-013
- Title: Review AI-Generated Drafts
- Description: As a user, I want to review the flashcards generated by the AI before adding them to my deck to ensure their quality and accuracy.
- Acceptance Criteria:
  - A review screen displays the list of draft flashcards, showing the front and back of each.
  - For each draft, the user has options to "Accept," "Edit," or "Delete."

- ID: US-014
- Title: Accept an AI-Generated Draft
- Description: As a user reviewing drafts, I want to accept a well-formed flashcard to add it to my deck.
- Acceptance Criteria:
  - Clicking "Accept" on a draft card moves it from the draft area into the main deck.
  - The accepted card is now available for studying.
  - The draft is removed from the review list.

- ID: US-015
- Title: Edit an AI-Generated Draft
- Description: As a user reviewing drafts, I want to edit a flashcard to correct inaccuracies or rephrase it before accepting it.
- Acceptance Criteria:
  - Clicking "Edit" on a draft card opens an editing interface, pre-filled with the draft's content.
  - The user can modify the front and back text.
  - After saving the edits, the user can then accept the corrected card into the deck.

- ID: US-016
- Title: Delete an AI-Generated Draft
- Description: As a user reviewing drafts, I want to delete an irrelevant or poor-quality flashcard.
- Acceptance Criteria:
  - Clicking "Delete" on a draft card presents a confirmation prompt.
  - Upon confirmation, the draft card is permanently removed and not added to the deck.

- ID: US-017
- Title: AI Generation Daily Limit
- Description: As a user, I should be notified when I have reached my daily limit for AI flashcard generation.
- Acceptance Criteria:
  - The system tracks the number of AI generation requests per user per day.
  - When a user attempts to generate flashcards beyond their limit, they are shown a message informing them they have reached the limit.
  - The generation request is blocked until the limit resets.

### Spaced Repetition Studying

- ID: US-018
- Title: Start a Study Session
- Description: As a user, I want to start a study session for a specific deck to review my flashcards.
- Acceptance Criteria:
  - Each deck in the deck list has a "Study" button.
  - Clicking "Study" initiates a session, starting with the first card due for review.
  - If no cards are due, a message is displayed to the user, and the session does not start.

- ID: US-019
- Title: Review a Flashcard
- Description: During a study session, I want to be shown the front of a flashcard and be able to reveal the answer when I'm ready.
- Acceptance Criteria:
  - The study interface displays the front text of one flashcard at a time.
  - A "Show Answer" button is present.
  - Clicking the button reveals the back text of the flashcard.

- ID: US-020
- Title: Self-Grade Recall
- Description: After seeing the answer to a flashcard, I want to rate how well I remembered it to schedule its next review.
- Acceptance Criteria:
  - After the answer is shown, several grading buttons appear (e.g., "Again," "Hard," "Good," "Easy").
  - Clicking a button records the grade for that card.
  - The FSRS algorithm uses this grade to calculate the next review interval.
  - The interface automatically proceeds to the next due card.

- ID: US-021
- Title: End a Study Session
- Description: As a user, I want the study session to end once I have reviewed all the cards that were due for that day.
- Acceptance Criteria:
  - The session continues until the queue of due cards is empty.
  - Upon completion, a summary screen is displayed, showing the number of cards reviewed.
  - The user is then returned to their dashboard or deck view.

## 6. Success Metrics

The success of the AI Flashcard Generator MVP will be measured against the following key performance indicators, which directly reflect its core value proposition.

### 6.1. AI Quality Acceptance Rate

- Metric: The percentage of AI-generated draft flashcards that are accepted by the user.
- Target: 75% of all draft flashcards are accepted (i.e., not deleted).
- Measurement: This will be calculated by tracking the number of "Accept" actions versus "Delete" actions on the draft review screen.
- Formula: `(Total Accepted Drafts) / (Total Accepted Drafts + Total Deleted Drafts) * 100%`

### 6.2. AI Feature Adoption Rate

- Metric: The percentage of all new flashcards that are created using the AI generator.
- Target: 75% of all new flashcards created in the system originate from the AI generator.
- Measurement: This will be measured by comparing the count of cards created via the AI generation workflow against those created manually.
- Formula: `(Total AI-Generated Cards Accepted) / (Total AI-Generated Cards Accepted + Total Manually Created Cards) * 100%`
