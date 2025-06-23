import { test, expect, describe } from "vitest";
import { testDispatcher } from "../src/index";

describe("Playwright Utils - Basic Tests", () => {
  test("testDispatcher should return runOnly tests when present", () => {
    const tests = [
      { name: "test1", skip: false },
      { name: "test2", skip: true },
      { name: "test3", runOnly: true },
      { name: "test4", skip: false },
    ];

    const result = testDispatcher(tests);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("test3");
  });

  test("testDispatcher should filter out skipped tests when no runOnly", () => {
    const tests = [
      { name: "test1", skip: false },
      { name: "test2", skip: true },
      { name: "test3", skip: false },
    ];

    const result = testDispatcher(tests);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.name)).toEqual(["test1", "test3"]);
  });

  test("testDispatcher should return all tests when none are skipped or runOnly", () => {
    const tests = [{ name: "test1" }, { name: "test2" }, { name: "test3" }];

    const result = testDispatcher(tests);
    expect(result).toHaveLength(3);
  });
});
