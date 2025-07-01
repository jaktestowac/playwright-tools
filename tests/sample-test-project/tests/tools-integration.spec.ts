import { test, expect } from "@playwright/test";
import { safeClick, safeFill, fillForm } from "playwright-tools/interactions";
import {
  waitForElements,
  elementExists,
  getTextsFromElements,
  getAttributesFromElements,
  isElementEnabled,
  waitForVisibleWithRetry,
  extractElementData,
} from "playwright-tools/element-queries";
import { expectElementsToBeVisible, expectAll } from "playwright-tools/assertions";
import { createNetworkMonitor, monitorNetworkDuring } from "playwright-tools/network-monitoring";
import { takeTimestampedScreenshot, debugScreenshot } from "playwright-tools/screenshots";
import { retryAction } from "playwright-tools/retry";
import { testDispatcher } from "playwright-tools/test-utils";

// 1. safeClick
// 2. safeFill
// 3. fillForm
// 4. waitForElements
// 5. elementExists
// 6. getTextsFromElements
// 7. expectElementsToBeVisible
// 8. createNetworkMonitor
// 9. takeTimestampedScreenshot
// 10. retryAction

test("safeClick clicks Get Started link", async ({ page }) => {
  await page.goto("https://playwright.dev/");
  const result = await safeClick(page.getByRole("link", { name: "Get started" }));
  expect(result).toBe(true);
  await expect(page.getByRole("heading", { name: "Installation" })).toBeVisible();
});

test("waitForElements waits for multiple elements", async ({ page }) => {
  await page.goto("https://playwright.dev/");
  await waitForElements([page.getByRole("link", { name: "Get started" }), page.getByRole("link", { name: "Docs" })]);
  // If no error, test passes
});

test("elementExists returns true for visible element", async ({ page }) => {
  await page.goto("https://playwright.dev/");
  const exists = await elementExists(page.getByRole("link", { name: "Get started" }));
  expect(exists).toBe(true);
});

test("getTextsFromElements extracts text from nav links", async ({ page }) => {
  await page.goto("https://playwright.dev/");
  const navLinks = [page.getByRole("link", { name: "Get started" }), page.getByRole("link", { name: "Docs" })];
  const texts = await getTextsFromElements(navLinks);
  expect(texts[0]).toContain("Get started");
  expect(texts[1]).toContain("Docs");
});

test("expectElementsToBeVisible asserts multiple elements", async ({ page }) => {
  await page.goto("https://playwright.dev/");
  const locators = [page.getByRole("link", { name: "Get started" }), page.getByRole("link", { name: "Docs" })];
  await expectElementsToBeVisible(locators, expect);
});

test("createNetworkMonitor tracks network requests", async ({ page }) => {
  const monitor = createNetworkMonitor(page);
  await monitor.start();
  await page.goto("https://playwright.dev/");
  await monitor.stop();
  const report = monitor.getReport();
  expect(report.summary.totalRequests).toBeGreaterThan(0);
});

test("takeTimestampedScreenshot saves a screenshot", async ({ page }) => {
  await page.goto("https://playwright.dev/");
  const path = await takeTimestampedScreenshot(page, "playwright-home");
  expect(path).toContain("playwright-home");
});

test("retryAction retries until success", async ({ page }) => {
  await page.goto("https://playwright.dev/");
  let attempts = 0;

  const result = await retryAction(
    async () => {
      // action should succeed on first attempt
      attempts++;
      await safeClick(page.getByRole("link", { name: "Get started" }));
      return "success";
    },
    { maxRetries: 3, baseDelay: 100 },
  );

  expect(result).toBe("success");
  expect(attempts).toBe(1);
});
