import { test, expect, describe } from "vitest";
import { testDispatcher } from "../src/index";

describe("Utils - testDispatcher", () => {
  describe("runOnly behavior", () => {
    test("should return only tests with runOnly: true when any exist", () => {
      const tests = [
        { name: "test1", skip: false },
        { name: "test2", skip: true },
        { name: "test3", runOnly: true },
        { name: "test4", skip: false },
        { name: "test5", runOnly: true },
      ];

      const result = testDispatcher(tests);

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name)).toEqual(["test3", "test5"]);
      expect(result.every((t) => t.runOnly)).toBe(true);
    });

    test("should prioritize runOnly over skip flags", () => {
      const tests = [
        { name: "test1", skip: false },
        { name: "test2", skip: true },
        { name: "test3", runOnly: true, skip: true }, // runOnly should take precedence
        { name: "test4", skip: false },
      ];

      const result = testDispatcher(tests);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("test3");
      expect(result[0].runOnly).toBe(true);
      expect(result[0].skip).toBe(true);
    });

    test("should return multiple runOnly tests", () => {
      const tests = [
        { name: "test1", runOnly: true },
        { name: "test2", runOnly: true },
        { name: "test3", runOnly: true },
      ];

      const result = testDispatcher(tests);

      expect(result).toHaveLength(3);
      expect(result.every((t) => t.runOnly)).toBe(true);
    });
  });

  describe("skip behavior (when no runOnly tests)", () => {
    test("should filter out skipped tests when no runOnly present", () => {
      const tests = [
        { name: "test1", skip: false },
        { name: "test2", skip: true },
        { name: "test3", skip: false },
        { name: "test4", skip: true },
      ];

      const result = testDispatcher(tests);

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name)).toEqual(["test1", "test3"]);
      expect(result.every((t) => !t.skip)).toBe(true);
    });

    test("should return all tests when none are skipped", () => {
      const tests = [
        { name: "test1", skip: false },
        { name: "test2", skip: false },
        { name: "test3", skip: false },
      ];

      const result = testDispatcher(tests);

      expect(result).toHaveLength(3);
      expect(result.map((t) => t.name)).toEqual(["test1", "test2", "test3"]);
    });

    test("should return all tests when skip property is undefined", () => {
      const tests = [{ name: "test1" }, { name: "test2" }, { name: "test3" }];

      const result = testDispatcher(tests);

      expect(result).toHaveLength(3);
      expect(result.map((t) => t.name)).toEqual(["test1", "test2", "test3"]);
    });

    test("should handle mixed skip/undefined scenarios", () => {
      const tests = [
        { name: "test1", skip: false },
        { name: "test2" }, // undefined skip
        { name: "test3", skip: true },
        { name: "test4" }, // undefined skip
      ];

      const result = testDispatcher(tests);

      expect(result).toHaveLength(3);
      expect(result.map((t) => t.name)).toEqual(["test1", "test2", "test4"]);
    });
  });

  describe("edge cases", () => {
    test("should handle empty array", () => {
      const result = testDispatcher([]);

      expect(result).toEqual([]);
    });

    test("should handle all tests skipped", () => {
      const tests = [
        { name: "test1", skip: true },
        { name: "test2", skip: true },
        { name: "test3", skip: true },
      ];

      const result = testDispatcher(tests);

      expect(result).toEqual([]);
    });

    test("should handle complex test objects with additional properties", () => {
      const tests = [
        {
          name: "test1",
          skip: false,
          description: "First test",
          timeout: 5000,
          tags: ["smoke", "regression"],
        },
        {
          name: "test2",
          skip: true,
          description: "Second test",
          timeout: 3000,
          tags: ["integration"],
        },
        {
          name: "test3",
          runOnly: true,
          description: "Third test",
          timeout: 10000,
          tags: ["e2e"],
        },
      ];

      const result = testDispatcher(tests);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: "test3",
        runOnly: true,
        description: "Third test",
        timeout: 10000,
        tags: ["e2e"],
      });
    });

    test("should preserve original object references", () => {
      const test1 = { name: "test1", skip: false };
      const test2 = { name: "test2", skip: true };
      const test3 = { name: "test3", skip: false };

      const tests = [test1, test2, test3];
      const result = testDispatcher(tests);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(test1); // Same reference
      expect(result[1]).toBe(test3); // Same reference
    });

    test("should handle boolean edge cases", () => {
      const tests = [
        { name: "test1", skip: false, runOnly: false },
        { name: "test2", skip: true, runOnly: false },
        { name: "test3", skip: false, runOnly: true },
        { name: "test4", skip: true, runOnly: true },
      ];

      const result = testDispatcher(tests);

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name)).toEqual(["test3", "test4"]);
      expect(result.every((t) => t.runOnly)).toBe(true);
    });
  });

  describe("type safety", () => {
    test("should work with minimal interface", () => {
      interface MinimalTest {
        name: string;
        skip?: boolean;
        runOnly?: boolean;
      }

      const tests: MinimalTest[] = [
        { name: "test1", skip: false },
        { name: "test2", runOnly: true },
      ];

      const result = testDispatcher(tests);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("test2");
    });

    test("should work with extended interface", () => {
      interface ExtendedTest {
        id: number;
        name: string;
        description: string;
        skip?: boolean;
        runOnly?: boolean;
        metadata: {
          author: string;
          created: Date;
        };
      }

      const tests: ExtendedTest[] = [
        {
          id: 1,
          name: "test1",
          description: "First test",
          skip: true,
          metadata: { author: "John", created: new Date() },
        },
        {
          id: 2,
          name: "test2",
          description: "Second test",
          runOnly: true,
          metadata: { author: "Jane", created: new Date() },
        },
      ];

      const result = testDispatcher(tests);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
      expect(result[0].name).toBe("test2");
      expect(result[0].metadata.author).toBe("Jane");
    });

    test("should work with union types", () => {
      type TestStatus = "pending" | "running" | "completed";

      interface TestWithStatus {
        name: string;
        status: TestStatus;
        skip?: boolean;
        runOnly?: boolean;
      }

      const tests: TestWithStatus[] = [
        { name: "test1", status: "pending", skip: false },
        { name: "test2", status: "running", skip: true },
        { name: "test3", status: "completed", runOnly: true },
      ];

      const result = testDispatcher(tests);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("test3");
      expect(result[0].status).toBe("completed");
    });
  });

  describe("customFilter behavior", () => {
    test("should apply customFilter to runOnly tests", () => {
      const tests = [
        { name: "integration-test1", runOnly: true, category: "integration" },
        { name: "unit-test2", runOnly: true, category: "unit" },
        { name: "e2e-test3", runOnly: true, category: "e2e" },
        { name: "regular-test4", skip: false, category: "unit" },
      ];

      const result = testDispatcher(tests, {
        customFilter: (test) => test.category === "unit",
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("unit-test2");
      expect(result[0].runOnly).toBe(true);
    });

    test("should apply customFilter to skip-filtered tests", () => {
      const tests = [
        { name: "integration-test1", skip: false, category: "integration" },
        { name: "unit-test2", skip: true, category: "unit" },
        { name: "e2e-test3", skip: false, category: "e2e" },
        { name: "unit-test4", skip: false, category: "unit" },
      ];

      const result = testDispatcher(tests, {
        customFilter: (test) => test.category === "unit",
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("unit-test4");
      expect(result[0].skip).toBe(false);
    });

    test("should filter by test name pattern", () => {
      const tests = [
        { name: "smoke-login-test", skip: false },
        { name: "smoke-logout-test", skip: false },
        { name: "regression-payment-test", skip: false },
        { name: "smoke-navigation-test", skip: true },
      ];

      const result = testDispatcher(tests, {
        customFilter: (test) => test.name.includes("smoke"),
      });

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name)).toEqual(["smoke-login-test", "smoke-logout-test"]);
    });

    test("should filter by complex conditions", () => {
      const tests = [
        { name: "test1", skip: false, timeout: 5000, tags: ["smoke", "fast"] },
        { name: "test2", skip: false, timeout: 30000, tags: ["regression", "slow"] },
        { name: "test3", skip: false, timeout: 10000, tags: ["smoke", "medium"] },
        { name: "test4", skip: true, timeout: 5000, tags: ["smoke", "fast"] },
      ];

      const result = testDispatcher(tests, {
        customFilter: (test) => test.tags.includes("smoke") && test.timeout <= 10000,
      });

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name)).toEqual(["test1", "test3"]);
    });

    test("should return empty array when customFilter excludes all tests", () => {
      const tests = [
        { name: "test1", skip: false, category: "unit" },
        { name: "test2", skip: false, category: "integration" },
        { name: "test3", skip: false, category: "e2e" },
      ];

      const result = testDispatcher(tests, {
        customFilter: (test) => test.category === "performance",
      });

      expect(result).toEqual([]);
    });

    test("should work without customFilter (backward compatibility)", () => {
      const tests = [
        { name: "test1", skip: false },
        { name: "test2", skip: true },
        { name: "test3", runOnly: true },
      ];

      const result = testDispatcher(tests);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("test3");
    });

    test("should handle customFilter with runOnly precedence", () => {
      const tests = [
        { name: "unit-test1", skip: false, category: "unit" },
        { name: "unit-test2", skip: true, category: "unit" },
        { name: "integration-test3", runOnly: true, category: "integration" },
        { name: "unit-test4", runOnly: true, category: "unit" },
      ];

      const result = testDispatcher(tests, {
        customFilter: (test) => test.category === "unit",
      });

      // Should only return runOnly tests that match the filter
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("unit-test4");
      expect(result[0].runOnly).toBe(true);
    });

    test("should handle customFilter with numeric properties", () => {
      const tests = [
        { name: "test1", skip: false, priority: 1, duration: 100 },
        { name: "test2", skip: false, priority: 3, duration: 500 },
        { name: "test3", skip: false, priority: 2, duration: 200 },
        { name: "test4", skip: true, priority: 1, duration: 150 },
      ];

      const result = testDispatcher(tests, {
        customFilter: (test) => test.priority <= 2 && test.duration <= 200,
      });

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name)).toEqual(["test1", "test3"]);
    });

    test("should handle customFilter with nested object properties", () => {
      const tests = [
        {
          name: "test1",
          skip: false,
          config: { browser: "chrome", headless: true, viewport: { width: 1920, height: 1080 } },
        },
        {
          name: "test2",
          skip: false,
          config: { browser: "firefox", headless: false, viewport: { width: 1280, height: 720 } },
        },
        {
          name: "test3",
          skip: false,
          config: { browser: "chrome", headless: true, viewport: { width: 1280, height: 720 } },
        },
      ];

      const result = testDispatcher(tests, {
        customFilter: (test) => test.config.browser === "chrome" && test.config.viewport.width >= 1920,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("test1");
    });

    test("should handle customFilter that returns false for all tests", () => {
      const tests = [
        { name: "test1", skip: false },
        { name: "test2", runOnly: true },
        { name: "test3", skip: false },
      ];

      const result = testDispatcher(tests, {
        customFilter: () => false,
      });

      expect(result).toEqual([]);
    });

    test("should handle customFilter that returns true for all tests", () => {
      const tests = [
        { name: "test1", skip: false },
        { name: "test2", skip: true },
        { name: "test3", skip: false },
      ];

      const result = testDispatcher(tests, {
        customFilter: () => true,
      });

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name)).toEqual(["test1", "test3"]);
    });

    test("should handle customFilter with array methods", () => {
      const tests = [
        { name: "test1", skip: false, tags: ["smoke", "regression"] },
        { name: "test2", skip: false, tags: ["integration"] },
        { name: "test3", skip: false, tags: ["smoke", "e2e"] },
        { name: "test4", skip: true, tags: ["smoke"] },
      ];

      const result = testDispatcher(tests, {
        customFilter: (test) => test.tags.some((tag) => ["smoke", "e2e"].includes(tag)),
      });

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name)).toEqual(["test1", "test3"]);
    });

    test("should handle customFilter with regular expressions", () => {
      const tests = [
        { name: "login-happy-path", skip: false },
        { name: "login-error-case", skip: false },
        { name: "logout-standard", skip: false },
        { name: "payment-success", skip: false },
      ];

      const result = testDispatcher(tests, {
        customFilter: (test) => /^login-/.test(test.name),
      });

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name)).toEqual(["login-happy-path", "login-error-case"]);
    });

    test("should preserve test object structure with customFilter", () => {
      const originalTest = {
        name: "complex-test",
        skip: false,
        metadata: {
          author: "John Doe",
          created: new Date("2023-01-01"),
          tags: ["integration", "critical"],
        },
        config: {
          timeout: 30000,
          retries: 3,
        },
      };

      const tests = [originalTest];

      const result = testDispatcher(tests, {
        customFilter: (test) => test.metadata.tags.includes("critical"),
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(originalTest); // Same reference
      expect(result[0]).toEqual(originalTest); // Same content
    });

    test("should handle edge case with empty customFilter result and runOnly", () => {
      const tests = [
        { name: "test1", runOnly: true, category: "unit" },
        { name: "test2", runOnly: true, category: "integration" },
        { name: "test3", skip: false, category: "performance" },
      ];

      const result = testDispatcher(tests, {
        customFilter: (test) => test.category === "performance",
      });

      // runOnly tests don't match filter, so result should be empty
      expect(result).toEqual([]);
    });
  });

  describe("error handling", () => {
    test("should handle null input with shouldThrow: false", () => {
      const result = testDispatcher(null as any, { shouldThrow: false });
      expect(result).toEqual([]);
    });

    test("should handle undefined input with shouldThrow: false", () => {
      const result = testDispatcher(undefined as any, { shouldThrow: false });
      expect(result).toEqual([]);
    });

    test("should throw error for null input with shouldThrow: true", () => {
      expect(() => {
        testDispatcher(null as any, { shouldThrow: true });
      }).toThrow("Expected an array of tests, but received null or undefined");
    });

    test("should throw error for undefined input with shouldThrow: true", () => {
      expect(() => {
        testDispatcher(undefined as any, { shouldThrow: true });
      }).toThrow("Expected an array of tests, but received null or undefined");
    });

    test("should handle non-array input with shouldThrow: false", () => {
      const result = testDispatcher("not an array" as any, { shouldThrow: false });
      expect(result).toEqual([]);
    });

    test("should throw error for non-array input with shouldThrow: true", () => {
      expect(() => {
        testDispatcher("not an array" as any, { shouldThrow: true });
      }).toThrow("Expected an array of tests.");
    });

    test("should handle customFilter throwing an error gracefully", () => {
      const tests = [
        { name: "test1", skip: false },
        { name: "test2", skip: false },
      ];

      expect(() => {
        testDispatcher(tests, {
          customFilter: () => {
            throw new Error("Custom filter error");
          },
        });
      }).toThrow("Custom filter error");
    });

    test("should handle customFilter with null/undefined test objects", () => {
      const tests = [{ name: "test1", skip: false }, null as any, { name: "test3", skip: false }, undefined as any];

      const result = testDispatcher(tests, {
        customFilter: (test) => test && test.name && test.name.includes("test"),
      });

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name)).toEqual(["test1", "test3"]);
    });

    test("should handle customFilter with missing properties", () => {
      const tests = [
        { name: "test1", skip: false, category: "unit" },
        { name: "test2", skip: false }, // missing category
        { name: "test3", skip: false, category: "integration" },
      ];

      const result = testDispatcher(tests, {
        customFilter: (test) => test.category === "unit",
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("test1");
    });
  });
});
