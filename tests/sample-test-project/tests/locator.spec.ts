import { test, expect } from "@playwright/test";
import { createEnhancedLocator } from "playwright-tools";

// Demo test using playwright-tools

test.describe("playwright-tools integration demo", () => {
  test("should use enhanced locator and utilities", async ({ page }) => {
    // Go to a public page
    await page.goto("https://playwright.dev/");

    // Enhance the locator for the heading
    const heading = createEnhancedLocator(page.locator(".hero__title"));

    // Extract data from the heading
    const data = await heading.extractData();
    console.log("Extracted data:", data);
    expect(data.text).toContain("Playwright enables reliable end-to-end testing for modern web apps.");
  });
});
