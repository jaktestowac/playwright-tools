import type { Locator } from "@playwright/test";

/**
 * Wait for specific text to appear in any of the provided locators.
 * Polls all locators continuously until the text is found or timeout is reached.
 *
 * @param locators - Array of Playwright locators to search for the text
 * @param text - The text to search for (partial match)
 * @param options - Optional configuration object
 * @param options.timeout - Maximum time to wait for the text to appear (default: 30000ms)
 * @returns Promise that resolves to the locator that contains the text
 * @throws Error if text is not found within the timeout period
 *
 * @example
 * ```typescript
 * const statusElements = [
 *   page.locator('.status-bar'),
 *   page.locator('.notification'),
 *   page.locator('.alert')
 * ];
 * const elementWithSuccess = await waitForTextInAnyElement(statusElements, 'Success');
 * await elementWithSuccess.click(); // Click the element that contains "Success"
 * ```
 */
export async function waitForTextInAnyElement(
  locators: Locator[],
  text: string,
  options?: { timeout?: number },
): Promise<Locator> {
  // Validate and sanitize timeout to prevent infinite loops
  const maxTimeout = Math.max(10, Math.min(options?.timeout || 30000, 300000)); // Cap at 5 minutes
  const startTime = Date.now();
  const pollInterval = 100; // Fixed polling interval

  while (Date.now() - startTime < maxTimeout) {
    for (const locator of locators) {
      try {
        const content = await locator.textContent();
        if (content && content.includes(text)) {
          return locator;
        }
      } catch {
        // Continue checking other locators
      }
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Text "${text}" not found in any of the provided elements within ${maxTimeout}ms`);
}

/**
 * Wait for any of the provided conditions to be met.
 * Similar to Promise.race but for Playwright wait conditions.
 *
 * @param conditions - Array of async functions that represent wait conditions
 * @param options - Optional configuration object
 * @param options.timeout - Maximum time to wait for any condition (in milliseconds)
 * @returns Promise that resolves with the index of the first condition that was met
 *
 * @example
 * ```typescript
 * const resultIndex = await waitForAnyCondition([
 *   () => page.getByText('Success').waitFor({ state: 'visible' }),
 *   () => page.getByText('Error').waitFor({ state: 'visible' }),
 *   () => page.getByText('Loading').waitFor({ state: 'hidden' })
 * ], { timeout: 10000 });
 *
 * if (resultIndex === 0) console.log('Success message appeared');
 * ```
 */
export async function waitForAnyCondition(
  conditions: (() => Promise<void>)[],
  options?: { timeout?: number },
): Promise<number> {
  const timeout = options?.timeout || 30000;

  // Convert condition promises to catch errors and continue waiting
  const promises = conditions.map((condition, index) =>
    condition()
      .then(() => index)
      .catch(() => {
        // Return a promise that never resolves so it doesn't interfere with the race
        // This could potentially cause a memory leak if conditions keep failing
        return new Promise<number>(() => {
          // Empty executor - this promise will never resolve or reject
        });
      }),
  );

  // Add a timeout promise that rejects
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`None of the conditions were met within ${timeout}ms`));
    }, timeout);
    
    // Clean up timeout if any condition succeeds
    Promise.race(promises).then(() => {
      clearTimeout(timeoutId);
    }).catch(() => {
      // Ignore errors from individual conditions
    });
  });

  return Promise.race([...promises, timeoutPromise]);
}

/**
 * Measure the execution time of an async operation.
 * Useful for performance testing and debugging slow operations.
 *
 * @param operation - The async operation to measure
 * @param name - Name for the operation (used in logging)
 * @returns Promise that resolves to an object with the result and timing info
 *
 * @example
 * ```typescript
 * const { result, duration, name } = await measureTime(
 *   () => page.goto('/slow-page'),
 *   'page-navigation'
 * );
 * console.log(`${name} took ${duration}ms`);
 * ```
 */
export async function measureTime<T>(
  operation: () => Promise<T>,
  name: string,
): Promise<{ result: T; duration: number; name: string }> {
  const startTime = Date.now();
  const result = await operation();
  const duration = Date.now() - startTime;

  return { result, duration, name };
}
