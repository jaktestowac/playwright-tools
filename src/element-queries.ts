import { Locator } from "@playwright/test";

/**
 * Wait for multiple elements to be visible simultaneously using Promise.all.
 * This is more efficient than waiting for elements sequentially.
 *
 * @param locators - Array of Playwright locators to wait for
 * @param options - Optional configuration object
 * @param options.timeout - Maximum time to wait for each element to be visible (in milliseconds)
 * @returns Promise that resolves when all elements are visible
 *
 * @example
 * ```typescript
 * const elements = [
 *   page.getByText('Header'),
 *   page.getByRole('button', { name: 'Login' }),
 *   page.locator('.footer')
 * ];
 * await waitForElements(elements, { timeout: 10000 });
 * ```
 */
export async function waitForElements(locators: Locator[], options?: { timeout?: number }) {
  const promises = locators.map((locator) => locator.waitFor({ state: "visible", timeout: options?.timeout }));
  await Promise.all(promises);
}

/**
 * Check if an element exists in the DOM without throwing an error.
 * Uses the 'attached' state to determine existence.
 *
 * @param locator - The Playwright locator for the element to check
 * @param options - Optional configuration object
 * @param options.timeout - Maximum time to wait for the element (defaults to 5000ms)
 * @returns Promise that resolves to true if element exists, false otherwise
 *
 * @example
 * ```typescript
 * const exists = await elementExists(page.locator('.optional-banner'));
 * if (exists) {
 *   await page.locator('.optional-banner').click();
 * }
 * ```
 */
