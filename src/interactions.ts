import { Page, Locator } from "@playwright/test";

/**
 * Wait for an element to be visible and clickable before clicking.
 * Ensures the element is ready for interaction before performing the click action.
 *
 * @param locator - The Playwright locator for the element to click
 * @param options - Optional configuration object
 * @param options.timeout - Maximum time to wait for the element to be visible (in milliseconds)
 * @returns Promise that resolves when the click action is completed
 *
 * @example
 * ```typescript
 * await safeClick(page.getByRole('button', { name: 'Submit' }));
 * await safeClick(page.locator('#my-button'), { timeout: 10000 });
 * ```
 */
export async function safeClick(locator: Locator, options?: { timeout?: number }) {
  await locator.waitFor({ state: "visible", timeout: options?.timeout });
  await locator.click();
}

/**
 * Fill input field with text after ensuring it's ready for interaction.
 * Clears any existing content before filling with the new text.
 *
 * @param locator - The Playwright locator for the input element
 * @param text - The text to fill into the input field
 * @param options - Optional configuration object
 * @param options.timeout - Maximum time to wait for the element to be visible (in milliseconds)
 * @returns Promise that resolves when the fill action is completed
 *
 * @example
 * ```typescript
 * await safeFill(page.getByLabel('Username'), 'john.doe');
 * await safeFill(page.locator('#email'), 'test@example.com', { timeout: 5000 });
 * ```
 */
export async function safeFill(locator: Locator, text: string, options?: { timeout?: number }) {
  await locator.waitFor({ state: "visible", timeout: options?.timeout });
  await locator.clear();
  await locator.fill(text);
}

/**
 * Fill multiple form fields efficiently in a single operation.
 * Clears and fills each field after ensuring it's ready for interaction.
 *
 * @param formData - Array of objects with locator and value pairs
 * @param options - Optional configuration object
 * @param options.timeout - Maximum time to wait for each field (in milliseconds)
 * @returns Promise that resolves when all fields are filled
 *
 * @example
 * ```typescript
 * await fillForm([
 *   { locator: page.getByLabel('Username'), value: 'john.doe' },
 *   { locator: page.getByLabel('Email'), value: 'john@example.com' },
 *   { locator: page.getByLabel('Password'), value: 'securepass123' }
 * ]);
 * ```
 */
export async function fillForm(formData: Array<{ locator: Locator; value: string }>, options?: { timeout?: number }) {
  const promises = formData.map(({ locator, value }) => safeFill(locator, value, options));
  await Promise.all(promises);
}
