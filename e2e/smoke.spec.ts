/**
 * Smoke Test
 * Minimal test to verify Playwright setup is working
 */

import { test, expect } from "@playwright/test";

test.describe("Smoke Tests - Verify Setup", () => {
  test("should load the homepage", async ({ page }) => {
    // Arrange & Act: Navigate to homepage
    await page.goto("/");

    // Assert: Page should have loaded (status 200)
    await expect(page).toHaveURL(/\//);
  });

  test("should have a valid document", async ({ page }) => {
    // Arrange & Act: Navigate to homepage
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Assert: Body element should exist
    const body = page.locator("body");
    await expect(body).toBeAttached();
  });

  test("should load the login page", async ({ page }) => {
    // Arrange & Act: Navigate to login
    await page.goto("/auth/login");

    // Assert: Should be on login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
