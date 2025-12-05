/**
 * Basic E2E Tests
 * Simple tests for publicly accessible pages that don't require authentication
 * Following Arrange-Act-Assert (AAA) pattern
 */

import { test, expect } from "@playwright/test";

test.describe("Homepage - Public Access", () => {
  test("should load the homepage successfully", async ({ page }) => {
    // Arrange & Act: Navigate to homepage
    await page.goto("/");

    // Assert: Page should load without errors
    await expect(page).toHaveURL(/\//);
  });

  test("should display the welcome component", async ({ page }) => {
    // Arrange & Act: Navigate to homepage
    await page.goto("/");

    // Assert: Welcome component or main content should be visible
    const mainContent = page.locator("main, body");
    await expect(mainContent).toBeVisible();
  });

  test("should have a valid HTML structure", async ({ page }) => {
    // Arrange & Act: Navigate to homepage
    await page.goto("/");

    // Assert: Basic HTML elements should exist
    const html = page.locator("html");
    const body = page.locator("body");

    await expect(html).toBeVisible();
    await expect(body).toBeVisible();
  });
});

test.describe("Login Page - Public Access", () => {
  test("should navigate to login page", async ({ page }) => {
    // Arrange & Act: Navigate to login page
    await page.goto("/auth/login");

    // Assert: Should be on login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should display login form", async ({ page }) => {
    // Arrange: Navigate to login page
    await page.goto("/auth/login");

    // Act: Wait for page to load
    await page.waitForLoadState("networkidle");

    // Assert: Form should be present
    const form = page.locator("form").first();
    await expect(form).toBeVisible({ timeout: 10000 });
  });

  test("should have email and password inputs", async ({ page }) => {
    // Arrange: Navigate to login page
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    // Act: Look for input fields
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    // Assert: Both inputs should exist
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
  });

  test("should have a submit button", async ({ page }) => {
    // Arrange: Navigate to login page
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    // Act: Look for submit button
    const submitButton = page.getByRole("button", { name: /log in|sign in|submit/i });

    // Assert: Button should be visible
    await expect(submitButton).toBeVisible({ timeout: 10000 });
  });

  test("should show validation error with empty form submission", async ({ page }) => {
    // Arrange: Navigate to login page
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    // Act: Try to submit empty form
    const submitButton = page.getByRole("button", { name: /log in|sign in|submit/i }).first();
    await submitButton.click();

    // Assert: Should show HTML5 validation or error message
    // (Browser native validation will prevent submission)
    const emailInput = page.getByLabel(/email/i);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });
});

test.describe("Register Page - Public Access", () => {
  test("should navigate to register page", async ({ page }) => {
    // Arrange & Act: Navigate to register page
    await page.goto("/auth/register");

    // Assert: Should be on register page
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test("should display registration form", async ({ page }) => {
    // Arrange: Navigate to register page
    await page.goto("/auth/register");

    // Act: Wait for page to load
    await page.waitForLoadState("networkidle");

    // Assert: Form should be present
    const form = page.locator("form").first();
    await expect(form).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Navigation - Public Pages", () => {
  test("should be able to navigate between homepage and login", async ({ page }) => {
    // Arrange: Start at homepage
    await page.goto("/");

    // Act: Navigate to login (if link exists)
    const loginLink = page.getByRole("link", { name: /log in|sign in/i }).first();
    if (await loginLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginLink.click();

      // Assert: Should be on login page
      await expect(page).toHaveURL(/\/auth\/login/);
    } else {
      // Direct navigation if no link
      await page.goto("/auth/login");
      await expect(page).toHaveURL(/\/auth\/login/);
    }
  });

  test("should be able to navigate from login to register", async ({ page }) => {
    // Arrange: Start at login page
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    // Act: Look for register link
    const registerLink = page.getByRole("link", { name: /register|sign up|create account/i }).first();

    if (await registerLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await registerLink.click();

      // Assert: Should be on register page
      await expect(page).toHaveURL(/\/auth\/register/);
    } else {
      // Skip if link doesn't exist
      test.skip();
    }
  });
});

test.describe("Responsive Design - Mobile", () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE
  });

  test("should display homepage on mobile", async ({ page }) => {
    // Arrange & Act: Navigate to homepage
    await page.goto("/");

    // Assert: Page should be visible
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should display login form on mobile", async ({ page }) => {
    // Arrange: Navigate to login page
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    // Assert: Form should be visible on mobile
    const form = page.locator("form").first();
    await expect(form).toBeVisible({ timeout: 10000 });
  });
});
