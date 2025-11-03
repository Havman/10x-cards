# View Implementation Plan: AI Generation

## 1. Overview
This document outlines the implementation plan for the AI Generation view. The primary purpose of this view is to provide users with an interface to generate flashcards automatically from a piece of raw text using an AI service. The view features a form where users can input text, specify the maximum number of cards to generate, and see their current usage quota. Upon successful generation, the generated flashcards are displayed in a grid below the form on the same page, where users can review, edit, accept, or reject individual cards or perform bulk actions.

**Note:** The AI generation is currently mocked for UI testing purposes and returns generic flashcard data.

## 2. View Routing
The AI Generation view will be accessible at the following dynamic path:
- **Path:** `/decks/[deck_id]/generate`
- **File Location:** `src/pages/decks/[deck_id]/generate.astro`

The `[deck_id]` parameter will be extracted from the URL to associate the generated flashcards with the correct deck.

## 3. Component Structure
The view will be composed of a main Astro page that renders client-side React components for handling interactivity and state.

```
- src/pages/decks/[deck_id]/generate.astro (AIGenerationView)
  - components/Layout.astro
    - components/Breadcrumb (inline)
    - components/ai/AIGenerationForm.tsx
      - components/ui/Alert.tsx (usage display)
      - components/ui/Textarea.tsx (text input)
      - components/ui/Input.tsx (max cards)
      - components/ui/Button.tsx (generate button)
      - components/ai/FlashcardGrid.tsx (results display)
        - components/ui/Card.tsx (flashcard container)
        - components/ui/Button.tsx (action buttons)
        - components/ui/Textarea.tsx (for editing)
        - components/ui/Label.tsx (for editing)
```

## 4. Component Details

### `AIGenerationView.astro`
- **Component Description:** This is the main Astro page for the view. It serves as the entry point, sets up the overall page layout, and renders the interactive form component. It will extract the `deck_id` from the URL and pass it to the React component.
- **Main Elements:**
  - `Layout.astro`: The standard application layout.
  - `Breadcrumb`: A navigation component to show the user's location (e.g., `Decks > {Deck Name} > Generate`).
  - `AIGenerationForm`: The client-side interactive React component.
- **Handled Interactions:** None directly. It delegates all user interactions to the child React component.
- **Handled Validation:** None.
- **Types:** None.
- **Props:**
  - `deck_id: number`: Passed to the `AIGenerationForm` component.

### `AIGenerationForm.tsx`
- **Component Description:** A client-side React component that manages the state and logic for the AI generation form. It handles data fetching for the user's AI usage, form input, validation, submission, and displays the generated flashcards below the form.
- **Main Elements:**
  - `Alert`: Displays the user's remaining AI generation quota (`{remaining} / {daily_limit} generations left today`).
  - `Textarea`: For the user to paste the raw text to be converted into flashcards.
  - `Input`: A number input for the user to specify `max_cards`.
  - `Button`: The "Generate Flashcards" submission button. Shows loading state and is disabled during the API call.
  - `FlashcardGrid`: Component that displays generated flashcards in a grid layout (appears after successful generation).
- **Handled Interactions:**
  - **Form Input:** Updates component state as the user types in the `Textarea` or changes the `Input` value.
  - **Form Submission:** On button click, validates the form data and sends a `POST` request to `/api/ai/generate`.
  - **Results Display:** Upon successful generation, stores the flashcards in state and displays them below the form.
- **Handled Validation:**
  - **Text:** Must be between 1000 and 10,000 characters. Error messages shown if invalid.
  - **Max Cards:** Must be between 1 and 50. Error messages shown if invalid.
  - **Submission Button:** Disabled if form is invalid, already submitting, or no AI usage remaining.

### `FlashcardGrid.tsx` (NEW)
- **Component Description:** A React component that displays generated AI flashcards in a responsive 3-column grid. Provides selection, editing, and action capabilities for individual and bulk card management.
- **Main Elements:**
  - **Bulk Actions Bar:** Contains "Select All" checkbox and bulk action buttons (visible when cards are selected).
  - **Flashcard Cards:** Grid of cards (1 column mobile, 2 tablet, 3 desktop) with:
    - Selection checkbox (top-left)
    - Front text display/editor
    - Back text display/editor
    - Action buttons (Edit/Save/Cancel and Accept/Reject)
- **Handled Interactions:**
  - **Selection:** Individual checkbox toggle and "Select All" toggle.
  - **Edit Mode:** Click "Edit" to switch to edit mode with textareas for front/back.
  - **Save/Cancel:** Save changes or cancel editing.
  - **Accept:** Removes card from draft list (simulates accepting into deck).
  - **Reject:** Removes card from the list.
  - **Bulk Accept:** Accepts all selected cards and removes them from view.
  - **Bulk Reject:** Rejects all selected cards and removes them from view.
