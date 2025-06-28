import { Page, Locator } from "@playwright/test";
import { SafeInteractionOptions } from "./types";

/**
 * Wait for an element to be visible and clickable before clicking.
 * Ensures the element is ready for interaction before performing the click action.
 *
 * @param locator - The Playwright locator for the element to click
 * @param options - Optional configuration object
 * @param options.timeout - Maximum time to wait for the element to be visible (in milliseconds)
 * @param options.catchErrors - Whether to catch and handle errors gracefully (default: false)
 * @param options.onError - Callback function called when an error occurs
 * @param options.force - Whether to bypass actionability checks (default: false)
 * @param options.noWaitAfter - Whether to wait for navigation after the action (default: false)
 * @param options.trial - Whether to perform the action in trial mode (default: false)
 * @returns Promise that resolves when the click action is completed, or rejects if catchErrors is false
 *
 * @example
 * ```typescript
 * // Basic usage - throws on error
 * await safeClick(page.getByRole('button', { name: 'Submit' }));
 * 
 * // With error handling - returns false on error
 * const clicked = await safeClick(page.locator('#optional-button'), { 
 *   catchErrors: true,
 *   timeout: 5000 
 * });
 * 
 * // With custom error handler
 * await safeClick(page.locator('#button'), {
 *   catchErrors: true,
 *   onError: (error, context) => console.log(`Click failed: ${context}`, error)
 * });
 * ```
 */
export async function safeClick(locator: Locator, options?: SafeInteractionOptions): Promise<boolean> {
  const { catchErrors = false, onError, timeout, ...clickOptions } = options || {};
  
  try {
    await locator.waitFor({ state: "visible", timeout });
    // Only pass clickOptions if they contain actual values
    if (Object.keys(clickOptions).length > 0) {
      await locator.click(clickOptions);
    } else {
      await locator.click();
    }
    return true;
  } catch (error) {
    const context = `safeClick on ${await getLocatorDescription(locator)}`;
    
    if (onError) {
      onError(error as Error, context);
    }
    
    if (catchErrors) {
      return false;
    }
    
    throw error;
  }
}

/**
 * Fill input field with text after ensuring it's ready for interaction.
 * Clears any existing content before filling with the new text.
 *
 * @param locator - The Playwright locator for the input element
 * @param text - The text to fill into the input field
 * @param options - Optional configuration object
 * @param options.timeout - Maximum time to wait for the element to be visible (in milliseconds)
 * @param options.catchErrors - Whether to catch and handle errors gracefully (default: false)
 * @param options.onError - Callback function called when an error occurs
 * @param options.force - Whether to bypass actionability checks (default: false)
 * @param options.noWaitAfter - Whether to wait for navigation after the action (default: false)
 * @param options.trial - Whether to perform the action in trial mode (default: false)
 * @returns Promise that resolves when the fill action is completed, or rejects if catchErrors is false
 *
 * @example
 * ```typescript
 * // Basic usage - throws on error
 * await safeFill(page.getByLabel('Username'), 'john.doe');
 * 
 * // With error handling - returns false on error
 * const filled = await safeFill(page.locator('#optional-input'), 'value', { 
 *   catchErrors: true,
 *   timeout: 5000 
 * });
 * ```
 */
export async function safeFill(locator: Locator, text: string, options?: SafeInteractionOptions): Promise<boolean> {
  const { catchErrors = false, onError, timeout, ...fillOptions } = options || {};
  
  try {
    await locator.waitFor({ state: "visible", timeout });
    await locator.clear();
    // Only pass fillOptions if they contain actual values
    if (Object.keys(fillOptions).length > 0) {
      await locator.fill(text, fillOptions);
    } else {
      await locator.fill(text);
    }
    return true;
  } catch (error) {
    const context = `safeFill on ${await getLocatorDescription(locator)} with text: "${text}"`;
    
    if (onError) {
      onError(error as Error, context);
    }
    
    if (catchErrors) {
      return false;
    }
    
    throw error;
  }
}

/**
 * Fill multiple form fields efficiently in a single operation.
 * Clears and fills each field after ensuring it's ready for interaction.
 *
 * @param formData - Array of objects with locator and value pairs
 * @param options - Optional configuration object
 * @param options.timeout - Maximum time to wait for each field (in milliseconds)
 * @param options.catchErrors - Whether to catch and handle errors gracefully (default: false)
 * @param options.onError - Callback function called when an error occurs
 * @param options.force - Whether to bypass actionability checks (default: false)
 * @param options.noWaitAfter - Whether to wait for navigation after the action (default: false)
 * @param options.trial - Whether to perform the action in trial mode (default: false)
 * @returns Promise that resolves when all fields are filled, or rejects if catchErrors is false
 *
 * @example
 * ```typescript
 * // Basic usage - throws on first error
 * await fillForm([
 *   { locator: page.getByLabel('Username'), value: 'john.doe' },
 *   { locator: page.getByLabel('Email'), value: 'john@example.com' },
 *   { locator: page.getByLabel('Password'), value: 'securepass123' }
 * ]);
 * 
 * // With error handling - continues on errors
 * const results = await fillForm([
 *   { locator: page.locator('#required'), value: 'required' },
 *   { locator: page.locator('#optional'), value: 'optional' }
 * ], { catchErrors: true });
 * ```
 */
export async function fillForm(formData: Array<{ locator: Locator; value: string }>, options?: SafeInteractionOptions): Promise<boolean> {
  const { catchErrors = false, onError, ...fillOptions } = options || {};
  
  try {
    const promises = formData.map(({ locator, value }) => safeFill(locator, value, { ...fillOptions, catchErrors: false }));
    await Promise.all(promises);
    return true;
  } catch (error) {
    const context = `fillForm with ${formData.length} fields`;
    
    if (onError) {
      onError(error as Error, context);
    }
    
    if (catchErrors) {
      return false;
    }
    
    throw error;
  }
}

/**
 * Helper function to get a readable description of a locator for error messages
 */
async function getLocatorDescription(locator: Locator): Promise<string> {
  try {
    // Try to get the selector string
    const selector = await locator.evaluate(el => {
      if (el.id) return `#${el.id}`;
      if (el.className) return `.${el.className.split(' ')[0]}`;
      return el.tagName.toLowerCase();
    });
    return selector;
  } catch {
    // Fallback to a generic description
    return "element";
  }
}
