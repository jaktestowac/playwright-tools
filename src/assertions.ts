import type { Locator, expect as ExpectType } from "@playwright/test";

/**
 * Options for assertion functions
 */
export interface AssertionOptions {
  /** Whether to use soft assertions (continue on failure) */
  soft?: boolean;
  timeout?: number;
  /** Whether to run assertions concurrently for better performance */
  concurrent?: boolean;
}

/**
 * Type for the Playwright expect function
 */
type ExpectFunction = typeof ExpectType;

/**
 * Assert that multiple elements are visible with support for both sequential and concurrent execution.
 * 
 * **Sequential mode (default)**: Checks each element one by one, making it easier to identify 
 * which specific element failed during debugging.
 * 
 * **Concurrent mode**: Uses Promise.all to check all elements simultaneously for better performance,
 * especially useful when checking many elements or when network latency is a factor.
 *
 * @param locators - Array of Playwright locators to check for visibility
 * @param expect - The Playwright expect function
 * @param options - Configuration options for assertions
 * @param options.soft - Whether to use soft assertions (continue on failure)
 * @param options.timeout - Timeout in milliseconds for each visibility check
 * @param options.concurrent - Whether to run assertions concurrently for better performance
 * @returns Promise that resolves when all elements are confirmed visible
 * @throws AssertionError if any element is not visible (unless using soft assertions)
 *
 * @example
 * ```typescript
 * const navigationElements = [
 *   page.getByRole('link', { name: 'Home' }),
 *   page.getByRole('link', { name: 'About' }),
 *   page.getByRole('link', { name: 'Contact' })
 * ];
 * 
 * // Sequential assertions (default) - best for debugging
 * await expectElementsToBeVisible(navigationElements, expect);
 * 
 * // Soft assertions - continue checking even if some fail
 * await expectElementsToBeVisible(navigationElements, expect, { soft: true });
 * 
 * // Concurrent assertions - faster execution, all elements checked simultaneously
 * await expectElementsToBeVisible(navigationElements, expect, { concurrent: true });
 * 
 * // Combined options - soft + concurrent with custom timeout
 * await expectElementsToBeVisible(navigationElements, expect, { 
 *   soft: true, 
 *   concurrent: true, 
 *   timeout: 10000 
 * });
 * ```
 */
export async function expectElementsToBeVisible(
  locators: Locator[], 
  expect: ExpectFunction, 
  options: AssertionOptions = {}
): Promise<void> {
  const { soft = false, concurrent = false } = options;
  const expectFn = soft ? expect.soft : expect;
  
  if (concurrent) {
    await expectAll(locators.map(locator => 
      () => expectFn(locator).toBeVisible({ timeout: options.timeout })
    ));
  } else {
    for (const locator of locators) {
      await expectFn(locator).toBeVisible({ timeout: options.timeout });
    }
  }
}

/**
 * Run multiple expect assertions concurrently using Promise.all.
 * More efficient than sequential assertions when the order doesn't matter.
 * All assertions will be executed simultaneously, but if any fail, you'll get the first failure.
 *
 * @param expectations - Array of async functions that return expect assertions
 * @returns Promise that resolves when all expectations pass
 * @throws AssertionError if any expectation fails
 *
 * @example
 * ```typescript
 * await expectAll([
 *   () => expect(page.getByText('Welcome')).toBeVisible(),
 *   () => expect(page.getByRole('button', { name: 'Login' })).toBeEnabled(),
 *   () => expect(page.locator('.header')).toHaveClass(/active/),
 *   () => expect(page.getByLabel('Username')).toHaveValue('john.doe')
 * ]);
 * ```
 */
export async function expectAll(expectations: (() => Promise<void>)[]): Promise<void> {
    await Promise.all(expectations.map((expectation) => expectation()));
}
