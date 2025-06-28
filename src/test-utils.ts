import { TestDispatcherOptions } from "./types";

/**
 * Filter and dispatch tests based on skip and runOnly flags.
 * Implements test selection logic similar to Jest's test.only() and test.skip().
 *
 * Rules:
 * - If any test has `runOnly: true`, only those tests will be returned
 * - Otherwise, all tests except those with `skip: true` will be returned
 * * @template T - Test object type that extends the base test interface
 * @param tests - Array of test objects with optional skip and runOnly properties
 * @param options - Configuration options for test filtering
 * @param options.shouldThrow - Whether to throw errors on invalid input (default: false)
 * @param options.customFilter - Optional function to apply additional filtering to selected tests
 * @returns Filtered array of tests that should be executed
 * * @example
 * ```typescript
 * const tests = [
 *   { name: 'test1', testData: 'some data', skip: false },
 *   { name: 'test2', testData: 'other data', skip: true },
 *   { name: 'test3', testData: 'more data', runOnly: true },
 *   { name: 'test4', testData: 'additional data' }
 * ];
 *
 * const toRun = testDispatcher(tests);
 * // Returns: [{ name: 'test3', runOnly: true }] because runOnly takes precedence
 *
 * // Using customFilter to filter by test name pattern
 * const filteredTests = testDispatcher(tests, {
 *   customFilter: (test) => test.name.includes('test1')
 * });
 *
 * // then:
 * toRun.forEach(test => {
 *   test(name, async ({ page }) => {
 *     const { testData } = test;
 *     // Use testData in the test implementation
 *     await page.goto('/');
 *   });
 * });
 * ```
 */
export function testDispatcher<T extends { skip?: boolean; runOnly?: boolean }>(
  tests: T[],
  options: TestDispatcherOptions<T> = {},
): T[] {
  const { shouldThrow = false, customFilter } = options;

  if (tests === undefined || tests === null) {
    if (shouldThrow) {
      throw new Error("Expected an array of tests, but received null or undefined");
    }
    return [];
  }

  if (!Array.isArray(tests)) {
    if (shouldThrow) {
      throw new Error("Expected an array of tests.");
    }
    return [];
  }

  if (tests.length === 0) return [];

  const runOnlyTests = tests.filter((test) => test?.runOnly);
  if (runOnlyTests.length > 0) {
    return customFilter ? runOnlyTests.filter(customFilter) : runOnlyTests;
  }

  const filteredTests = tests.filter((test) => !test?.skip);
  return customFilter ? filteredTests.filter(customFilter) : filteredTests;
}
