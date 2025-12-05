/**
 * BasePage
 * Base class for all Page Objects providing common functionality
 */

import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL path
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Get element by data-test-id attribute (following Playwright guidelines)
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(testId: string, timeout = 5000): Promise<void> {
    await this.getByTestId(testId).waitFor({ state: "visible", timeout });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(testId: string, timeout = 5000): Promise<void> {
    await this.getByTestId(testId).waitFor({ state: "hidden", timeout });
  }

  /**
   * Click element by test id
   */
  async clickByTestId(testId: string): Promise<void> {
    await this.getByTestId(testId).click();
  }

  /**
   * Fill input by test id
   */
  async fillByTestId(testId: string, value: string): Promise<void> {
    await this.getByTestId(testId).fill(value);
  }

  /**
   * Get text content by test id
   */
  async getTextByTestId(testId: string): Promise<string> {
    return (await this.getByTestId(testId).textContent()) || "";
  }

  /**
   * Check if element is visible
   */
  async isVisible(testId: string): Promise<boolean> {
    return this.getByTestId(testId).isVisible();
  }

  /**
   * Check if element is enabled
   */
  async isEnabled(testId: string): Promise<boolean> {
    return this.getByTestId(testId).isEnabled();
  }

  /**
   * Assert element is visible
   */
  async expectVisible(testId: string): Promise<void> {
    await expect(this.getByTestId(testId)).toBeVisible();
  }

  /**
   * Assert element is hidden
   */
  async expectHidden(testId: string): Promise<void> {
    await expect(this.getByTestId(testId)).toBeHidden();
  }

  /**
   * Assert element is enabled
   */
  async expectEnabled(testId: string): Promise<void> {
    await expect(this.getByTestId(testId)).toBeEnabled();
  }

  /**
   * Assert element is disabled
   */
  async expectDisabled(testId: string): Promise<void> {
    await expect(this.getByTestId(testId)).toBeDisabled();
  }

  /**
   * Assert element has text
   */
  async expectToHaveText(testId: string, text: string | RegExp): Promise<void> {
    await expect(this.getByTestId(testId)).toHaveText(text);
  }

  /**
   * Assert element contains text
   */
  async expectToContainText(testId: string, text: string | RegExp): Promise<void> {
    await expect(this.getByTestId(testId)).toContainText(text);
  }

  /**
   * Take a screenshot
   */
  async screenshot(name?: string): Promise<void> {
    await this.page.screenshot({ path: name, fullPage: true });
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait for a specific time (use sparingly, prefer specific waits)
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }
}
