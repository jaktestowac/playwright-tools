import { Page } from "@playwright/test";

/**
 * Wait for a specific network request to complete.
 * Useful for testing API interactions and ensuring data is loaded.
 *
 * @param page - The Playwright page instance
 * @param urlPattern - Pattern to match the request URL
 * @param options - Optional configuration object
 * @param options.method - HTTP method to match (default: any)
 * @param options.timeout - Maximum time to wait (in milliseconds)
 * @param options.status - Expected response status code
 * @returns Promise that resolves to the matched response
 *
 * @example
 * ```typescript
 * const response = await waitForNetworkRequest(page, '/api/users', {
 *   method: 'GET',
 *   status: 200,
 *   timeout: 10000
 * });
 * expect(response.ok()).toBe(true);
 * ```
 */
export async function waitForNetworkRequest(
  page: Page,
  urlPattern: string,
  options?: {
    method?: string;
    timeout?: number;
    status?: number;
  },
) {
  const timeout = options?.timeout || 30000;
  const expectedMethod = options?.method?.toUpperCase();
  const expectedStatus = options?.status;

  return await page.waitForResponse(
    (response) => {
      const url = response.url();
      const method = response.request().method();
      const status = response.status();

      // Check URL pattern
      const urlMatches = url.includes(urlPattern) || new RegExp(urlPattern).test(url);

      // Check method if specified
      const methodMatches = !expectedMethod || method === expectedMethod;

      // Check status if specified
      const statusMatches = !expectedStatus || status === expectedStatus;

      return urlMatches && methodMatches && statusMatches;
    },
    { timeout },
  );
}