export async function elementExists(locator: Locator, options?: { timeout?: number }): Promise<boolean> {
  try {
    await locator.waitFor({ state: "attached", timeout: options?.timeout || 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract text content from multiple elements concurrently using Promise.all.
 * Returns an array of strings with empty strings for elements that have no text content.
 *
 * @param locators - Array of Playwright locators to extract text from
 * @returns Promise that resolves to an array of text content strings
 *
 * @example
 * ```typescript
 * const menuItems = page.locator('.menu-item').all();
 * const texts = await getTextsFromElements(await menuItems);
 * console.log(texts); // ['Home', 'About', 'Contact']
 * ```
 */
export async function getTextsFromElements(locators: Locator[]): Promise<string[]> {
  const promises = locators.map(async (locator) => {
    const text = await locator.textContent();
    return text || "";
  });
  return Promise.all(promises);
}

/**
 * Extract attribute values from multiple elements concurrently using Promise.all.
 * Returns an array with the attribute value for each element, or null if the attribute doesn't exist.
 *
 * @param locators - Array of Playwright locators to extract attributes from
 * @param attributeName - Name of the attribute to extract
 * @returns Promise that resolves to an array of attribute values (string or null)
 *
 * @example
 * ```typescript
 * const links = page.locator('a').all();
 * const hrefs = await getAttributesFromElements(await links, 'href');
 * console.log(hrefs); // ['https://example.com', 'https://google.com', null]
 *
 * const buttons = page.getByRole('button').all();
 * const classes = await getAttributesFromElements(await buttons, 'class');
 * ```
 */
export async function getAttributesFromElements(
  locators: Locator[],
  attributeName: string,
): Promise<(string | null)[]> {
  const promises = locators.map((locator) => locator.getAttribute(attributeName));
  return Promise.all(promises);
}

/**
 * Check if an element is enabled and ready for interaction.
 * Waits for the element to be visible and enabled before returning the result.
 *
 * @param locator - The Playwright locator to check
 * @param options - Optional configuration object
 * @param options.timeout - Maximum time to wait (defaults to 5000ms)
 * @returns Promise that resolves to true if element is enabled, false otherwise
 *
 * @example
 * ```typescript
 * const canSubmit = await isElementEnabled(page.getByRole('button', { name: 'Submit' }));
 * if (canSubmit) {
 *   await page.getByRole('button', { name: 'Submit' }).click();
 * }
 * ```
 */
export async function isElementEnabled(locator: Locator, options?: { timeout?: number }): Promise<boolean> {
  try {
    await locator.waitFor({ state: "visible", timeout: options?.timeout || 5000 });
    return await locator.isEnabled();
  } catch {
    return false;
  }
}

/**
 * Wait for an element to be visible with retry logic.
 * More robust than basic waitFor, with exponential backoff between attempts.
 *
 * @param locator - The Playwright locator to wait for
 * @param options - Optional configuration object
 * @param options.timeout - Maximum total time to wait (in milliseconds)
 * @param options.retries - Number of retry attempts (default: 3)
 * @returns Promise that resolves when element is visible
 *
 * @example
 * ```typescript
 * await waitForVisibleWithRetry(page.getByText('Dynamic content'), {
 *   timeout: 30000,
 *   retries: 5
 * });
 * ```
 */
export async function waitForVisibleWithRetry(locator: Locator, options?: { timeout?: number; retries?: number }) {
  // Validate and sanitize options to prevent infinite loops
  const maxRetries = Math.max(0, Math.min(options?.retries || 3, 20)); // Cap at 20 retries
  const maxTimeout = Math.max(1000, Math.min(options?.timeout || 30000, 300000)); // Cap at 5 minutes
  const retryTimeout = Math.floor(maxTimeout / (maxRetries + 1)); // Ensure we don't exceed total timeout

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await locator.waitFor({ state: "visible", timeout: retryTimeout });
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Add exponential backoff with jitter to prevent thundering herd
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000) + Math.random() * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Extract multiple types of data from an element efficiently.
 * Gets text content, attribute values, and computed styles in a single operation.
 *
 * @param locator - The Playwright locator to extract data from
 * @param options - Optional configuration object
 * @param options.attributes - Array of attribute names to extract
 * @param options.includeText - Whether to include text content (default: true)
 * @param options.includeStyles - Array of CSS properties to extract
 * @returns Promise that resolves to an object containing the extracted data
 *
 * @example
 * ```typescript
 * const data = await extractElementData(page.getByRole('button'), {
 *   attributes: ['id', 'class', 'disabled'],
 *   includeStyles: ['color', 'background-color']
 * });
 * // Returns: { text: 'Click me', id: 'btn-1', class: 'primary', disabled: null, ... }
 * ```
 */
export async function extractElementData(
  locator: Locator,
  options?: {
    attributes?: string[];
    includeText?: boolean;
    includeStyles?: string[];
  },
) {
  const data: Record<string, any> = {};
  const promises: Promise<void>[] = [];

  // Extract text content if requested
  if (options?.includeText !== false) {
    promises.push(
      locator.textContent().then((text) => {
        data.text = text || "";
      }),
    );
  }

  // Extract attributes if requested
  if (options?.attributes?.length) {
    options.attributes.forEach((attr) => {
      promises.push(
        locator.getAttribute(attr).then((value) => {
          data[attr] = value;
        }),
      );
    });
  }

  // Extract computed styles if requested
  if (options?.includeStyles?.length) {
    options.includeStyles.forEach((style) => {
      promises.push(
        locator
          .evaluate((el, styleProperty) => {
            return window.getComputedStyle(el).getPropertyValue(styleProperty);
          }, style)
          .then((value) => {
            data[`style_${style}`] = value;
          }),
      );
    });
  }

  await Promise.all(promises);
  return data;
}

/**
 * Scroll element into view with various scroll strategies.
 * Provides more control over scrolling behavior than basic scrollIntoView.
 *
 * @param locator - The element to scroll to
 * @param options - Optional configuration object
 * @param options.behavior - Scroll behavior ('smooth' or 'instant')
 * @param options.block - Vertical alignment ('start', 'center', 'end', 'nearest')
 * @param options.inline - Horizontal alignment ('start', 'center', 'end', 'nearest')
 * @param options.offset - Additional offset after scrolling (in pixels)
 * @returns Promise that resolves when scrolling is complete
 *
 * @example
 * ```typescript
 * await scrollToElement(page.getByText('Footer'), {
 *   behavior: 'smooth',
 *   block: 'center',
 *   offset: { x: 0, y: -100 } // Scroll 100px above the element
 * });
 * ```
 */
export async function scrollToElement(
  locator: Locator,
  options?: {
    behavior?: "smooth" | "instant";
    block?: "start" | "center" | "end" | "nearest";
    inline?: "start" | "center" | "end" | "nearest";
    offset?: { x?: number; y?: number };
  },
) {
  const behavior = options?.behavior || "smooth";
  const block = options?.block || "start";
  const inline = options?.inline || "nearest";

  await locator.scrollIntoViewIfNeeded();

  await locator.evaluate(
    (element, scrollOptions) => {
      element.scrollIntoView({
        behavior: scrollOptions.behavior,
        block: scrollOptions.block,
        inline: scrollOptions.inline,
      });
    },
    { behavior, block, inline },
  );

  // Apply additional offset if specified
  if (options?.offset) {
    const { x = 0, y = 0 } = options.offset;
    await locator.page().evaluate(
      ([offsetX, offsetY]) => {
        window.scrollBy(offsetX, offsetY);
      },
      [x, y],
    );
  }

  // Wait for scroll animation to complete
  if (behavior === "smooth") {
    await locator.page().waitForTimeout(500);
  }
}