- **State Management:**
  - Maintains local copy of flashcards array for real-time updates.
  - Tracks which cards are selected via Set<number>.
  - Tracks which card (if any) is being edited.
  - Stores edited front/back text during edit mode.
- **Types:**
  - `FlashcardGridProps`: `{ flashcards: AIGeneratedFlashcard[]; onCardsChange?: (cards: AIGeneratedFlashcard[]) => void }`
- **Props:**
  - `flashcards`: Array of generated flashcards to display
  - `onCardsChange` (optional): Callback when cards are modified (for parent component tracking)
- **Handled Validation:**
  - **Text:** Must be between 1000 and 10,000 characters. An error message is shown if the condition is not met.
  - **Max Cards:** Must be between 1 and 50. An error message is shown if the condition is not met.
  - **Submission Button:** The button is disabled if the form is invalid or if a submission is already in progress.
- **Types:**
  - `AIGenerationFormProps`
  - `AIGenerationFormViewModel`
  - `AIUsageResponse`
  - `AIGenerateRequest`
  - `AIGenerateResponse`
- **Props:**
  - `deck_id: number`: The ID of the deck to which the generated cards will be added.

## 5. Types

### DTOs (from `src/types.ts`)
- `AIGenerateRequest`: The request payload for `POST /api/ai/generate`.
- `AIGenerateResponse`: The success response from `POST /api/ai/generate`.
- `AIUsageResponse`: The success response from `GET /api/ai/usage`.
- `ApiErrorResponse`: The standard structure for API errors.

### ViewModels and Props
```typescript
// Props for the main React component
export interface AIGenerationFormProps {
  deck_id: number;
}

// ViewModel for managing the form's state
export interface AIGenerationFormViewModel {
  text: string;
  max_cards: number;
  usage: {
    limit: number;
    remaining: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}
```

## 6. State Management
State will be managed locally within the `AIGenerationForm.tsx` component using React's `useState` and `useEffect` hooks. A custom hook, `useAIGenerationForm`, is recommended to encapsulate the logic for fetching AI usage, managing form state, handling validation, and processing the form submission.

- **`useAIGenerationForm(deck_id: number)`:**
  - **State:** Manages the `AIGenerationFormViewModel`.
  - **`useEffect`:** Fetches AI usage data from `GET /api/ai/usage` when the component mounts.
  - **Functions:**
    - `handleTextChange`: Updates the `text` state.
    - `handleMaxCardsChange`: Updates the `max_cards` state.
    - `handleSubmit`: Performs validation and calls the `POST /api/ai/generate` endpoint. Manages `isLoading` and `error` states. Redirects the user upon success.

## 7. API Integration
The view interacts with two API endpoints:

1.  **`GET /api/ai/usage`**
    - **Action:** Called when the `AIGenerationForm` component mounts.
    - **Purpose:** To fetch the user's daily AI generation limit and current usage.
    - **Response Type:** `ApiSuccessResponse<AIUsageResponse>` or `ApiErrorResponse`.
    - **Handling:** The fetched data is displayed in the `Alert` component. If the `remaining` count is 0, the form submission button is disabled.

2.  **`POST /api/ai/generate`** *(Currently Mocked)*
    - **Action:** Called when the user submits the form.
    - **Purpose:** To generate flashcards from the user's text.
    - **Request Type:** `AIGenerateRequest` (`{ text: string, deck_id: number, max_cards?: number }`)
    - **Response Type:** `ApiSuccessResponse<AIGenerateResponse>` or `ApiErrorResponse`.
    - **Current Implementation:** Returns mock flashcard data with generic questions/answers for UI testing.
    - **Mock Response Format:**
      ```json
      {
        "success": true,
        "data": {
          "generation_id": 123456789,
          "deck_id": 1,
          "flashcards": [
            {
              "id": 123456789,
              "front": "Question 1: This is a sample flashcard question...",
              "back": "Answer 1: This is a sample answer...",
              "status": "draft",
              "source": "ai"
            }
          ],
          "cards_generated": 10
        }
      }
      ```
    - **Handling:**
      - On success (201), the flashcards are stored in component state and displayed below the form via `FlashcardGrid`.
      - The page smoothly scrolls to the results section.
      - On error, an appropriate message is displayed to the user.

## 8. User Interactions

