import { Locator } from "@playwright/test";

/**
 * Check accessibility properties of an element.
 * Validates ARIA attributes and accessibility-related properties.
 *
 * @param locator - The Playwright locator to check
 * @param options - Optional configuration object
 * @param options.checkRole - Whether to validate the ARIA role
 * @param options.checkLabel - Whether to validate accessible name/label
 * @param options.checkDescription - Whether to validate description
 * @returns Promise that resolves to accessibility information
 *
 * @example
 * ```typescript
 * const a11y = await checkAccessibility(page.getByRole('button'), {
 *   checkRole: true,
 *   checkLabel: true
 * });
 * expect(a11y.role).toBe('button');
 * expect(a11y.accessibleName).toBeTruthy();
 * ```
 */
export async function checkAccessibility(
  locator: Locator,
  options?: {
    checkRole?: boolean;
    checkLabel?: boolean;
    checkDescription?: boolean;
  },
) {
  const a11yInfo: Record<string, any> = {};

  if (options?.checkRole) {
    a11yInfo.role =
      (await locator.getAttribute("role")) || (await locator.evaluate((el) => (el as any).getAttribute("role")));
  }

  if (options?.checkLabel) {
    a11yInfo.accessibleName = await locator.evaluate(
      (el) =>
        (el as any).getAttribute("aria-label") ||
        (el as any).getAttribute("aria-labelledby") ||
        (el as any).textContent,
    );
  }

  if (options?.checkDescription) {
    a11yInfo.accessibleDescription = await locator.evaluate(
      (el) => (el as any).getAttribute("aria-describedby") || (el as any).getAttribute("title"),
    );
  }

  // Check if element is focusable
  a11yInfo.focusable = await locator.evaluate((el) => {
    return (
      el.tabIndex >= 0 ||
      ["INPUT", "BUTTON", "SELECT", "TEXTAREA", "A"].includes(el.tagName) ||
      el.hasAttribute("contenteditable")
    );
  });

  return a11yInfo;
}
