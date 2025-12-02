import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage successfully", async ({ page }) => {
    // Navigate to the homepage
    await page.goto("/");

    // Check that the page loads
    await expect(page).toHaveTitle(/10x-cards|Flashcard/i);

    // Check for key elements on the homepage
    // This will need to be updated based on your actual homepage content
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
  });

  test("should have navigation links", async ({ page }) => {
    await page.goto("/");

    // Check for login/register links
    const loginLink = page.getByRole("link", { name: /login|sign in/i });
    const registerLink = page.getByRole("link", { name: /register|sign up/i });

    // At least one of these should be present
    const hasAuthLinks = (await loginLink.count()) > 0 || (await registerLink.count()) > 0;
    expect(hasAuthLinks).toBe(true);
  });

  test("should be accessible", async ({ page }) => {
    await page.goto("/");

    // Check basic accessibility properties
    // This is a placeholder - you may want to add axe-core for full a11y testing
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });
});

test.describe("Authentication Pages", () => {
  test("should navigate to login page", async ({ page }) => {
    await page.goto("/auth/login");

    // Check for login form
    await expect(page).toHaveURL(/\/auth\/login/);

    // Check for email and password inputs
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("should navigate to register page", async ({ page }) => {
    await page.goto("/auth/register");

    // Check for register form
    await expect(page).toHaveURL(/\/auth\/register/);

    // Check for form inputs
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });
});
