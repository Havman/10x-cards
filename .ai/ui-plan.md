# UI Architecture for AI Flashcard Generator

## 1. UI Structure Overview

The UI architecture is designed as a single-page application (SPA) experience built with Astro and React, leveraging server-side rendering for initial page loads and client-side rendering for dynamic interactions. The structure is centered around a main dashboard that serves as the hub for all user activities. From the dashboard, users can manage their decks, initiate study sessions, and navigate to the AI generation flow.

The application follows a deck-centric model, where most actions (studying, generating cards, managing cards) are performed within the context of a specific deck. Navigation is hierarchical, with a persistent top navigation bar for global actions and breadcrumbs for contextual navigation within nested views. The UI will be built using the `shadcn/ui` component library and styled with Tailwind CSS, ensuring a consistent, accessible, and modern user experience. There will be API interactions managed through dedicated service modules that provide user feedback via toast notifications.

## 2. View List

### 2.1. Authentication Views

- **View Name:** Login
- **View Path:** `/login`
- **Main Purpose:** To allow existing users to authenticate.
- **Key Information to Display:** Username and password fields.
- **Key View Components:** `Card`, `Input`, `Button`, `Label`, Link to Registration and Password Reset.
- **UX, Accessibility, and Security:**
  - **UX:** Clear error messages for invalid credentials. Autofocus on the username field.
  - **Accessibility:** Proper labeling for all form fields. Keyboard navigable.
  - **Security:** All communication over HTTPS.

- **View Name:** Register
- **View Path:** `/register`
- **Main Purpose:** To allow new users to create an account.
- **Key Information to Display:** Username and password fields.
- **Key View Components:** `Card`, `Input`, `Button`, `Label`, Link to Login.
- **UX, Accessibility, and Security:**
  - **UX:** Real-time feedback on username availability (if possible via API). Clear password requirements.
  - **Accessibility:** Proper labeling for all form fields.
  - **Security:** All communication over HTTPS.

- **View Name:** Password Reset
- **View Path:** `/reset-password`
- **Main Purpose:** To allow users to reset their password.
- **Key Information to Display:** Username input, new password form.
- **Key View Components:** `Card`, `Input`, `Button`, `Label`, `Alert` (for security warning).
- **UX, Accessibility, and Security:**
  - **UX:** A clear, two-step process: first enter username, then set a new password.
  - **Accessibility:** Proper labeling for all form fields.
  - **Security:** Display a prominent `Alert` warning about the insecurity of the simplified reset method.

### 2.2. Core Application Views

- **View Name:** Dashboard (My Decks)
- **View Path:** `/` or `/dashboard`
- **Main Purpose:** To serve as the main landing page for authenticated users, displaying all their decks.
- **Key Information to Display:**
  - For new users: A welcome message and a "Create Your First Deck" call-to-action.
  - For returning users: A grid or list of `DeckCard` components.
- **Key View Components:** `Button` (Create Deck), `DeckCard` (for each deck), `WelcomeMessage`.
- **UX, Accessibility, and Security:**
  - **UX:** `DeckCard`s provide at-a-glance info (name, card count). A "three-dot" menu on each card reveals actions (Rename, Delete).
  - **Accessibility:** The view should be navigable by keyboard. Actions should be clearly labeled.
  - **Security:** Data is fetched via `GET /api/decks`, which is protected and scoped to the user.

- **View Name:** Deck Detail
- **View Path:** `/decks/{deck_id}`
- **Main Purpose:** To display the contents of a specific deck and provide actions related to it.
- **Key Information to Display:** Deck name, list/table of flashcards in the deck, statistics (total cards, cards due).
- **Key View Components:** `Breadcrumb`, `Button` (Study, AI Generate, Add Card), `DataTable` (for flashcards), `Card` (for stats).
- **UX, Accessibility, and Security:**
  - **UX:** Clear separation between deck-level actions and the list of cards. The flashcard table should support sorting and filtering.
  - **Accessibility:** `Breadcrumb` for easy navigation. Table headers should be properly defined.
  - **Security:** Deck deletion requires confirmation via a `ConfirmationModal`.

- **View Name:** AI Generation
- **View Path:** `/decks/{deck_id}/generate`
- **Main Purpose:** To allow users to generate flashcards from raw text using AI.
- **Key Information to Display:** A large text area for input, a field for `max_cards`, and the user's remaining daily generation quota.
- **Key View Components:** `Breadcrumb`, `Textarea`, `Input`, `Button` (Generate), `Alert` (for usage limit).
- **UX, Accessibility, and Security:**
  - **UX:** A loading indicator is shown during generation. Upon completion, the user is automatically redirected to the Drafts Review view.
  - **Accessibility:** All form elements must have labels. Limit 1000-10000 characters for text provided.
  - **Security:** The view should fetch and display the user's daily limit from `GET /api/ai/usage`.

