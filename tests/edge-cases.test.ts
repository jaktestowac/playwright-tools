import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import { retryAction, waitForTextInAnyElement, takeTimestampedScreenshot, expectAll } from "../src/index";

describe("Playwright Helpers - Edge Cases and Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("retryAction edge cases", () => {
    test("should handle action that returns different types", async () => {
      const numberAction = vi.fn().mockResolvedValue(42);
      const stringAction = vi.fn().mockResolvedValue("success");
      const objectAction = vi.fn().mockResolvedValue({ status: "ok", data: [1, 2, 3] });
      const booleanAction = vi.fn().mockResolvedValue(true);

      expect(await retryAction(numberAction)).toBe(42);
      expect(await retryAction(stringAction)).toBe("success");
      expect(await retryAction(objectAction)).toEqual({ status: "ok", data: [1, 2, 3] });
      expect(await retryAction(booleanAction)).toBe(true);
    });

    test("should handle action that returns null or undefined", async () => {
      const nullAction = vi.fn().mockResolvedValue(null);
      const undefinedAction = vi.fn().mockResolvedValue(undefined);

      expect(await retryAction(nullAction)).toBe(null);
      expect(await retryAction(undefinedAction)).toBe(undefined);
    });

    test("should respect maxDelay ceiling", async () => {
      let attemptTimes: number[] = [];
      const action = vi.fn().mockImplementation(() => {
        attemptTimes.push(Date.now());
        throw new Error("Always fails");
      });

      const startTime = Date.now();

      try {
        await retryAction(action, {
          maxRetries: 4,
          baseDelay: 100,
          maxDelay: 200, // Very low max delay
        });
      } catch (error) {
        // Expected to fail
      }

      const totalTime = Date.now() - startTime;

      // Should not exceed: 200ms + 200ms + 200ms + 200ms + some overhead
      expect(totalTime).toBeLessThan(1000);
      expect(action).toHaveBeenCalledTimes(5); // initial + 4 retries
    });

    test("should handle synchronous errors vs async errors", async () => {
      const syncErrorAction = vi.fn(() => {
        throw new Error("Sync error");
      });

      const asyncErrorAction = vi.fn(async () => {
        throw new Error("Async error");
      });

      await expect(retryAction(syncErrorAction, { maxRetries: 1, baseDelay: 10 })).rejects.toThrow("Sync error");

      await expect(retryAction(asyncErrorAction, { maxRetries: 1, baseDelay: 10 })).rejects.toThrow("Async error");
    });

    test("should handle action that succeeds after multiple failures", async () => {
      const errors = ["Error 1", "Error 2", "Error 3"];
      let callCount = 0;

      const action = vi.fn().mockImplementation(() => {
        if (callCount < errors.length) {
          const error = new Error(errors[callCount]);
          callCount++;
          throw error;
        }
        return "finally succeeded";
      });

      const result = await retryAction(action, { maxRetries: 5, baseDelay: 10 });

      expect(result).toBe("finally succeeded");
      expect(action).toHaveBeenCalledTimes(4); // 3 failures + 1 success
    });

    test("should preserve original error types and properties", async () => {
      class CustomError extends Error {
        constructor(
          message: string,
          public code: number,
        ) {
          super(message);
          this.name = "CustomError";
        }
      }

      const action = vi.fn().mockRejectedValue(new CustomError("Custom failure", 500));

      try {
        await retryAction(action, { maxRetries: 1, baseDelay: 10 });
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
        expect((error as CustomError).code).toBe(500);
        expect(error.message).toBe("Custom failure");
        expect(error.name).toBe("CustomError");
      }
    });
  });

  describe("waitForTextInAnyElement edge cases", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("should handle empty locators array", async () => {
      const promise = waitForTextInAnyElement([], "any text");

      vi.advanceTimersByTime(31000); // Past default timeout

      await expect(promise).rejects.toThrow('Text "any text" not found in any of the provided elements within 30000ms');
    });

    test("should handle elements with empty text content", async () => {
      const locators = [
        { textContent: vi.fn().mockResolvedValue("") },
        { textContent: vi.fn().mockResolvedValue("   ") }, // whitespace only
        { textContent: vi.fn().mockResolvedValue("actual content") },
      ];

      const promise = waitForTextInAnyElement(locators, "actual");
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe(locators[2]);
    });

    test("should handle text that appears and disappears", async () => {
      let callCount = 0;
      const locator = {
        textContent: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount <= 5) {
            return Promise.resolve("loading...");
          }
          return Promise.resolve("success message");
        }),
      };

      const promise = waitForTextInAnyElement([locator], "success");

      // Advance time to allow multiple checks
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe(locator);
      expect(callCount).toBeGreaterThan(5);
    });

    test("should handle case-sensitive text matching", async () => {
      const locators = [
        { textContent: vi.fn().mockResolvedValue("SUCCESS") },
        { textContent: vi.fn().mockResolvedValue("Success") },
        { textContent: vi.fn().mockResolvedValue("success") },
      ];

      // Should find exact case match
      const promise1 = waitForTextInAnyElement(locators, "SUCCESS");
      await vi.runAllTimersAsync();
      const result1 = await promise1;
      expect(result1).toBe(locators[0]);

      // Should find partial match
      const promise2 = waitForTextInAnyElement(locators, "Succ");
      await vi.runAllTimersAsync();
      const result2 = await promise2;
      expect(result2).toBe(locators[1]);
    });

    test("should handle elements that throw different types of errors", async () => {
      const locators = [
        { textContent: vi.fn().mockRejectedValue(new Error("DOM error")) },
        { textContent: vi.fn().mockRejectedValue("String error") },
        { textContent: vi.fn().mockRejectedValue(new TypeError("Type error")) },
        { textContent: vi.fn().mockResolvedValue("found text") },
      ];

      const promise = waitForTextInAnyElement(locators, "found");
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe(locators[3]);
    });

    test("should handle very long text content", async () => {
      const longText = "a".repeat(10000) + "needle" + "b".repeat(10000);
      const locator = { textContent: vi.fn().mockResolvedValue(longText) };

      const promise = waitForTextInAnyElement([locator], "needle");
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe(locator);
    });
  });

  describe("takeTimestampedScreenshot edge cases", () => {
    let mockPage: any;

    beforeEach(() => {
      mockPage = {
        screenshot: vi.fn().mockResolvedValue(undefined),
      };
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-22T10:30:45.123Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("should handle special characters in filename", async () => {
      const result = await takeTimestampedScreenshot(mockPage, "test:page<>with|special?chars");

      expect(mockPage.screenshot).toHaveBeenCalledWith({
        path: "test:page<>with|special?chars-2025-06-22T10-30-45-123Z.png",
        fullPage: true,
      });
      expect(result).toBe("test:page<>with|special?chars-2025-06-22T10-30-45-123Z.png");
    });

    test("should handle empty filename", async () => {
      const result = await takeTimestampedScreenshot(mockPage, "");

      expect(mockPage.screenshot).toHaveBeenCalledWith({
        path: "-2025-06-22T10-30-45-123Z.png",
        fullPage: true,
      });
      expect(result).toBe("-2025-06-22T10-30-45-123Z.png");
    });

    test("should handle very long filenames", async () => {
      const longName = "a".repeat(200);
      const result = await takeTimestampedScreenshot(mockPage, longName);

      expect(result).toBe(`${longName}-2025-06-22T10-30-45-123Z.png`);
    });

    test("should handle nested path creation", async () => {
      const result = await takeTimestampedScreenshot(mockPage, "test", {
        path: "screenshots/subfolder/nested",
      });

      expect(mockPage.screenshot).toHaveBeenCalledWith({
        path: "screenshots/subfolder/nested/test-2025-06-22T10-30-45-123Z.png",
        fullPage: true,
      });
      expect(result).toBe("screenshots/subfolder/nested/test-2025-06-22T10-30-45-123Z.png");
    });

    test("should handle screenshot failures", async () => {
      mockPage.screenshot.mockRejectedValue(new Error("Screenshot failed"));

      await expect(takeTimestampedScreenshot(mockPage, "test")).rejects.toThrow("Screenshot failed");
    });

    test("should generate unique timestamps for rapid calls", async () => {
      const results: string[] = [];

      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(1); // Advance by 1ms each iteration
        const result = await takeTimestampedScreenshot(mockPage, "test");
        results.push(result);
      }

      // All should be unique due to timestamp differences
      const uniqueResults = [...new Set(results)];
      expect(uniqueResults).toHaveLength(5);
    });
  });

  describe("expectAll edge cases", () => {
    test("should handle mixed synchronous and asynchronous expectations", async () => {
      const syncExpectation = vi.fn().mockReturnValue(undefined);
      const asyncExpectation = vi.fn().mockResolvedValue(undefined);
      const delayedExpectation = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      await expectAll([syncExpectation, asyncExpectation, delayedExpectation]);

      expect(syncExpectation).toHaveBeenCalledTimes(1);
      expect(asyncExpectation).toHaveBeenCalledTimes(1);
      expect(delayedExpectation).toHaveBeenCalledTimes(1);
    });

    test("should handle expectations that return values", async () => {
      const expectations = [
        vi.fn().mockResolvedValue("result1"),
        vi.fn().mockResolvedValue(42),
        vi.fn().mockResolvedValue({ data: "test" }),
      ];

      // expectAll should ignore return values and just wait for completion
      await expectAll(expectations);

      expectations.forEach((expectation) => {
        expect(expectation).toHaveBeenCalledTimes(1);
      });
    });

    test("should fail fast when any expectation fails", async () => {
      const slowExpectation = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));
      const fastFailingExpectation = vi.fn().mockRejectedValue(new Error("Quick failure"));
      const neverCalledExpectation = vi.fn().mockResolvedValue(undefined);

      const startTime = Date.now();

      await expect(expectAll([slowExpectation, fastFailingExpectation, neverCalledExpectation])).rejects.toThrow(
        "Quick failure",
      );

      const duration = Date.now() - startTime;

      // Should fail quickly, not wait for slow expectation
      expect(duration).toBeLessThan(500);
      expect(fastFailingExpectation).toHaveBeenCalledTimes(1);
    });

    test("should handle very large numbers of expectations", async () => {
      const expectations = Array.from({ length: 1000 }, () => vi.fn().mockResolvedValue(undefined));

      await expectAll(expectations);

      expectations.forEach((expectation) => {
        expect(expectation).toHaveBeenCalledTimes(1);
      });
    });

    test("should preserve error details from failed expectations", async () => {
      class CustomExpectationError extends Error {
        constructor(
          message: string,
          public expectedValue: any,
          public actualValue: any,
        ) {
          super(message);
          this.name = "CustomExpectationError";
        }
      }

      const failingExpectation = vi
        .fn()
        .mockRejectedValue(new CustomExpectationError("Values don't match", "expected", "actual"));

      try {
        await expectAll([failingExpectation]);
      } catch (error) {
        expect(error).toBeInstanceOf(CustomExpectationError);
        expect((error as CustomExpectationError).expectedValue).toBe("expected");
        expect((error as CustomExpectationError).actualValue).toBe("actual");
      }
    });
  });
});
