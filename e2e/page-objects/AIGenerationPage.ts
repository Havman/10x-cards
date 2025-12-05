/**
 * AIGenerationPage
 * Page Object Model for AI Generation Form
 * Handles interactions with the flashcard generation form
 */

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { FlashcardGridPage } from "./FlashcardGridPage";

export class AIGenerationPage extends BasePage {
  // Test IDs for form elements
  private readonly textInputTestId = "ai-text-input";
  private readonly maxCardsInputTestId = "ai-max-cards-input";
  private readonly generateButtonTestId = "ai-generate-button";
  private readonly generatedCardsContainerTestId = "generated-cards-container";

  // FlashcardGrid component
  readonly flashcardGrid: FlashcardGridPage;

  constructor(page: Page) {
    super(page);
    this.flashcardGrid = new FlashcardGridPage(page);
  }

  /**
   * Navigate to the AI generation page for a specific deck
   */
  async navigateToDeckGeneration(deckId: number): Promise<void> {
    await this.goto(`/decks/${deckId}/generate`);
  }

  /**
   * Get the text input field
   */
  get textInput() {
    return this.getByTestId(this.textInputTestId);
  }

  /**
   * Get the max cards input field
   */
  get maxCardsInput() {
    return this.getByTestId(this.maxCardsInputTestId);
  }

  /**
   * Get the generate button
   */
  get generateButton() {
    return this.getByTestId(this.generateButtonTestId);
  }

  /**
   * Get the generated cards container
   */
  get generatedCardsContainer() {
    return this.getByTestId(this.generatedCardsContainerTestId);
  }

  /**
   * Fill the text input with content
   */
  async enterText(text: string): Promise<void> {
    await this.textInput.fill(text);
  }

  /**
   * Set the maximum number of cards
   */
  async setMaxCards(count: number): Promise<void> {
    await this.maxCardsInput.fill(count.toString());
  }

  /**
   * Click the generate flashcards button
   */
  async clickGenerate(): Promise<void> {
    await this.generateButton.click();
  }

  /**
   * Submit the form with text and max cards
   * Arrange -> Act pattern
   */
  async generateFlashcards(text: string, maxCards: number): Promise<void> {
    await this.enterText(text);
    await this.setMaxCards(maxCards);
    await this.clickGenerate();
  }

  /**
   * Wait for flashcards to be generated
   */
  async waitForGeneration(timeout = 30000): Promise<void> {
    await this.generatedCardsContainer.waitFor({ state: "visible", timeout });
  }

  /**
   * Check if the generate button is enabled
   */
  async isGenerateButtonEnabled(): Promise<boolean> {
    return this.generateButton.isEnabled();
  }

  /**
   * Check if the generate button is disabled
   */
  async isGenerateButtonDisabled(): Promise<boolean> {
    return this.generateButton.isDisabled();
  }

  /**
   * Get the current value of text input
   */
  async getTextValue(): Promise<string> {
    return (await this.textInput.inputValue()) || "";
  }

  /**
   * Get the current value of max cards input
   */
  async getMaxCardsValue(): Promise<string> {
    return (await this.maxCardsInput.inputValue()) || "";
  }

  /**
   * Get the character count text
   */
  async getCharacterCount(): Promise<string> {
    // Character count is displayed but not as a separate test-id element
    // You may need to add a test-id for this if needed
    const textValue = await this.getTextValue();
    return textValue.length.toString();
  }

  /**
   * Assert text input is visible
   */
  async expectTextInputVisible(): Promise<void> {
    await expect(this.textInput).toBeVisible();
  }

  /**
   * Assert max cards input is visible
   */
  async expectMaxCardsInputVisible(): Promise<void> {
    await expect(this.maxCardsInput).toBeVisible();
  }

  /**
   * Assert generate button is visible
   */
  async expectGenerateButtonVisible(): Promise<void> {
    await expect(this.generateButton).toBeVisible();
  }

  /**
   * Assert generate button is enabled
   */
  async expectGenerateButtonEnabled(): Promise<void> {
    await expect(this.generateButton).toBeEnabled();
  }

  /**
   * Assert generate button is disabled
   */
  async expectGenerateButtonDisabled(): Promise<void> {
    await expect(this.generateButton).toBeDisabled();
  }

  /**
   * Assert generated cards container is visible
   */
  async expectGeneratedCardsVisible(): Promise<void> {
    await expect(this.generatedCardsContainer).toBeVisible();
  }

  /**
   * Assert generated cards container is hidden
   */
  async expectGeneratedCardsHidden(): Promise<void> {
    await expect(this.generatedCardsContainer).toBeHidden();
  }

  /**
   * Assert text input has specific value
   */
  async expectTextValue(expectedValue: string): Promise<void> {
    await expect(this.textInput).toHaveValue(expectedValue);
  }

  /**
   * Assert max cards input has specific value
   */
  async expectMaxCardsValue(expectedValue: string): Promise<void> {
    await expect(this.maxCardsInput).toHaveValue(expectedValue);
  }

  /**
   * Wait for the button to show loading state
   */
  async waitForLoadingState(): Promise<void> {
    await expect(this.generateButton).toContainText(/generating/i);
  }

  /**
   * Wait for the button to return to normal state
   */
  async waitForNormalState(): Promise<void> {
    await expect(this.generateButton).toContainText(/generate flashcards/i);
  }

  /**
   * Check if an error message is displayed
   */
  async hasError(): Promise<boolean> {
    // Error messages are shown in a div with role="alert"
    const errorAlert = this.page.locator('[role="alert"]');
    return errorAlert.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    const errorAlert = this.page.locator('[role="alert"]');
    return (await errorAlert.textContent()) || "";
  }
}
