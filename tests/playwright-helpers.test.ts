import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import { Page, Locator } from "@playwright/test";
import {
  safeClick,
  safeFill,
  waitForElements,
  elementExists,
  getTextsFromElements,
  waitForPageLoad,
  takeTimestampedScreenshot,
  expectElementsToBeVisible,
  expectAll,
  getAttributesFromElements,
  waitForTextInAnyElement,
} from "../src/index";

// Mock Playwright modules
vi.mock("@playwright/test", () => ({
  expect: vi.fn(() => ({
    toBeVisible: vi.fn(),
    toBeEnabled: vi.fn(),
    toHaveClass: vi.fn(),
    toHaveValue: vi.fn(),
  })),
}));

describe("Playwright Helpers - Element Interactions", () => {
  let mockLocator: any;
  let mockPage: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLocator = {
      waitFor: vi.fn().mockResolvedValue(undefined),
      click: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      fill: vi.fn().mockResolvedValue(undefined),
      textContent: vi.fn().mockResolvedValue("sample text"),
      getAttribute: vi.fn().mockResolvedValue("sample-attribute"),
    };

    mockPage = {
      waitForLoadState: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe("safeClick", () => {
    test("should wait for element to be visible and then click", async () => {
      await safeClick(mockLocator);

      expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: "visible", timeout: undefined });
      expect(mockLocator.click).toHaveBeenCalledTimes(1);
    });

    test("should use custom timeout when provided", async () => {
      await safeClick(mockLocator, { timeout: 5000 });

      expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: "visible", timeout: 5000 });
      expect(mockLocator.click).toHaveBeenCalledTimes(1);
    });

    test("should throw error if element is not found within timeout", async () => {
      mockLocator.waitFor.mockRejectedValue(new Error("Element not found"));

      await expect(safeClick(mockLocator)).rejects.toThrow("Element not found");
      expect(mockLocator.click).not.toHaveBeenCalled();
    });
  });

  describe("safeFill", () => {
    test("should wait, clear, and fill input field", async () => {
      await safeFill(mockLocator, "test text");

      expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: "visible", timeout: undefined });
      expect(mockLocator.clear).toHaveBeenCalledTimes(1);
      expect(mockLocator.fill).toHaveBeenCalledWith("test text");
    });

    test("should use custom timeout when provided", async () => {
      await safeFill(mockLocator, "test text", { timeout: 3000 });

      expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: "visible", timeout: 3000 });
      expect(mockLocator.clear).toHaveBeenCalledTimes(1);
      expect(mockLocator.fill).toHaveBeenCalledWith("test text");
    });

    test("should handle empty string input", async () => {
      await safeFill(mockLocator, "");

      expect(mockLocator.fill).toHaveBeenCalledWith("");
    });

    test("should throw error if element is not ready", async () => {
      mockLocator.waitFor.mockRejectedValue(new Error("Element not ready"));

      await expect(safeFill(mockLocator, "text")).rejects.toThrow("Element not ready");
      expect(mockLocator.clear).not.toHaveBeenCalled();
      expect(mockLocator.fill).not.toHaveBeenCalled();
    });
  });

  describe("waitForElements", () => {
    test("should wait for multiple elements to be visible", async () => {
      const locators = [mockLocator, { ...mockLocator }, { ...mockLocator }];
      locators.forEach((loc) => {
        loc.waitFor = vi.fn().mockResolvedValue(undefined);
      });

      await waitForElements(locators);

      locators.forEach((locator) => {
        expect(locator.waitFor).toHaveBeenCalledWith({ state: "visible", timeout: undefined });
      });
    });

    test("should use custom timeout for all elements", async () => {
      const locators = [mockLocator, { ...mockLocator }];
      locators.forEach((loc) => {
        loc.waitFor = vi.fn().mockResolvedValue(undefined);
      });

      await waitForElements(locators, { timeout: 8000 });

      locators.forEach((locator) => {
        expect(locator.waitFor).toHaveBeenCalledWith({ state: "visible", timeout: 8000 });
      });
    });

    test("should handle empty array of locators", async () => {
      await expect(waitForElements([])).resolves.toBeUndefined();
    });

    test("should fail if any element is not found", async () => {
      const locators = [
        { waitFor: vi.fn().mockResolvedValue(undefined) },
        { waitFor: vi.fn().mockRejectedValue(new Error("Element 2 not found")) },
        { waitFor: vi.fn().mockResolvedValue(undefined) },
      ];

      await expect(waitForElements(locators)).rejects.toThrow("Element 2 not found");
    });
  });

  describe("elementExists", () => {
    test("should return true when element exists", async () => {
      const result = await elementExists(mockLocator);

      expect(result).toBe(true);
      expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: "attached", timeout: 5000 });
    });

    test("should return false when element does not exist", async () => {
      mockLocator.waitFor.mockRejectedValue(new Error("Element not found"));

      const result = await elementExists(mockLocator);

      expect(result).toBe(false);
    });

    test("should use custom timeout", async () => {
      await elementExists(mockLocator, { timeout: 3000 });

      expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: "attached", timeout: 3000 });
    });

    test("should use default timeout when not provided", async () => {
      await elementExists(mockLocator);

      expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: "attached", timeout: 5000 });
    });
  });

  describe("getTextsFromElements", () => {
    test("should extract text from multiple elements", async () => {
      const locators = [
        { textContent: vi.fn().mockResolvedValue("Text 1") },
        { textContent: vi.fn().mockResolvedValue("Text 2") },
        { textContent: vi.fn().mockResolvedValue("Text 3") },
      ];

      const result = await getTextsFromElements(locators);

      expect(result).toEqual(["Text 1", "Text 2", "Text 3"]);
      locators.forEach((locator) => {
        expect(locator.textContent).toHaveBeenCalledTimes(1);
      });
    });

    test("should handle null text content", async () => {
      const locators = [
        { textContent: vi.fn().mockResolvedValue("Text 1") },
        { textContent: vi.fn().mockResolvedValue(null) },
        { textContent: vi.fn().mockResolvedValue("Text 3") },
      ];

      const result = await getTextsFromElements(locators);

      expect(result).toEqual(["Text 1", "", "Text 3"]);
    });

    test("should handle empty array", async () => {
      const result = await getTextsFromElements([]);

      expect(result).toEqual([]);
    });

    test("should handle mixed results", async () => {
      const locators = [
        { textContent: vi.fn().mockResolvedValue("") },
        { textContent: vi.fn().mockResolvedValue("Valid text") },
        { textContent: vi.fn().mockResolvedValue(null) },
      ];

      const result = await getTextsFromElements(locators);

      expect(result).toEqual(["", "Valid text", ""]);
    });
  });

  describe("waitForPageLoad", () => {
    test("should wait for networkidle state", async () => {
      await waitForPageLoad(mockPage);

      expect(mockPage.waitForLoadState).toHaveBeenCalledWith("networkidle", { timeout: undefined });
    });

    test("should use custom timeout", async () => {
      await waitForPageLoad(mockPage, { timeout: 15000 });

      expect(mockPage.waitForLoadState).toHaveBeenCalledWith("networkidle", { timeout: 15000 });
    });

    test("should throw error if page load times out", async () => {
      mockPage.waitForLoadState.mockRejectedValue(new Error("Page load timeout"));

      await expect(waitForPageLoad(mockPage)).rejects.toThrow("Page load timeout");
    });
  });

  describe("takeTimestampedScreenshot", () => {
    beforeEach(() => {
      // Mock Date to get consistent timestamps in tests
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-22T10:30:45.123Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("should take screenshot with timestamp", async () => {
      const result = await takeTimestampedScreenshot(mockPage, "test-page");

      expect(mockPage.screenshot).toHaveBeenCalledWith({
        path: "test-page-2025-06-22T10-30-45-123Z.png",
        fullPage: true,
      });
      expect(result).toBe("test-page-2025-06-22T10-30-45-123Z.png");
    });

    test("should use custom path", async () => {
      const result = await takeTimestampedScreenshot(mockPage, "error", { path: "./screenshots" });

      expect(mockPage.screenshot).toHaveBeenCalledWith({
        path: "./screenshots/error-2025-06-22T10-30-45-123Z.png",
        fullPage: true,
      });
      expect(result).toBe("./screenshots/error-2025-06-22T10-30-45-123Z.png");
    });

    test("should handle special characters in name", async () => {
      const result = await takeTimestampedScreenshot(mockPage, "test page with spaces");

      expect(result).toBe("test page with spaces-2025-06-22T10-30-45-123Z.png");
    });
  });

  describe("getAttributesFromElements", () => {
    test("should extract attributes from multiple elements", async () => {
      const locators = [
        { getAttribute: vi.fn().mockResolvedValue("value1") },
        { getAttribute: vi.fn().mockResolvedValue("value2") },
        { getAttribute: vi.fn().mockResolvedValue("value3") },
      ];

      const result = await getAttributesFromElements(locators, "data-test");

      expect(result).toEqual(["value1", "value2", "value3"]);
      locators.forEach((locator) => {
        expect(locator.getAttribute).toHaveBeenCalledWith("data-test");
      });
    });

    test("should handle null attribute values", async () => {
      const locators = [
        { getAttribute: vi.fn().mockResolvedValue("value1") },
        { getAttribute: vi.fn().mockResolvedValue(null) },
        { getAttribute: vi.fn().mockResolvedValue("value3") },
      ];

      const result = await getAttributesFromElements(locators, "href");

      expect(result).toEqual(["value1", null, "value3"]);
    });

    test("should handle empty array", async () => {
      const result = await getAttributesFromElements([], "class");

      expect(result).toEqual([]);
    });
  });

  describe("expectAll", () => {
    test("should run all expectations concurrently", async () => {
      const expectations = [
        vi.fn().mockResolvedValue(undefined),
        vi.fn().mockResolvedValue(undefined),
        vi.fn().mockResolvedValue(undefined),
      ];

      await expectAll(expectations);

      expectations.forEach((expectation) => {
        expect(expectation).toHaveBeenCalledTimes(1);
      });
    });

    test("should fail if any expectation fails", async () => {
      const expectations = [
        vi.fn().mockResolvedValue(undefined),
        vi.fn().mockRejectedValue(new Error("Assertion failed")),
        vi.fn().mockResolvedValue(undefined),
      ];

      await expect(expectAll(expectations)).rejects.toThrow("Assertion failed");
    });

    test("should handle empty array of expectations", async () => {
      await expect(expectAll([])).resolves.toBeUndefined();
    });
  });

  describe("waitForTextInAnyElement", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("should find text in first element", async () => {
      const locators = [
        { textContent: vi.fn().mockResolvedValue("Success message") },
        { textContent: vi.fn().mockResolvedValue("Other text") },
      ];

      const promise = waitForTextInAnyElement(locators, "Success");

      // Fast-forward time to allow the function to execute
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe(locators[0]);
    });

    test("should find text in second element", async () => {
      const locators = [
        { textContent: vi.fn().mockResolvedValue("Other text") },
        { textContent: vi.fn().mockResolvedValue("Success message") },
      ];

      const promise = waitForTextInAnyElement(locators, "Success");
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe(locators[1]);
    });
    test("should timeout if text is not found", async () => {
      // Use real timers for this test to avoid complexity with fake timers + Date.now()
      vi.useRealTimers();

      const locators = [
        { textContent: vi.fn().mockResolvedValue("Other text") },
        { textContent: vi.fn().mockResolvedValue("Different text") },
      ];

      await expect(waitForTextInAnyElement(locators, "Not found", { timeout: 50 })).rejects.toThrow(
        'Text "Not found" not found in any of the provided elements within 50ms',
      );

      // Restore fake timers for other tests
      vi.useFakeTimers();
    }, 1000);

    test("should handle elements that throw errors", async () => {
      const locators = [
        { textContent: vi.fn().mockRejectedValue(new Error("Element error")) },
        { textContent: vi.fn().mockResolvedValue("Success message") },
      ];

      const promise = waitForTextInAnyElement(locators, "Success");
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe(locators[1]);
    });
    test("should use custom timeout", async () => {
      // Use real timers for this test to avoid complexity with fake timers + Date.now()
      vi.useRealTimers();

      const locators = [{ textContent: vi.fn().mockResolvedValue("Other text") }];

      await expect(waitForTextInAnyElement(locators, "Not found", { timeout: 50 })).rejects.toThrow(
        'Text "Not found" not found in any of the provided elements within 50ms',
      );

      // Restore fake timers for other tests
      vi.useFakeTimers();
    }, 1000);
  });
});
