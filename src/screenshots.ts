import type { Page, Locator } from "@playwright/test";

/**
 * Take a full-page screenshot with an ISO timestamp in the filename.
 * Automatically generates a unique filename using the current date and time.
 *
 * @param page - The Playwright page instance
 * @param name - Base name for the screenshot file
 * @param options - Optional configuration object
 * @param options.path - Directory path where the screenshot should be saved
 * @returns Promise that resolves to the full path of the saved screenshot
 *
 * @example
 * ```typescript
 * const screenshotPath = await takeTimestampedScreenshot(page, 'login-page');
 * // Returns: 'login-page-2025-06-22T10-30-45-123Z.png'
 *
 * await takeTimestampedScreenshot(page, 'error', { path: './screenshots' });
 * // Saves to: './screenshots/error-2025-06-22T10-30-45-123Z.png'
 * ```
 */
export async function takeTimestampedScreenshot(page: Page, name: string, options?: { path?: string }) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${name}-${timestamp}.png`;
  const fullPath = options?.path ? `${options.path}/${filename}` : filename;

  await page.screenshot({ path: fullPath, fullPage: true });
  return fullPath;
}

/**
 * Take a screenshot with debug information overlay.
 * Includes timestamp, test context, and optionally highlights specific elements.
 *
 * @param page - The Playwright page instance
 * @param name - Base name for the screenshot
 * @param options - Optional configuration object
 * @param options.path - Directory path for the screenshot
 * @param options.highlightElements - Elements to highlight with a red border
 * @param options.annotations - Text annotations to add to the screenshot
 * @returns Promise that resolves to the screenshot path
 *
 * @example
 * ```typescript
 * await debugScreenshot(page, 'form-validation-error', {
 *   highlightElements: [page.getByLabel('Username'), page.getByText('Error message')],
 *   annotations: ['Username field should be highlighted', 'Error message visible']
 * });
 * ```
 */
export async function debugScreenshot(
  page: Page,
  name: string,
  options?: {
    path?: string;
    highlightElements?: Locator[];
    annotations?: string[];
  },
) {
  // Add red border to highlighted elements
  if (options?.highlightElements?.length) {
    for (const element of options.highlightElements) {
      await element.evaluate((el) => {
        el.style.border = "3px solid red";
        el.style.boxShadow = "0 0 10px red";
      });
    }
  }

  // Add timestamp overlay
  await page.addStyleTag({
    content: `
      .debug-overlay {
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        font-family: monospace;
        z-index: 999999;
        border-radius: 5px;
      }
    `,
  });

  const timestamp = new Date().toISOString();
  const annotations = options?.annotations || [];
  const overlayContent = [`Time: ${timestamp}`, `Test: ${name}`, ...annotations].join("\\n");

  await page.evaluate((content) => {
    const overlay = document.createElement("div");
    overlay.className = "debug-overlay";
    overlay.innerHTML = content.replace(/\n/g, "<br>");
    document.body.appendChild(overlay);
  }, overlayContent);

  const screenshotPath = await takeTimestampedScreenshot(page, name, options);

  // Clean up
  await page.evaluate(() => {
    const overlay = document.querySelector(".debug-overlay");
    if (overlay) overlay.remove();
  });

  if (options?.highlightElements?.length) {
    for (const element of options.highlightElements) {
      await element.evaluate((el) => {
        el.style.border = "";
        el.style.boxShadow = "";
      });
    }
  }

  return screenshotPath;
}
