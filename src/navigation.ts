import { Page, expect } from "@playwright/test";

/**
 * Safely navigate to a URL and wait for the page to be ready for interaction.
 * Combines navigation with loading state checks and optional URL validation.
 *
 * @param page - The Playwright page instance
 * @param url - The URL to navigate to
 * @param options - Optional configuration object
 * @param options.timeout - Maximum time to wait for navigation (in milliseconds)
 * @param options.waitUntil - When to consider navigation complete (default: 'networkidle')
 * @param options.expectedUrlPattern - Pattern to match the final URL against
 * @returns Promise that resolves when navigation is complete
 *
 * @example
 * ```typescript
 * await safeNavigate(page, '/dashboard', {
 *   expectedUrlPattern: /\/dashboard/,
 *   timeout: 10000
 * });
 * ```
 */
export async function safeNavigate(
  page: Page,
  url: string,
  options?: {
    timeout?: number;
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
    expectedUrlPattern?: RegExp;
  },
) {
  const waitUntil = options?.waitUntil || "networkidle";
  await page.goto(url, { waitUntil, timeout: options?.timeout });

  if (options?.expectedUrlPattern) {
    expect(page.url()).toMatch(options.expectedUrlPattern);
  }
}

/**
 * Wait for a page to be fully loaded with no ongoing network activity.
 * Uses the 'networkidle' state to ensure all resources have finished loading.
 *
 * @param page - The Playwright page instance
 * @param options - Optional configuration object
 * @param options.timeout - Maximum time to wait for network idle state (in milliseconds)
 * @returns Promise that resolves when the page is fully loaded
 *
 * @example
 * ```typescript
 * await page.goto('https://example.com');
 * await waitForPageLoad(page, { timeout: 30000 });
 * ```
 */
export async function waitForPageLoad(page: Page, options?: { timeout?: number }) {
  await page.waitForLoadState("networkidle", { timeout: options?.timeout });
}

/**
 * Wait for page to be completely idle (no network activity, animations, etc.).
 * More thorough than basic networkidle, includes checking for animations and timers.
 *
 * @param page - The Playwright page instance
 * @param options - Optional configuration object
 * @param options.timeout - Maximum time to wait (in milliseconds)
 * @param options.networkIdle - Wait for network idle (default: true)
 * @param options.noAnimations - Wait for CSS animations to complete (default: true)
 * @param options.noTimers - Wait for JavaScript timers to complete (default: false)
 * @returns Promise that resolves when page is completely idle
 *
 * @example
 * ```typescript
 * await page.goto('/complex-page');
 * await waitForPageIdle(page, {
 *   timeout: 30000,
 *   networkIdle: true,
 *   noAnimations: true
 * });
 * ```
 */
export async function waitForPageIdle(
  page: Page,
  options?: {
    timeout?: number;
    networkIdle?: boolean;
    noAnimations?: boolean;
    noTimers?: boolean;
  },
) {
  const timeout = options?.timeout || 30000;
  const networkIdle = options?.networkIdle !== false;
  const noAnimations = options?.noAnimations !== false;
  const noTimers = options?.noTimers || false;

  const promises: Promise<void>[] = [];

  // Wait for network idle
  if (networkIdle) {
    promises.push(page.waitForLoadState("networkidle", { timeout }));
  }
  // Wait for animations to complete
  if (noAnimations) {
    promises.push(
      page
        .waitForFunction(
          () => {
            // Check for running CSS animations
            const elements = document.querySelectorAll("*");
            for (const element of elements) {
              const computedStyle = window.getComputedStyle(element);
              if (computedStyle.animationName !== "none" || computedStyle.transitionProperty !== "none") {
                return false;
              }
            }
            return true;
          },
          undefined,
          { timeout },
        )
        .then(() => undefined),
    );
  }

  // Wait for JavaScript timers to complete
  if (noTimers) {
    promises.push(
      page
        .waitForFunction(
          () => {
            // This is a simplified check - in reality, you might want to track specific timers
            return (
              !document.querySelector('[data-loading="true"]') &&
              !document.querySelector(".loading") &&
              !document.querySelector(".spinner")
            );
          },
          undefined,
          { timeout },
        )
        .then(() => undefined),
    );
  }

  await Promise.all(promises);

  // Additional wait to ensure everything has settled
  await page.waitForTimeout(100);
}
