import type { BrowserContext, Page } from "@playwright/test";

export type SafeNavigateOptions = {
  timeout?: number;
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  /** If provided and `expect` is passed, validates the final URL against this regex. */
  expectedUrlPattern?: RegExp;
  /** Docs option: wait for this selector after navigation. */
  waitForSelector?: string;
  /** Docs option: wait for network idle after navigation (default is already networkidle). */
  waitForNetworkIdle?: boolean;
  /** Docs option: wait for a function to evaluate to true after navigation. */
  waitForFunction?: Parameters<Page["waitForFunction"]>[0];
  /** Docs option: expected page title after navigation. */
  expectedTitle?: string | RegExp;
};

export type WaitForPageLoadOptions = {
  timeout?: number;
  /** Wait for `networkidle` state. Default: true (backwards compatible). */
  networkIdle?: boolean;
  /** Also wait for DOMContentLoaded state. Default: false. */
  domContentLoaded?: boolean;
  /** Docs option: required elements to be visible before returning. */
  requiredElements?: string[];
};

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
 * @param expect - The Playwright expect function (optional, for URL validation)
 * @returns Promise that resolves when navigation is complete
 *
 * @example
 * ```typescript
 * await safeNavigate(page, '/dashboard', {
 *   expectedUrlPattern: /\/dashboard/,
 *   timeout: 10000
 * }, expect);
 * ```
 */
