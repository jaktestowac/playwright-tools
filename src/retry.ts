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
  // Validate and sanitize options to prevent infinite loops
  const maxRetries = Math.max(0, Math.min(options?.maxRetries || 5, 100)); // Cap at 100 to prevent excessive retries
  const baseDelay = Math.max(0, Math.min(options?.baseDelay || 1000, 60000)); // Cap at 60 seconds
  const maxDelay = Math.max(baseDelay, Math.min(options?.maxDelay || 10000, 300000)); // Cap at 5 minutes

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await action();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff, capped at maxDelay
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      
      // Add a small random jitter to prevent thundering herd problems
      const jitter = Math.random() * 100;
      const totalDelay = delay + jitter;
      
      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  // This should never be reached due to the throw in the loop, but added for safety
  throw new Error("Retry action failed unexpectedly");
}
