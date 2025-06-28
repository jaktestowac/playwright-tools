import type { Locator } from "@playwright/test";

/**
 * Assert that multiple elements are visible sequentially.
 * Checks each element one by one, which can be useful for debugging individual failures.
 *
 * @param locators - Array of Playwright locators to check for visibility
 * @param expect - The Playwright expect function
 * @returns Promise that resolves when all elements are confirmed visible
 * @throws AssertionError if any element is not visible
 *
 * @example
 * ```typescript
 * const navigationElements = [
 *   page.getByRole('link', { name: 'Home' }),
 *   page.getByRole('link', { name: 'About' }),
 *   page.getByRole('link', { name: 'Contact' })
 * ];
 * await expectElementsToBeVisible(navigationElements, expect);
 * ```
 */
export async function expectElementsToBeVisible(locators: Locator[], expect: any) {
  for (const locator of locators) {
    await expect(locator).toBeVisible();
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
