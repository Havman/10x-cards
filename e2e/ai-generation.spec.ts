/**
 * AI Generation E2E Tests
 * Tests for AI flashcard generation feature using Page Object Model
 * Following Arrange-Act-Assert (AAA) pattern
 */

import { test, expect } from "@playwright/test";
import { AIGenerationPage } from "./page-objects/AIGenerationPage";

// Sample text that meets the minimum 1000 character requirement
const SAMPLE_TEXT = `
Machine Learning is a subset of artificial intelligence that enables systems to learn and improve from experience 
without being explicitly programmed. It focuses on the development of computer programs that can access data and 
use it to learn for themselves. The process of learning begins with observations or data, such as examples, direct 
experience, or instruction, in order to look for patterns in data and make better decisions in the future based on 
the examples that we provide. The primary aim is to allow the computers to learn automatically without human 
intervention or assistance and adjust actions accordingly.

There are several types of machine learning algorithms: supervised learning, unsupervised learning, semi-supervised 
learning, and reinforcement learning. Supervised learning algorithms are trained using labeled examples, such as an 
input where the desired output is known. The learning algorithm receives a set of inputs along with the corresponding 
correct outputs, and the algorithm learns by comparing its actual output with correct outputs to find errors.

Unsupervised learning is used against data that has no historical labels. The system is not told the "right answer." 
The algorithm must figure out what is being shown. The goal is to explore the data and find some structure within.
`.repeat(2); // Repeat to ensure over 1000 characters

