# Page Object Model (POM) for E2E Testing

This directory contains Page Object Model classes for end-to-end testing with Playwright, following the guidelines in `.cursor/rules/playwright-e2e-testing.mdc`.

## Structure

```
e2e/
├── page-objects/
│   ├── BasePage.ts           # Base class with common functionality
│   ├── AIGenerationPage.ts   # Page object for AI generation form
│   ├── FlashcardGridPage.ts  # Page object for flashcard grid component
│   └── index.ts              # Centralized exports
├── ai-generation.spec.ts     # Example E2E tests
└── example.spec.ts           # Original example tests
```

## Page Objects

### BasePage

Base class providing common functionality for all page objects:

- Element location by `data-test-id`
- Common assertions (visibility, enabled state, text content)
- Navigation helpers
- Wait utilities

**Key Methods:**
- `getByTestId(testId)` - Get element by data-test-id
- `clickByTestId(testId)` - Click element
- `fillByTestId(testId, value)` - Fill input
- `expectVisible(testId)` - Assert visibility
- `expectEnabled(testId)` - Assert enabled state

### AIGenerationPage

Page object for the AI flashcard generation form (`/decks/{id}/generate`).

**Key Methods:**
- `navigateToDeckGeneration(deckId)` - Navigate to generation page
- `enterText(text)` - Fill the text input
- `setMaxCards(count)` - Set maximum cards
- `clickGenerate()` - Click generate button
- `generateFlashcards(text, maxCards)` - Complete form submission
- `waitForGeneration()` - Wait for cards to be generated
- `expectGenerateButtonEnabled/Disabled()` - Assert button state

**Properties:**
- `textInput` - Textarea locator
- `maxCardsInput` - Number input locator
- `generateButton` - Submit button locator
- `flashcardGrid` - FlashcardGridPage instance

### FlashcardGridPage

Page object for the flashcard grid component displaying generated cards.

**Key Methods:**
- `getFlashcardCount()` - Count displayed cards
- `selectFlashcard(cardId)` - Select a specific card
- `clickSelectAll()` - Toggle select all
- `editFlashcard(cardId, front, back)` - Edit a card
- `acceptFlashcard(cardId)` - Accept a single card
- `rejectFlashcard(cardId)` - Reject a single card
- `clickBulkAccept()` - Accept selected cards
- `clickBulkReject()` - Reject selected cards
- `getFlashcardFrontText(cardId)` - Get front text
- `getFlashcardBackText(cardId)` - Get back text
- `expectFlashcardCount(count)` - Assert card count
- `waitForFlashcardRemoved(cardId)` - Wait for card removal

## Usage Example

```typescript
import { test } from "@playwright/test";
import { AIGenerationPage } from "./page-objects/AIGenerationPage";

test("should generate flashcards", async ({ page }) => {
  // Arrange
  const aiPage = new AIGenerationPage(page);
  await aiPage.navigateToDeckGeneration(1);
  const sampleText = "Your text here...".repeat(50); // 1000+ chars

  // Act
  await aiPage.generateFlashcards(sampleText, 15);
  await aiPage.waitForGeneration();

  // Assert
  await aiPage.expectGeneratedCardsVisible();
  const cardCount = await aiPage.flashcardGrid.getFlashcardCount();
  expect(cardCount).toBeGreaterThan(0);
});
```

## Test Data IDs

All components use `data-test-id` attributes for resilient selectors:

### AI Generation Form
- `ai-text-input` - Text textarea
- `ai-max-cards-input` - Max cards input
- `ai-generate-button` - Generate button
- `generated-cards-container` - Results container

### Flashcard Grid
- `flashcard-grid` - Main container
- `bulk-actions-bar` - Bulk actions toolbar
- `select-all-checkbox` - Select all checkbox
- `bulk-accept-button` - Bulk accept button
- `bulk-reject-button` - Bulk reject button
- `flashcards-grid-container` - Cards grid
- `flashcard-item-{id}` - Individual card
- `flashcard-checkbox-{id}` - Card checkbox
- `flashcard-front-{id}` - Front text
- `flashcard-back-{id}` - Back text
- `flashcard-edit-{id}` - Edit button
- `flashcard-accept-{id}` - Accept button
- `flashcard-reject-{id}` - Reject button
- `flashcard-front-edit-{id}` - Front edit textarea
- `flashcard-back-edit-{id}` - Back edit textarea
- `flashcard-save-edit-{id}` - Save button
- `flashcard-cancel-edit-{id}` - Cancel button

## Testing Approach

All tests follow the **Arrange-Act-Assert (AAA)** pattern:

```typescript
test("example test", async ({ page }) => {
  // Arrange: Set up test conditions
  const aiPage = new AIGenerationPage(page);
  await aiPage.navigateToDeckGeneration(1);
  
  // Act: Perform the action
  await aiPage.enterText(SAMPLE_TEXT);
  await aiPage.clickGenerate();
  
  // Assert: Verify the outcome
  await aiPage.expectGeneratedCardsVisible();
});
```

## Best Practices

1. **Use Page Objects** - Never interact with elements directly in tests
2. **Follow AAA Pattern** - Structure tests clearly with Arrange-Act-Assert
3. **Use data-test-id** - Prefer `getByTestId()` over CSS/XPath selectors
4. **Wait Explicitly** - Use `waitFor*()` methods instead of arbitrary timeouts
5. **Compose Page Objects** - `AIGenerationPage` includes `FlashcardGridPage`
6. **Descriptive Test Names** - Clearly state what is being tested
7. **Isolated Tests** - Each test should be independent
8. **Cleanup** - Use `beforeEach` and `afterEach` for setup/teardown

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/ai-generation.spec.ts

# Run in headed mode
npx playwright test --headed

# Run with UI mode
npx playwright test --ui

# Debug a specific test
npx playwright test --debug

# Generate test code
npx playwright codegen http://localhost:4321
```

## Debugging

Use the Playwright trace viewer for debugging failed tests:

```bash
npx playwright show-trace trace.zip
```

Traces are automatically captured on first retry (configured in `playwright.config.ts`).
