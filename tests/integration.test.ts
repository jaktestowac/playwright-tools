import { test, expect, describe, vi, beforeEach } from "vitest";
import {
  safeClick,
  safeFill,
  waitForElements,
  expectAll,
  getTextsFromElements,
  getAttributesFromElements,
  elementExists,
  retryAction,
} from "../src/index";

describe("Playwright Helpers - Integration Tests", () => {
  let mockLocators: any[];
  let mockPage: any;
  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock locators with different behaviors
    mockLocators = [
      {
        waitFor: vi.fn().mockResolvedValue(undefined),
        click: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
        fill: vi.fn().mockResolvedValue(undefined),
        textContent: vi.fn().mockResolvedValue("Button 1"),
        getAttribute: vi.fn().mockResolvedValue("btn-1"),
      },
      {
        waitFor: vi.fn().mockResolvedValue(undefined),
        click: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
        fill: vi.fn().mockResolvedValue(undefined),
        textContent: vi.fn().mockResolvedValue("Button 2"),
        getAttribute: vi.fn().mockResolvedValue("btn-2"),
      },
      {
        waitFor: vi.fn().mockResolvedValue(undefined),
        click: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
        fill: vi.fn().mockResolvedValue(undefined),
        textContent: vi.fn().mockResolvedValue("Button 3"),
        getAttribute: vi.fn().mockResolvedValue("btn-3"),
      },
      {
        waitFor: vi.fn().mockResolvedValue(undefined),
        click: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
        fill: vi.fn().mockResolvedValue(undefined),
        textContent: vi.fn().mockResolvedValue("Modal"),
        getAttribute: vi.fn().mockResolvedValue("modal"),
      },
    ];

    mockPage = {
      waitForLoadState: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe("Multi-element operations", () => {
    test("should handle complete form interaction workflow", async () => {
      const [usernameField, passwordField, submitButton] = mockLocators;

      // Wait for all form elements to be ready
      await waitForElements([usernameField, passwordField, submitButton]);

      // Fill form fields
      await safeFill(usernameField, "testuser@example.com");
      await safeFill(passwordField, "password123");

      // Click submit button
      await safeClick(submitButton);

      // Verify the sequence of operations
      expect(usernameField.waitFor).toHaveBeenCalledWith({ state: "visible", timeout: undefined });
      expect(passwordField.waitFor).toHaveBeenCalledWith({ state: "visible", timeout: undefined });
      expect(submitButton.waitFor).toHaveBeenCalledWith({ state: "visible", timeout: undefined });

      expect(usernameField.fill).toHaveBeenCalledWith("testuser@example.com");
      expect(passwordField.fill).toHaveBeenCalledWith("password123");
      expect(submitButton.click).toHaveBeenCalledTimes(1);
    });

    test("should extract and validate multiple element properties", async () => {
      // Get text content from all elements
      const texts = await getTextsFromElements(mockLocators);
      expect(texts).toEqual(["Button 1", "Button 2", "Button 3", "Modal"]);

      // Get attributes from all elements
      const ids = await getAttributesFromElements(mockLocators, "id");
      expect(ids).toEqual(["btn-1", "btn-2", "btn-3", "modal"]);

      // Verify all elements exist
      const existenceChecks = await Promise.all(mockLocators.map((locator) => elementExists(locator)));
      expect(existenceChecks).toEqual([true, true, true, true]);
    });
    
    test("should handle mixed success and failure scenarios", async () => {
      // Make second locator fail
      mockLocators[1].waitFor.mockRejectedValue(new Error("Element 2 not found"));
      mockLocators[1].textContent.mockRejectedValue(new Error("Cannot get text"));

      // Check element existence - should handle failures gracefully
      const existenceResults = await Promise.all(mockLocators.map((locator) => elementExists(locator)));
      expect(existenceResults).toEqual([true, false, true, true]);

      // Text extraction should handle failures by returning empty strings
      mockLocators[1].textContent.mockResolvedValue(null);
      const texts = await getTextsFromElements(mockLocators);
      expect(texts).toEqual(["Button 1", "", "Button 3", "Modal"]);
    });
  });

  describe("Error handling and retry scenarios", () => {
    test("should retry flaky element interactions", async () => {
      const flakyLocator = {
        waitFor: vi
          .fn()
          .mockRejectedValueOnce(new Error("Network timeout"))
          .mockRejectedValueOnce(new Error("Element not ready"))
          .mockResolvedValue(undefined),
        click: vi.fn().mockResolvedValue(undefined),
      };

      const result = await retryAction(
        async () => {
          await safeClick(flakyLocator);
          return "success";
        },
        { maxRetries: 3, baseDelay: 10 },
      );

      expect(result).toBe("success");
      expect(flakyLocator.waitFor).toHaveBeenCalledTimes(3);
      expect(flakyLocator.click).toHaveBeenCalledTimes(1);
    });

    test("should handle partial failures in bulk operations", async () => {
      // Make middle element fail consistently
      mockLocators[1].textContent.mockRejectedValue(new Error("Access denied"));

      await expect(getTextsFromElements(mockLocators)).rejects.toThrow("Access denied");

      // But individual operations should still work
      const firstText = await mockLocators[0].textContent();
      const lastText = await mockLocators[2].textContent();

      expect(firstText).toBe("Button 1");
      expect(lastText).toBe("Button 3");
    });

    test("should retry complex multi-step operations", async () => {
      let attemptCount = 0;

      const complexOperation = async () => {
        attemptCount++;

        if (attemptCount <= 2) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }

        // Simulate complex workflow that eventually succeeds
        await waitForElements([mockLocators[0], mockLocators[1]]);
        await safeFill(mockLocators[0], "retry-test");
        await safeClick(mockLocators[1]);

        return "complex operation completed";
      };

      const result = await retryAction(complexOperation, {
        maxRetries: 3,
        baseDelay: 10,
      });

      expect(result).toBe("complex operation completed");
      expect(attemptCount).toBe(3);

      // Verify the successful attempt actually executed the operations
      expect(mockLocators[0].fill).toHaveBeenCalledWith("retry-test");
      expect(mockLocators[1].click).toHaveBeenCalledTimes(1);
    });
  });

  describe("Performance and concurrency", () => {
    test("should execute parallel operations efficiently", async () => {
      const startTime = Date.now();

      // Simulate operations that would take time
      mockLocators.forEach((locator) => {
        locator.waitFor = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 50)));
      });

      // These should run in parallel
      await waitForElements(mockLocators);

      const parallelTime = Date.now() - startTime;

      // Reset for sequential test
      const sequentialStart = Date.now();

      // These would run sequentially
      for (const locator of mockLocators) {
        await locator.waitFor({ state: "visible" });
      }

      const sequentialTime = Date.now() - sequentialStart;

      // Parallel should be significantly faster than sequential
      expect(parallelTime).toBeLessThan(sequentialTime * 0.8);
    });

    test("should handle concurrent expectations", async () => {
      const mockExpect = vi.fn().mockResolvedValue(undefined);

      const expectations = [
        () => mockExpect("expectation 1"),
        () => mockExpect("expectation 2"),
        () => mockExpect("expectation 3"),
        () => mockExpect("expectation 4"),
      ];

      await expectAll(expectations);

      expect(mockExpect).toHaveBeenCalledTimes(4);
      expect(mockExpect).toHaveBeenCalledWith("expectation 1");
      expect(mockExpect).toHaveBeenCalledWith("expectation 2");
      expect(mockExpect).toHaveBeenCalledWith("expectation 3");
      expect(mockExpect).toHaveBeenCalledWith("expectation 4");
    });
  });

  describe("Real-world scenarios", () => {
    test("should handle navigation and form submission workflow", async () => {
      const [navButton, formField, submitBtn, confirmModal] = mockLocators;

      // Navigation workflow
      await safeClick(navButton);

      // Form interaction workflow
      await waitForElements([formField, submitBtn]);
      await safeFill(formField, "test data");
      await safeClick(submitBtn);

      // Confirmation workflow
      const modalExists = await elementExists(confirmModal);
      if (modalExists) {
        await safeClick(confirmModal);
      }

      // Verify complete workflow
      expect(navButton.click).toHaveBeenCalledTimes(1);
      expect(formField.fill).toHaveBeenCalledWith("test data");
      expect(submitBtn.click).toHaveBeenCalledTimes(1);
      expect(confirmModal.waitFor).toHaveBeenCalledWith({ state: "attached", timeout: 5000 });
      expect(confirmModal.click).toHaveBeenCalledTimes(1);
    });
    test("should handle search and results validation", async () => {
      const [searchField, searchButton, ...resultElements] = mockLocators;

      // Set up search results
      resultElements.forEach((element, index) => {
        element.textContent = vi.fn().mockResolvedValue(`Result ${index + 1}`);
      });

      // Perform search
      await safeFill(searchField, "test query");
      await safeClick(searchButton);

      // Wait for results and validate
      await waitForElements(resultElements);
      const resultTexts = await getTextsFromElements(resultElements);

      expect(searchField.fill).toHaveBeenCalledWith("test query");
      expect(searchButton.click).toHaveBeenCalledTimes(1);
      expect(resultTexts).toEqual(["Result 1", "Result 2"]);
    });

    test("should handle error states and recovery", async () => {
      const [actionButton, errorDialog, retryButton] = mockLocators;

      let clickCount = 0;
      actionButton.click = vi.fn().mockImplementation(() => {
        clickCount++;
        if (clickCount === 1) {
          // First click triggers error
          errorDialog.waitFor = vi.fn().mockResolvedValue(undefined);
          throw new Error("Action failed");
        }
        return Promise.resolve();
      });

      // Simulate error handling workflow
      const performActionWithRetry = async () => {
        try {
          await safeClick(actionButton);
        } catch (error) {
          // Check if error dialog appeared
          const hasErrorDialog = await elementExists(errorDialog);
          if (hasErrorDialog) {
            await safeClick(retryButton);
            // Retry the original action
            await safeClick(actionButton);
          }
        }
      };

      await performActionWithRetry();

      expect(actionButton.click).toHaveBeenCalledTimes(2);
      expect(retryButton.click).toHaveBeenCalledTimes(1);
    });
  });
});