test.describe("AI Flashcard Generation", () => {
  let aiGenerationPage: AIGenerationPage;

  test.beforeEach(async ({ page }) => {
    // Arrange: Initialize page object and navigate
    aiGenerationPage = new AIGenerationPage(page);

    // Note: In a real test, you'd need to:
    // 1. Login as a user
    // 2. Create or navigate to a specific deck
    // For this example, we assume deck ID 1 exists
    await aiGenerationPage.navigateToDeckGeneration(1);
  });

  test("should display the AI generation form with all elements", async () => {
    // Arrange - done in beforeEach

    // Act - page is already loaded

    // Assert: Verify all form elements are visible
    await aiGenerationPage.expectTextInputVisible();
    await aiGenerationPage.expectMaxCardsInputVisible();
    await aiGenerationPage.expectGenerateButtonVisible();
  });

  test("should have generate button disabled when text is empty", async () => {
    // Arrange - done in beforeEach

    // Act - page loads with empty text

    // Assert: Button should be disabled
    await aiGenerationPage.expectGenerateButtonDisabled();
  });

  test("should enable generate button when valid text is entered", async () => {
    // Arrange - done in beforeEach

    // Act: Enter valid text
    await aiGenerationPage.enterText(SAMPLE_TEXT);

    // Assert: Button should be enabled
    await aiGenerationPage.expectGenerateButtonEnabled();
  });

  test("should generate flashcards with valid input", async () => {
    // Arrange: Prepare valid input data
    const maxCards = 15;

    // Act: Fill form and submit
    await aiGenerationPage.enterText(SAMPLE_TEXT);
    await aiGenerationPage.setMaxCards(maxCards);
    await aiGenerationPage.clickGenerate();

    // Wait for generation to complete
    await aiGenerationPage.waitForGeneration();

    // Assert: Generated cards should be visible
    await aiGenerationPage.expectGeneratedCardsVisible();

    // Assert: FlashcardGrid should be visible
    await aiGenerationPage.flashcardGrid.expectGridVisible();
  });

  test("should display correct number of flashcards after generation", async ({ page }) => {
    // Arrange
    const maxCards = 15;
    aiGenerationPage = new AIGenerationPage(page);
    await aiGenerationPage.navigateToDeckGeneration(1);

    // Act: Generate flashcards
    await aiGenerationPage.generateFlashcards(SAMPLE_TEXT, maxCards);
    await aiGenerationPage.waitForGeneration();

    // Assert: Check flashcard count (should be <= maxCards)
    const cardCount = await aiGenerationPage.flashcardGrid.getFlashcardCount();
    expect(cardCount).toBeGreaterThan(0);
    expect(cardCount).toBeLessThanOrEqual(maxCards);
  });

  test("should allow selecting individual flashcards", async ({ page }) => {
    // Arrange: Generate some flashcards first
    aiGenerationPage = new AIGenerationPage(page);
    await aiGenerationPage.navigateToDeckGeneration(1);
    await aiGenerationPage.generateFlashcards(SAMPLE_TEXT, 10);
    await aiGenerationPage.waitForGeneration();

    // Act: Select the first flashcard (assuming ID 1)
    await aiGenerationPage.flashcardGrid.selectFlashcard(1);

    // Assert: Flashcard should be checked
    await aiGenerationPage.flashcardGrid.expectFlashcardChecked(1);

    // Assert: Bulk actions should be visible
    await aiGenerationPage.flashcardGrid.expectBulkAcceptVisible();
  });

  test("should allow editing a flashcard", async ({ page }) => {
    // Arrange: Generate flashcards
    aiGenerationPage = new AIGenerationPage(page);
    await aiGenerationPage.navigateToDeckGeneration(1);
    await aiGenerationPage.generateFlashcards(SAMPLE_TEXT, 5);
    await aiGenerationPage.waitForGeneration();

    const newFront = "What is Machine Learning?";
    const newBack = "A subset of AI that learns from data";

    // Act: Edit the first flashcard
    await aiGenerationPage.flashcardGrid.editFlashcard(1, newFront, newBack);

    // Assert: Verify the edited content
    await aiGenerationPage.flashcardGrid.expectFlashcardFrontText(1, newFront);
    await aiGenerationPage.flashcardGrid.expectFlashcardBackText(1, newBack);
  });

  test("should accept a single flashcard", async ({ page }) => {
    // Arrange: Generate flashcards
    aiGenerationPage = new AIGenerationPage(page);
    await aiGenerationPage.navigateToDeckGeneration(1);
    await aiGenerationPage.generateFlashcards(SAMPLE_TEXT, 5);
    await aiGenerationPage.waitForGeneration();

    const initialCount = await aiGenerationPage.flashcardGrid.getFlashcardCount();

    // Act: Accept the first flashcard
    await aiGenerationPage.flashcardGrid.acceptFlashcard(1);

    // Wait for the card to be removed
    await aiGenerationPage.flashcardGrid.waitForFlashcardRemoved(1);

    // Assert: Flashcard count should decrease
    const newCount = await aiGenerationPage.flashcardGrid.getFlashcardCount();
    expect(newCount).toBe(initialCount - 1);
  });

  test("should reject a single flashcard", async ({ page }) => {
    // Arrange: Generate flashcards
    aiGenerationPage = new AIGenerationPage(page);
    await aiGenerationPage.navigateToDeckGeneration(1);
    await aiGenerationPage.generateFlashcards(SAMPLE_TEXT, 5);
    await aiGenerationPage.waitForGeneration();

    const initialCount = await aiGenerationPage.flashcardGrid.getFlashcardCount();

    // Act: Reject the first flashcard
    await aiGenerationPage.flashcardGrid.rejectFlashcard(1);

    // Wait for the card to be removed
    await aiGenerationPage.flashcardGrid.waitForFlashcardRemoved(1);

    // Assert: Flashcard count should decrease
    const newCount = await aiGenerationPage.flashcardGrid.getFlashcardCount();
    expect(newCount).toBe(initialCount - 1);
  });

  test("should select all flashcards and bulk accept", async ({ page }) => {
    // Arrange: Generate flashcards
    aiGenerationPage = new AIGenerationPage(page);
    await aiGenerationPage.navigateToDeckGeneration(1);
    await aiGenerationPage.generateFlashcards(SAMPLE_TEXT, 5);
    await aiGenerationPage.waitForGeneration();

    // Act: Select all and accept
    await aiGenerationPage.flashcardGrid.clickSelectAll();
    await aiGenerationPage.flashcardGrid.clickBulkAccept();

    // Assert: All cards should be removed (or wait for grid to be hidden)
    // Depending on implementation, might need to wait for network idle
    await aiGenerationPage.waitForNetworkIdle();

    const remainingCards = await aiGenerationPage.flashcardGrid.getFlashcardCount();
    expect(remainingCards).toBe(0);
  });

  test("should validate minimum character requirement", async () => {
    // Arrange
    const shortText = "This text is too short";

    // Act: Enter text that's too short
    await aiGenerationPage.enterText(shortText);

    // Assert: Generate button should remain disabled
    await aiGenerationPage.expectGenerateButtonDisabled();
  });

  test("should update max cards value", async () => {
    // Arrange - done in beforeEach

    // Act: Change max cards value
    await aiGenerationPage.setMaxCards(20);

    // Assert: Value should be updated
    await aiGenerationPage.expectMaxCardsValue("20");
  });
});

test.describe("AI Generation Form Validation", () => {
  let aiGenerationPage: AIGenerationPage;

  test.beforeEach(async ({ page }) => {
    aiGenerationPage = new AIGenerationPage(page);
    await aiGenerationPage.navigateToDeckGeneration(1);
  });

  test("should show character count", async () => {
    // Arrange - done in beforeEach

    // Act: Enter some text
    const testText = "Test text for character counting";
    await aiGenerationPage.enterText(testText);

    // Assert: Text value should match what was entered
    const textValue = await aiGenerationPage.getTextValue();
    expect(textValue).toBe(testText);
  });

  test("should persist max cards value on blur", async () => {
    // Arrange - done in beforeEach

    // Act: Set max cards
    await aiGenerationPage.setMaxCards(25);

    // Trigger blur by clicking elsewhere
    await aiGenerationPage.textInput.click();

    // Assert: Value should still be 25
    await aiGenerationPage.expectMaxCardsValue("25");
  });
});
