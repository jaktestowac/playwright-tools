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
});
