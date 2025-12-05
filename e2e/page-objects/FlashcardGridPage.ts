/**
 * FlashcardGridPage
 * Page Object Model for Flashcard Grid Component
 * Handles interactions with generated flashcards display and actions
 */

import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class FlashcardGridPage extends BasePage {
  // Test IDs for grid elements
  private readonly flashcardGridTestId = "flashcard-grid";
  private readonly bulkActionsBarTestId = "bulk-actions-bar";
  private readonly selectAllCheckboxTestId = "select-all-checkbox";
  private readonly bulkAcceptButtonTestId = "bulk-accept-button";
  private readonly bulkRejectButtonTestId = "bulk-reject-button";
  private readonly flashcardsGridContainerTestId = "flashcards-grid-container";

  /**
   * Get the flashcard grid container
   */
  get gridContainer() {
    return this.getByTestId(this.flashcardGridTestId);
  }

  /**
   * Get the bulk actions bar
   */
  get bulkActionsBar() {
    return this.getByTestId(this.bulkActionsBarTestId);
  }

  /**
   * Get the select all checkbox
   */
  get selectAllCheckbox() {
    return this.getByTestId(this.selectAllCheckboxTestId);
  }

  /**
   * Get the bulk accept button
   */
  get bulkAcceptButton() {
    return this.getByTestId(this.bulkAcceptButtonTestId);
  }

  /**
   * Get the bulk reject button
   */
  get bulkRejectButton() {
    return this.getByTestId(this.bulkRejectButtonTestId);
  }

  /**
   * Get the flashcards grid container (where cards are displayed)
   */
  get flashcardsContainer() {
    return this.getByTestId(this.flashcardsGridContainerTestId);
  }

  /**
   * Get a specific flashcard item by card ID
   */
  getFlashcardItem(cardId: number): Locator {
    return this.getByTestId(`flashcard-item-${cardId}`);
  }

  /**
   * Get checkbox for a specific flashcard
   */
  getFlashcardCheckbox(cardId: number): Locator {
    return this.getByTestId(`flashcard-checkbox-${cardId}`);
  }

  /**
   * Get front text of a specific flashcard
   */
  getFlashcardFront(cardId: number): Locator {
    return this.getByTestId(`flashcard-front-${cardId}`);
  }

  /**
   * Get back text of a specific flashcard
   */
  getFlashcardBack(cardId: number): Locator {
    return this.getByTestId(`flashcard-back-${cardId}`);
  }

  /**
   * Get edit button for a specific flashcard
   */
  getFlashcardEditButton(cardId: number): Locator {
    return this.getByTestId(`flashcard-edit-${cardId}`);
  }

  /**
   * Get accept button for a specific flashcard
   */
  getFlashcardAcceptButton(cardId: number): Locator {
    return this.getByTestId(`flashcard-accept-${cardId}`);
  }

  /**
   * Get reject button for a specific flashcard
   */
  getFlashcardRejectButton(cardId: number): Locator {
    return this.getByTestId(`flashcard-reject-${cardId}`);
  }

  /**
   * Get front edit textarea for a specific flashcard (when editing)
   */
  getFlashcardFrontEdit(cardId: number): Locator {
    return this.getByTestId(`flashcard-front-edit-${cardId}`);
  }

  /**
   * Get back edit textarea for a specific flashcard (when editing)
   */
  getFlashcardBackEdit(cardId: number): Locator {
    return this.getByTestId(`flashcard-back-edit-${cardId}`);
  }

  /**
   * Get save edit button for a specific flashcard
   */
  getFlashcardSaveEditButton(cardId: number): Locator {
    return this.getByTestId(`flashcard-save-edit-${cardId}`);
  }

  /**
   * Get cancel edit button for a specific flashcard
   */
  getFlashcardCancelEditButton(cardId: number): Locator {
    return this.getByTestId(`flashcard-cancel-edit-${cardId}`);
  }

  /**
   * Get all flashcard items
   */
  getAllFlashcardItems(): Locator {
    return this.page.locator('[data-test-id^="flashcard-item-"]');
  }

  /**
   * Count the number of flashcards displayed
   */
  async getFlashcardCount(): Promise<number> {
    return this.getAllFlashcardItems().count();
  }

  /**
   * Click select all checkbox
   */
  async clickSelectAll(): Promise<void> {
    await this.selectAllCheckbox.click();
  }

  /**
   * Select a specific flashcard
   */
  async selectFlashcard(cardId: number): Promise<void> {
    await this.getFlashcardCheckbox(cardId).click();
  }

  /**
   * Click bulk accept button
   */
  async clickBulkAccept(): Promise<void> {
    await this.bulkAcceptButton.click();
  }

  /**
   * Click bulk reject button
   */
  async clickBulkReject(): Promise<void> {
    await this.bulkRejectButton.click();
  }

  /**
   * Edit a flashcard
   */
  async editFlashcard(cardId: number, newFront: string, newBack: string): Promise<void> {
    await this.getFlashcardEditButton(cardId).click();
    await this.getFlashcardFrontEdit(cardId).fill(newFront);
    await this.getFlashcardBackEdit(cardId).fill(newBack);
    await this.getFlashcardSaveEditButton(cardId).click();
  }

  /**
   * Accept a specific flashcard
   */
  async acceptFlashcard(cardId: number): Promise<void> {
    await this.getFlashcardAcceptButton(cardId).click();
  }

  /**
   * Reject a specific flashcard
   */
  async rejectFlashcard(cardId: number): Promise<void> {
    await this.getFlashcardRejectButton(cardId).click();
  }

  /**
   * Get the front text content of a flashcard
   */
  async getFlashcardFrontText(cardId: number): Promise<string> {
    return (await this.getFlashcardFront(cardId).textContent()) || "";
  }

  /**
   * Get the back text content of a flashcard
   */
  async getFlashcardBackText(cardId: number): Promise<string> {
    return (await this.getFlashcardBack(cardId).textContent()) || "";
  }

  /**
   * Check if a flashcard is selected
   */
  async isFlashcardSelected(cardId: number): Promise<boolean> {
    return this.getFlashcardCheckbox(cardId).isChecked();
  }

  /**
   * Check if bulk actions are visible
   */
  async areBulkActionsVisible(): Promise<boolean> {
    return this.bulkAcceptButton.isVisible();
  }

  /**
   * Assert grid is visible
   */
  async expectGridVisible(): Promise<void> {
    await expect(this.gridContainer).toBeVisible();
  }

  /**
   * Assert specific number of flashcards
   */
  async expectFlashcardCount(count: number): Promise<void> {
    await expect(this.getAllFlashcardItems()).toHaveCount(count);
  }

  /**
   * Assert flashcard has specific front text
   */
  async expectFlashcardFrontText(cardId: number, text: string | RegExp): Promise<void> {
    await expect(this.getFlashcardFront(cardId)).toHaveText(text);
  }

  /**
   * Assert flashcard has specific back text
   */
  async expectFlashcardBackText(cardId: number, text: string | RegExp): Promise<void> {
    await expect(this.getFlashcardBack(cardId)).toHaveText(text);
  }

  /**
   * Assert flashcard is visible
   */
  async expectFlashcardVisible(cardId: number): Promise<void> {
    await expect(this.getFlashcardItem(cardId)).toBeVisible();
  }

  /**
   * Assert flashcard is not visible
   */
  async expectFlashcardHidden(cardId: number): Promise<void> {
    await expect(this.getFlashcardItem(cardId)).toBeHidden();
  }

  /**
   * Assert bulk accept button is visible
   */
  async expectBulkAcceptVisible(): Promise<void> {
    await expect(this.bulkAcceptButton).toBeVisible();
  }

  /**
   * Assert bulk accept button is hidden
   */
  async expectBulkAcceptHidden(): Promise<void> {
    await expect(this.bulkAcceptButton).toBeHidden();
  }

  /**
   * Assert flashcard is checked
   */
  async expectFlashcardChecked(cardId: number): Promise<void> {
    await expect(this.getFlashcardCheckbox(cardId)).toBeChecked();
  }

  /**
   * Assert flashcard is not checked
   */
  async expectFlashcardNotChecked(cardId: number): Promise<void> {
    await expect(this.getFlashcardCheckbox(cardId)).not.toBeChecked();
  }

  /**
   * Wait for a flashcard to be removed (e.g., after accept/reject)
   */
  async waitForFlashcardRemoved(cardId: number, timeout = 5000): Promise<void> {
    await this.getFlashcardItem(cardId).waitFor({ state: "hidden", timeout });
  }

  /**
   * Wait for flashcards to load
   */
  async waitForFlashcardsLoaded(timeout = 10000): Promise<void> {
    await this.gridContainer.waitFor({ state: "visible", timeout });
  }
}