- **View Name:** Drafts Review
- **View Path:** `/decks/{deck_id}/drafts`
- **Main Purpose:** To allow users to review, edit, accept, or delete AI-generated flashcards before they are added to a deck.
- **Key Information to Display:** A list of draft flashcards, showing the front and back of each.
- **Key View Components:** `Breadcrumb`, `DataTable` with checkboxes, `Button` (Accept Selected, Delete Selected), `EditFlashcardModal`.
- **UX, Accessibility, and Security:**
  - **UX:** Supports bulk actions (accept/delete) to streamline the review process. Individual cards can be edited in a modal without leaving the page.
  - **Accessibility:** Table is keyboard navigable, and all actions are clearly labeled.
  - **Security:** Actions are scoped to the user's drafts via the API.

- **View Name:** Study Session
- **View Path:** `/study/{session_id}`
- **Main Purpose:** To guide the user through a spaced repetition study session.
- **Key Information to Display:** One flashcard at a time (front), a card counter ("5 of 20"), and a progress bar.
- **Key View Components:** `Card` (for the flashcard), `ProgressBar`, `Button` (Show Answer), `Button` group (Again, Hard, Good, Easy).
- **UX, Accessibility, and Security:**
  - **UX:** Minimalist UI to focus the user on studying. After grading, the next card appears automatically.
  - **Accessibility:** Keyboard shortcuts for revealing the answer and selecting a grade.
  - **Security:** The session is tied to a specific user and deck via `POST /api/decks/{deck_id}/study/start`.

## 3. User Journey Map

The primary user journey focuses on the core value proposition: turning text into study-ready flashcards.

1.  **Registration/Login:** A new user creates an account (`/register`) or an existing user logs in (`/login`).
2.  **Dashboard:** Upon successful authentication, the user lands on the Dashboard (`/`).
    -   **New User:** Sees a welcome message and clicks "Create Your First Deck," which opens a `CreateDeckModal`. After creating a deck, they see the Deck Detail view.
    -   **Returning User:** Sees a list of their existing decks.
3.  **Navigate to AI Generation:** From the Deck Detail view (`/decks/{deck_id}`), the user clicks the "AI Generate" button, taking them to the AI Generation view (`/decks/{deck_id}/generate`).
4.  **Generate Cards:** The user pastes text into the text area and clicks "Generate." The app calls `POST /api/ai/generate`.
5.  **Review Drafts:** After the API call completes, the user is automatically redirected to the Drafts Review view (`/decks/{deck_id}/drafts`), which displays the newly created drafts fetched from `GET /api/decks/{deck_id}/flashcards/drafts`.
6.  **Process Drafts:** The user reviews the drafts. They can `Accept` or `Delete` cards individually or in bulk. They can also `Edit` a card, which opens an `EditFlashcardModal`.
7.  **Start Studying:** Once cards are in a deck, the user can navigate to the Deck Detail view (`/decks/{deck_id}`) and click the "Study" button. This calls `POST /api/decks/{deck_id}/study/start` and redirects them to the Study Session view (`/study/{session_id}`).
8.  **Study Session:** The user proceeds through the study session, grading each card. The app calls `GET /api/study/sessions/{session_id}/next` to retrieve cards and `POST /api/study/sessions/{session_id}/review` to submit grades.
9.  **Session End:** When all due cards are reviewed, the user sees a session summary and is returned to the Deck Detail view or Dashboard.

## 4. Layout and Navigation Structure

-   **Main Layout:** A persistent layout component wraps all authenticated views. It consists of a top navigation bar and a main content area.
-   **Top Navigation Bar:**
    -   **Left Side:** Application Logo/Name (links to Dashboard).
    -   **Right Side:** User Avatar with a `DropdownMenu` containing links to "Profile" (future), "Settings" (future), and a "Logout" button.
-   **Breadcrumb Navigation:** Used on nested views (e.g., Deck Detail, AI Generation, Drafts Review) to show the user's location in the hierarchy and allow for easy navigation back to parent pages.
    -   Example: `My Decks > {Deck Name} > Generate`
-   **Protected Routes:** All views except Login, Register, and Password Reset are protected and require authentication. Unauthenticated users attempting to access them will be redirected to the `/login` page.

## 5. Key Components

These are reusable components, built with `shadcn/ui`, that will form the foundation of the UI.

-   **`DeckCard`:** A card component used on the Dashboard to represent a single deck. It displays the deck's name, card count, and a "three-dot" `DropdownMenu` for actions (Rename, Delete).
-   **`ConfirmationModal`:** A generic modal used to confirm destructive actions, such as deleting a deck or a flashcard. It includes a clear warning message and "Confirm" / "Cancel" buttons.
-   **`CreateDeckModal`:** A modal form for creating a new deck. Contains a single text input for the deck name.
-   **`EditFlashcardModal`:** A modal form for editing an existing flashcard. Contains two text areas for the card's front and back content.
-   **`Toast`:** A non-intrusive notification component used to provide feedback for API operations (e.g., "Deck created successfully," "Error: Daily limit exceeded").
-   **`Breadcrumb`:** A navigation component that displays the user's path through the application, allowing them to navigate back to parent pages.
-   **`DataTable`:** A generic, reusable table component used to display lists of data, such as flashcards in a deck or drafts for review. It will support sorting, filtering, and row selection.