import { test, expect, describe, vi } from "vitest";
import { retryAction, retryAction } from "../src/index";

describe("Playwright Helpers - Retry Utilities", () => {
  test("retryAction should succeed on first try", async () => {
    const action = vi.fn().mockResolvedValue("success");

    const result = await retryAction(action);

    expect(result).toBe("success");
    expect(action).toHaveBeenCalledTimes(1);
  });

  test("retryAction should retry on failure and eventually succeed", async () => {
    const action = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("success");

    const result = await retryAction(action, { maxRetries: 3, baseDelay: 10 });

    expect(result).toBe("success");
    expect(action).toHaveBeenCalledTimes(3);
  });

  test("retryAction should throw after max retries", async () => {
    const action = vi.fn().mockRejectedValue(new Error("persistent failure"));

    await expect(retryAction(action, { maxRetries: 2, baseDelay: 10 })).rejects.toThrow("persistent failure");

    expect(action).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  test("retryAction should use default options", async () => {
    const action = vi.fn().mockRejectedValue(new Error("fail"));

    await expect(retryAction(action, { baseDelay: 10 })).rejects.toThrow("fail");

    expect(action).toHaveBeenCalledTimes(6);
  });

  describe("retryAction", () => {
    test("should succeed on first try", async () => {
      const action = vi.fn().mockResolvedValue("success");

      const result = await retryAction(action);

      expect(result).toBe("success");
      expect(action).toHaveBeenCalledTimes(1);
    });

    test("should retry on failure and eventually succeed", async () => {
      const action = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockRejectedValueOnce(new Error("fail"))
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValue("success");

      const result = await retryAction(action, { maxRetries: 5, baseDelay: 10 });

      expect(result).toBe("success");
      expect(action).toHaveBeenCalledTimes(4);
    });

    test("should throw after max retries", async () => {
      const action = vi.fn().mockRejectedValue(new Error("persistent failure"));

      await expect(retryAction(action, { maxRetries: 2, baseDelay: 10 })).rejects.toThrow("persistent failure");

      expect(action).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    test("should use default options (5 retries)", async () => {
      const action = vi.fn().mockRejectedValue(new Error("fail"));

      await expect(retryAction(action, { baseDelay: 10 })).rejects.toThrow("fail");

      expect(action).toHaveBeenCalledTimes(6); // initial + 5 retries (default)
    });

    test("should implement exponential backoff with max delay", async () => {
      let attemptTimes: number[] = [];
      const action = vi.fn().mockImplementation(() => {
        attemptTimes.push(Date.now());
        throw new Error("fail");
      });

      const startTime = Date.now();

      try {
        await retryAction(action, { maxRetries: 3, baseDelay: 100, maxDelay: 200 });
      } catch (error) {
        // Expected to fail
      }

      const totalTime = Date.now() - startTime;

      // Should respect maxDelay ceiling
      expect(totalTime).toBeGreaterThan(500); // At least some delay
      expect(totalTime).toBeLessThan(1000); // Should not exceed reasonable time
      expect(action).toHaveBeenCalledTimes(4); // initial + 3 retries
    });

    test("should handle different return types", async () => {
      const numberAction = vi.fn().mockResolvedValue(42);
      const stringAction = vi.fn().mockResolvedValue("success");
      const objectAction = vi.fn().mockResolvedValue({ status: "ok", data: [1, 2, 3] });
      const booleanAction = vi.fn().mockResolvedValue(true);
      const nullAction = vi.fn().mockResolvedValue(null);

      expect(await retryAction(numberAction)).toBe(42);
      expect(await retryAction(stringAction)).toBe("success");
      expect(await retryAction(objectAction)).toEqual({ status: "ok", data: [1, 2, 3] });
      expect(await retryAction(booleanAction)).toBe(true);
      expect(await retryAction(nullAction)).toBe(null);
    });

    test("should succeed after multiple failures with different error types", async () => {
      const errors = [new Error("Network error"), new TypeError("Type error"), new ReferenceError("Reference error")];
      let callCount = 0;

      const action = vi.fn().mockImplementation(() => {
        if (callCount < errors.length) {
          const error = errors[callCount++];
          throw error;
        }
        return "finally succeeded";
      });

      const result = await retryAction(action, { maxRetries: 5, baseDelay: 10 });

      expect(result).toBe("finally succeeded");
      expect(action).toHaveBeenCalledTimes(4); // 3 failures + 1 success
    });

    test("should preserve original error properties on final failure", async () => {
      class CustomError extends Error {
        constructor(
          message: string,
          public statusCode: number,
        ) {
          super(message);
          this.name = "CustomError";
        }
      }

      const action = vi.fn().mockRejectedValue(new CustomError("Custom failure", 500));

      try {
        await retryAction(action, { maxRetries: 1, baseDelay: 10 });
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
        expect((error as CustomError).message).toBe("Custom failure");
        expect((error as CustomError).statusCode).toBe(500);
        expect((error as CustomError).name).toBe("CustomError");
      }
    });

    test("should handle async vs sync errors properly", async () => {
      const asyncErrorAction = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        throw new Error("Async error");
      });

      const syncErrorAction = vi.fn(() => {
        throw new Error("Sync error");
      });

      await expect(retryAction(asyncErrorAction, { maxRetries: 1, baseDelay: 10 })).rejects.toThrow("Async error");
      await expect(retryAction(syncErrorAction, { maxRetries: 1, baseDelay: 10 })).rejects.toThrow("Sync error");
    });
  });
});
