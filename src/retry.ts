/**
 * Retry an asynchronous action until it succeeds with exponential backoff strategy.
 * Similar to retryAction but with higher default retry count for persistent operations.
 * Useful for operations that are expected to eventually succeed but may fail multiple times.
 *
 * @template T - The return type of the action function
 * @param action - The async function to retry until success
 * @param options - Optional configuration object for retry behavior
 * @param options.maxRetries - Maximum number of retry attempts (default: 5)
 * @param options.baseDelay - Initial delay between retries in milliseconds (default: 1000)
 * @param options.maxDelay - Maximum delay between retries in milliseconds (default: 10000)
 * @returns Promise that resolves to the action's return value on success
 * @throws The last error encountered if all retry attempts fail
 *
 * @example
 * ```typescript
 * // Retry API call until server responds
 * const data = await retryAction(
 *   async () => {
 *     const response = await fetch('/api/health');
 *     if (!response.ok) throw new Error('Server not ready');
 *     return response.json();
 *   },
 *   { maxRetries: 10, baseDelay: 500 }
 * );
 *
 * // Retry element interaction until successful
 * await retryAction(
 *   async () => {
 *     await page.getByText('Dynamic Content').click();
 *     await expect(page.getByText('Success')).toBeVisible();
 *   },
 *   { maxRetries: 8, baseDelay: 200 }
 * );
 *
 * // Retry form submission until validation passes
 * await retryAction(
 *   async () => {
 *     await page.getByRole('button', { name: 'Submit' }).click();
 *     await expect(page.getByText('Form submitted successfully')).toBeVisible();
 *     await expect(page.locator('.error-message')).not.toBeVisible();
 *   },
 *   { maxRetries: 5, baseDelay: 1000 }
 * );
 * ```
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  options?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  },
): Promise<T> {
  const maxRetries = options?.maxRetries || 5;
  const baseDelay = options?.baseDelay || 1000;
  const maxDelay = options?.maxDelay || 10000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await action();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Retry action failed unexpectedly");
}
