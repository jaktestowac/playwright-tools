import { describe, test, expect, vi } from "vitest";
import { expectAll } from "../src/assertions";

describe("expectAll function overloads", () => {
  describe("with function array input", () => {
    test("should execute all functions concurrently", async () => {
      const fn1 = vi.fn().mockResolvedValue(undefined);
      const fn2 = vi.fn().mockResolvedValue(undefined);
      const fn3 = vi.fn().mockResolvedValue(undefined);

      await expectAll([fn1, fn2, fn3]);

      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn3).toHaveBeenCalledTimes(1);
    });

    test("should fail if any function throws", async () => {
      const fn1 = vi.fn().mockResolvedValue(undefined);
      const fn2 = vi.fn().mockRejectedValue(new Error("Function failed"));
      const fn3 = vi.fn().mockResolvedValue(undefined);

      await expect(expectAll([fn1, fn2, fn3])).rejects.toThrow("Function failed");
    });

    test("should handle async functions with different timing", async () => {
      const fastFn = vi.fn().mockResolvedValue(undefined);
      const slowFn = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      const mediumFn = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 50))
      );

      const startTime = Date.now();
      await expectAll([fastFn, slowFn, mediumFn]);
      const duration = Date.now() - startTime;

      // Should complete in roughly the time of the slowest function
      expect(duration).toBeGreaterThan(90);
      expect(duration).toBeLessThan(150);
      expect(fastFn).toHaveBeenCalledTimes(1);
      expect(slowFn).toHaveBeenCalledTimes(1);
      expect(mediumFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("with promise array input", () => {
    test("should await all promises concurrently", async () => {
      const promise1 = Promise.resolve();
      const promise2 = Promise.resolve();
      const promise3 = Promise.resolve();

      // Should not throw and complete successfully
      await expect(expectAll([promise1, promise2, promise3])).resolves.toBeUndefined();
    });

    test("should fail if any promise rejects", async () => {
      const promise1 = Promise.resolve();
      const promise2 = Promise.reject(new Error("Promise failed"));
      const promise3 = Promise.resolve();

      await expect(expectAll([promise1, promise2, promise3])).rejects.toThrow("Promise failed");
    });

    test("should handle promises with different resolution times", async () => {
      const fastPromise = Promise.resolve();
      const slowPromise = new Promise<void>(resolve => setTimeout(() => resolve(), 100));
      const mediumPromise = new Promise<void>(resolve => setTimeout(() => resolve(), 50));

      const startTime = Date.now();
      await expectAll([fastPromise, slowPromise, mediumPromise]);
      const duration = Date.now() - startTime;

      // Should complete in roughly the time of the slowest promise
      expect(duration).toBeGreaterThan(90);
      expect(duration).toBeLessThan(150);
    });
  });

  describe("edge cases", () => {
    test("should handle empty array", async () => {
      await expect(expectAll([])).resolves.toBeUndefined();
    });

    test("should handle single function", async () => {
      const singleFn = vi.fn().mockResolvedValue("single");
      await expectAll([singleFn]);
      expect(singleFn).toHaveBeenCalledTimes(1);
    });

    test("should handle single promise", async () => {
      const singlePromise = Promise.resolve();
      await expect(expectAll([singlePromise])).resolves.toBeUndefined();
    });

    test("should preserve error stack traces", async () => {
      const errorWithStack = new Error("Detailed error");
      errorWithStack.stack = "Custom stack trace";

      const failingFn = vi.fn().mockRejectedValue(errorWithStack);

      try {
        await expectAll([failingFn]);
      } catch (error) {
        expect(error).toBe(errorWithStack);
        expect(error.stack).toBe("Custom stack trace");
      }
    });

    test("should handle mixed sync and async functions", async () => {
      const syncFn = vi.fn().mockReturnValue(undefined); // Synchronous function
      const asyncFn = vi.fn().mockResolvedValue(undefined); // Async function

      await expectAll([syncFn, asyncFn]);

      expect(syncFn).toHaveBeenCalledTimes(1);
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    test("should handle purely synchronous functions", async () => {
      let counter = 0;
      const syncFn1 = vi.fn().mockImplementation(() => { counter++; });
      const syncFn2 = vi.fn().mockImplementation(() => { counter += 2; });
      const syncFn3 = vi.fn().mockImplementation(() => { counter += 3; });

      await expectAll([syncFn1, syncFn2, syncFn3]);

      expect(syncFn1).toHaveBeenCalledTimes(1);
      expect(syncFn2).toHaveBeenCalledTimes(1);
      expect(syncFn3).toHaveBeenCalledTimes(1);
      expect(counter).toBe(6); // 1 + 2 + 3
    });

    test("should handle functions that throw synchronously", async () => {
      const successFn = vi.fn().mockReturnValue(undefined);
      const throwingFn = vi.fn().mockImplementation(() => {
        throw new Error("Sync error");
      });

      await expect(expectAll([successFn, throwingFn])).rejects.toThrow("Sync error");
    });

    test("should handle mixed timing: sync, fast async, slow async", async () => {
      let executionOrder: string[] = [];
      
      const syncFn = vi.fn().mockImplementation(() => {
        executionOrder.push("sync");
      });
      
      const fastAsyncFn = vi.fn().mockImplementation(async () => {
        executionOrder.push("fast-start");
        await new Promise(resolve => setTimeout(resolve, 10));
        executionOrder.push("fast-end");
      });
      
      const slowAsyncFn = vi.fn().mockImplementation(async () => {
        executionOrder.push("slow-start");
        await new Promise(resolve => setTimeout(resolve, 50));
        executionOrder.push("slow-end");
      });

      await expectAll([syncFn, fastAsyncFn, slowAsyncFn]);

      // Sync should execute immediately, then async functions start
      expect(executionOrder[0]).toBe("sync");
      expect(executionOrder.slice(1, 3)).toEqual(expect.arrayContaining(["fast-start", "slow-start"]));
      expect(executionOrder).toContain("fast-end");
      expect(executionOrder).toContain("slow-end");
    });
  });

  describe("array input variations", () => {
    test("should handle large arrays of functions", async () => {
      const functions = Array.from({ length: 100 }, (_, i) => 
        vi.fn().mockImplementation(() => Promise.resolve(i))
      );

      await expectAll(functions);

      functions.forEach(fn => {
        expect(fn).toHaveBeenCalledTimes(1);
      });
    });

    test("should handle array with one function", async () => {
      const singleFn = vi.fn().mockResolvedValue("result");
      await expectAll([singleFn]);
      expect(singleFn).toHaveBeenCalledTimes(1);
    });

    test("should handle sparse arrays (with undefined elements)", async () => {
      const fn1 = vi.fn().mockResolvedValue(undefined);
      const fn2 = vi.fn().mockResolvedValue(undefined);
      
      // Create sparse array with undefined in the middle
      const sparseArray: (() => Promise<void>)[] = [fn1, undefined as any, fn2];
      
      // This should fail because undefined is not a function
      await expect(expectAll(sparseArray)).rejects.toThrow();
    });

    test("should handle functions returning different types", async () => {
      const stringFn = vi.fn().mockResolvedValue("string");
      const numberFn = vi.fn().mockResolvedValue(42);
      const objectFn = vi.fn().mockResolvedValue({ key: "value" });
      const voidFn = vi.fn().mockResolvedValue(undefined);

      // expectAll should work regardless of return types
      await expectAll([stringFn, numberFn, objectFn, voidFn]);

      expect(stringFn).toHaveBeenCalledTimes(1);
      expect(numberFn).toHaveBeenCalledTimes(1);
      expect(objectFn).toHaveBeenCalledTimes(1);
      expect(voidFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling edge cases", () => {
    test("should handle functions that return rejected promises", async () => {
      const successFn = vi.fn().mockResolvedValue(undefined);
      const rejectedFn = vi.fn().mockReturnValue(Promise.reject(new Error("Returned rejection")));

      await expect(expectAll([successFn, rejectedFn])).rejects.toThrow("Returned rejection");
    });

    test("should handle multiple failing functions and report first error", async () => {
      const error1 = new Error("First error");
      const error2 = new Error("Second error");
      
      const failFn1 = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(error1), 10))
      );
      const failFn2 = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(error2), 20))
      );

      try {
        await expectAll([failFn1, failFn2]);
      } catch (error) {
        // Should get the first error that rejects
        expect(error).toBe(error1);
      }
    });

    test("should handle functions that are not callable", async () => {
      const validFn = vi.fn().mockResolvedValue(undefined);
      const notAFunction = "not a function" as any;

      await expect(expectAll([validFn, notAFunction])).rejects.toThrow();
    });
  });

  describe("performance characteristics", () => {
    test("should execute functions truly concurrently", async () => {
      let executionOrder: number[] = [];
      
      const fn1 = vi.fn().mockImplementation(async () => {
        executionOrder.push(1);
        await new Promise(resolve => setTimeout(resolve, 50));
        executionOrder.push(1);
      });
      
      const fn2 = vi.fn().mockImplementation(async () => {
        executionOrder.push(2);
        await new Promise(resolve => setTimeout(resolve, 30));
        executionOrder.push(2);
      });
      
      const fn3 = vi.fn().mockImplementation(async () => {
        executionOrder.push(3);
        await new Promise(resolve => setTimeout(resolve, 10));
        executionOrder.push(3);
      });

      await expectAll([fn1, fn2, fn3]);

      // All functions should start execution before any complete
      // (concurrent execution pattern)
      expect(executionOrder.slice(0, 3)).toEqual([1, 2, 3]);
    });

    test("should fail fast on first rejection", async () => {
      const slowFn = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );
      const fastFailingFn = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error("Fast fail")), 50))
      );

      const startTime = Date.now();
      
      await expect(expectAll([slowFn, fastFailingFn])).rejects.toThrow("Fast fail");
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should fail before slow function completes
    });
  });
});