### Form Interactions
- **Page Load:** The user's AI usage is fetched and displayed.
- **Typing in Text Area:** The `text` state is updated. Validation checks are performed in real-time to provide feedback.
- **Changing Max Cards Input:** 
  - The `max_cards` state is updated. 
  - Input accepts only numeric values.
  - Allows backspace/delete for editing.
  - On blur, empty values reset to default (10).
- **Clicking "Generate Flashcards":**
  - The form is validated. If invalid, an error message is shown, and the request is blocked.
  - If valid, the button enters a loading state, and the API request is sent.
  - If the API call is successful, generated cards appear below the form.
  - If the API call fails, the loading state is removed, and an error message is displayed.

### Flashcard Grid Interactions
- **Individual Selection:** Click checkbox on any card to select/deselect it.
- **Select All:** Click "Select all" checkbox in the bulk actions bar to toggle all cards.
- **Edit Card:**
  1. Click "Edit" button on a card
  2. Card switches to edit mode with textareas for front and back
  3. Selection checkbox is disabled during editing
  4. Click "Save" to apply changes or "Cancel" to discard
- **Accept Card:** Click "Accept" button to remove card from drafts (simulates accepting into deck).
- **Reject Card:** Click "Reject" button to remove card from the list.
- **Bulk Accept:** Select multiple cards and click "Accept Selected (N)" to accept all selected cards at once.
- **Bulk Reject:** Select multiple cards and click "Reject Selected (N)" to reject all selected cards at once.

## 9. Conditions and Validation
- **AI Usage:** The form will be disabled if the user has no remaining generations (`usage.remaining <= 0`).
- **Text Input:**
  - **Component:** `Textarea`
  - **Condition:** `text.length >= 1000 && text.length <= 10000`
  - **Effect:** If the condition is false, a descriptive error message is displayed below the textarea, and the submit button is disabled.
- **Max Cards Input:**
  - **Component:** `Input`
  - **Condition:** `max_cards >= 1 && max_cards <= 50`
  - **Effect:** If the condition is false, an error message is displayed, and the submit button is disabled.

## 10. Error Handling
- **API Fetch Errors (e.g., network failure):** A generic error message will be displayed in an `Alert` component (e.g., "Failed to connect to the server. Please try again later.").
- **`GET /api/ai/usage` Failure:** An error message is shown in place of the usage information (e.g., "Could not load usage data."). The form may be disabled as a precaution.
- **`POST /api/ai/generate` Specific Errors:**
  - **400 `INVALID_INPUT`:** The corresponding form field will be highlighted with the error message from the API.
  - **403 `DAILY_LIMIT_EXCEEDED`:** A prominent error message is displayed, and the form is disabled.
  - **404 `NOT_FOUND`:** A generic error is shown, indicating the deck may no longer exist, with a suggestion to return to the dashboard.
  - **503 `AI_SERVICE_ERROR`:** An error message is shown, informing the user that the AI service is temporarily down and to try again later.

## 11. Implementation Steps
1.  **Create Astro Page:** Create the file `src/pages/decks/[deck_id]/generate.astro`. Set up the `Layout` and `Breadcrumb` components. Extract `deck_id` from `Astro.params`.
2.  **Create React Component:** Create the file `src/components/ai/AIGenerationForm.tsx`. Define the component structure with Shadcn/ui components (`Alert`, `Textarea`, `Input`, `Button`).
3.  **Define Types:** Add the `AIGenerationFormProps` and `AIGenerationFormViewModel` types to a relevant types file or within the component file.
4.  **Implement State Management:** Create the `useAIGenerationForm` custom hook. Implement the state variables and handlers for form inputs.
5.  **Fetch AI Usage:** In the custom hook, add a `useEffect` to call `GET /api/ai/usage` on component mount. Update the state with the response and handle potential errors.
6.  **Implement Form Validation:** Add logic to validate the `text` and `max_cards` fields based on the constraints. Use the validation state to disable the submit button and show error messages.
7.  **Implement Form Submission:** Create the `handleSubmit` function that calls `POST /api/ai/generate`. Set the `isLoading` state during the request.
8.  **Handle API Responses:**
    - On success, use Astro's `Astro.redirect` or a client-side router to navigate to the drafts review page.
    - On failure, parse the `ApiErrorResponse` and display the appropriate error message to the user.
9.  **Connect Page and Component:** In `generate.astro`, render the `AIGenerationForm` component, passing the `deck_id` as a prop and marking it for client-side rendering with `client:load`.
10. **Refine UI and UX:** Ensure loading indicators are clear, error messages are helpful, and the form is accessible (e.g., all inputs have labels).