export async function safeNavigate(page: Page, url: string, options?: SafeNavigateOptions, expect?: any) {
  const waitUntil = options?.waitUntil || "networkidle";
  await page.goto(url, { waitUntil, timeout: options?.timeout });

  // Post-navigation waiting helpers (docs-compatible)
  if (options?.waitForSelector) {
    await page.waitForSelector(options.waitForSelector, { timeout: options?.timeout });
  }
  if (options?.waitForNetworkIdle) {
    await page.waitForLoadState("networkidle", { timeout: options?.timeout });
  }
  if (options?.waitForFunction) {
    await page.waitForFunction(options.waitForFunction, undefined, { timeout: options?.timeout });
  }
  if (options?.expectedTitle) {
    const title = await page.title();
    if (typeof options.expectedTitle === "string") {
      if (title !== options.expectedTitle) {
        throw new Error(
          `Expected page title to be ${JSON.stringify(options.expectedTitle)}, but got ${JSON.stringify(title)}.`,
        );
      }
    } else if (!options.expectedTitle.test(title)) {
      throw new Error(`Expected page title to match ${options.expectedTitle}, but got ${JSON.stringify(title)}.`);
    }
  }

  if (options?.expectedUrlPattern && expect) {
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
  const opts = options as WaitForPageLoadOptions | undefined;
  const timeout = opts?.timeout;

  // Backwards compatible default: only wait for networkidle.
  const waitNetworkIdle = opts?.networkIdle !== false;
  const waitDomContentLoaded = opts?.domContentLoaded === true;
  const requiredElements = opts?.requiredElements || [];

  if (waitDomContentLoaded) {
    await page.waitForLoadState("domcontentloaded", { timeout });
  }
  if (waitNetworkIdle) {
    await page.waitForLoadState("networkidle", { timeout });
  }
  for (const selector of requiredElements) {
    await page.waitForSelector(selector, { state: "visible", timeout });
  }
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

/**
 * Assert that the current URL matches an expected value.
 * If you want to wait for navigation/redirect first, prefer `waitForUrlChange`.
 */
export async function assertCurrentUrl(
  page: Page,
  expected: string | RegExp,
  options?: {
    timeout?: number;
  },
) {
  // If timeout is provided, allow Playwright to wait for URL match first.
  if (options?.timeout) {
    await page.waitForURL(expected as any, { timeout: options.timeout });
  }

  const current = page.url();
  if (typeof expected === "string") {
    if (current !== expected) {
      throw new Error(`Expected current URL to be ${JSON.stringify(expected)}, but got ${JSON.stringify(current)}.`);
    }
  } else if (!expected.test(current)) {
    throw new Error(`Expected current URL to match ${expected}, but got ${JSON.stringify(current)}.`);
  }
}

export async function goBack(
  page: Page,
  options?: {
    waitForLoad?: boolean;
    timeout?: number;
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  },
) {
  await page.goBack({ timeout: options?.timeout, waitUntil: options?.waitUntil });
  if (options?.waitForLoad) {
    await waitForPageLoad(page, { timeout: options?.timeout });
  }
}

export async function goForward(
  page: Page,
  options?: {
    waitForLoad?: boolean;
    timeout?: number;
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  },
) {
  await page.goForward({ timeout: options?.timeout, waitUntil: options?.waitUntil });
  if (options?.waitForLoad) {
    await waitForPageLoad(page, { timeout: options?.timeout });
  }
}

export async function isPageReady(
  page: Page,
  options?: {
    checkElements?: string[];
    checkNetworkIdle?: boolean;
    timeout?: number;
  },
): Promise<boolean> {
  try {
    if (options?.checkNetworkIdle) {
      await page.waitForLoadState("networkidle", { timeout: options?.timeout });
    }
    for (const selector of options?.checkElements || []) {
      await page.waitForSelector(selector, { state: "visible", timeout: options?.timeout });
    }
    return true;
  } catch {
    return false;
  }
}

export async function waitForUrlChange(
  page: Page,
  options?: {
    expectedUrl?: string | RegExp;
    timeout?: number;
  },
) {
  if (options?.expectedUrl) {
    await page.waitForURL(options.expectedUrl as any, { timeout: options.timeout });
    return;
  }

  const startUrl = page.url();
  await page.waitForFunction((initial) => window.location.href !== initial, startUrl, {
    timeout: options?.timeout,
  });
}

export async function handleRedirect(
  page: Page,
  options: {
    fromUrl?: string | RegExp;
    toUrl: string | RegExp;
    timeout?: number;
  },
) {
  if (options.fromUrl) {
    await assertCurrentUrl(page, options.fromUrl, { timeout: options.timeout });
  }
  await page.waitForURL(options.toUrl as any, { timeout: options.timeout });
}

export async function navigateToHistoryPosition(
  page: Page,
  offset: number,
  options?: {
    waitForLoad?: boolean;
    timeout?: number;
  },
) {
  if (offset === 0) return;
  const steps = Math.abs(offset);
  for (let i = 0; i < steps; i++) {
    if (offset < 0) {
      await goBack(page, { waitForLoad: options?.waitForLoad, timeout: options?.timeout });
    } else {
      await goForward(page, { waitForLoad: options?.waitForLoad, timeout: options?.timeout });
    }
  }
}

export async function openNewTab(
  context: BrowserContext,
  url: string,
  options?: {
    timeout?: number;
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  },
) {
  const page = await context.newPage();
  await page.goto(url, { timeout: options?.timeout, waitUntil: options?.waitUntil || "networkidle" });
  return page;
}

export async function switchToTab(page: Page) {
  // `bringToFront` exists in Playwright; keep this helper tiny and safe.
  if (typeof (page as any).bringToFront === "function") {
    await (page as any).bringToFront();
  }
  return page;
}

export async function closeTab(page: Page) {
  await page.close();
}

export async function navigateWithRetry(
  page: Page,
  url: string,
  options?: SafeNavigateOptions & {
    maxRetries?: number;
    retryDelay?: number;
  },
) {
  const maxRetries = options?.maxRetries ?? 3;
  const retryDelay = options?.retryDelay ?? 1000;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await safeNavigate(page, url, options);
      return;
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;
      await page.waitForTimeout(retryDelay);
    }
  }

  throw lastError;
}

export async function navigateSPA(
  page: Page,
  route: string,
  options?: {
    waitForPushState?: boolean;
    waitForSelector?: string;
    timeout?: number;
  },
) {
  await page.goto(route, { waitUntil: "domcontentloaded", timeout: options?.timeout });
  if (options?.waitForPushState) {
    await page.waitForURL(route as any, { timeout: options?.timeout });
  }
  if (options?.waitForSelector) {
    await page.waitForSelector(options.waitForSelector, { timeout: options?.timeout });
  }
}
