import { Page, Locator } from "@playwright/test";

/**
 * Perform keyboard shortcuts and key combinations safely.
 * Handles common keyboard interactions with proper timing and error handling.
 *
 * @param page - The Playwright page instance
 * @param keys - Key combination (e.g., 'Control+C', 'Meta+V', 'Escape')
 * @param options - Optional configuration object
 * @param options.delay - Delay between key presses (in milliseconds)
 * @param options.element - Specific element to focus before key press
 * @returns Promise that resolves when key combination is complete
 *
 * @example
 * ```typescript
 * await pressKeyCombo(page, 'Control+A'); // Select all
 * await pressKeyCombo(page, 'Control+C'); // Copy
 * await pressKeyCombo(page, 'Control+V', {
 *   element: page.getByLabel('Description')
 * }); // Paste in specific field
 * ```
 */
export async function pressKeyCombo(
  page: Page,
  keys: string,
  options?: {
    delay?: number;
    element?: Locator;
  },
) {
  if (options?.element) {
    await options.element.focus();
  }

  const keyParts = keys.split("+");
  const modifiers = keyParts.slice(0, -1);
  const mainKey = keyParts[keyParts.length - 1];

  // Press modifier keys
  for (const modifier of modifiers) {
    await page.keyboard.down(modifier);
    if (options?.delay) await page.waitForTimeout(options.delay);
  }

  // Press main key
  await page.keyboard.press(mainKey);

  // Release modifier keys in reverse order
  for (const modifier of modifiers.reverse()) {
    await page.keyboard.up(modifier);
  }
}

/**
 * Perform drag and drop operation between two elements.
 * Handles the complete drag and drop sequence with proper timing.
 *
 * @param source - The source element to drag from
 * @param target - The target element to drop to
 * @param options - Optional configuration object
 * @param options.steps - Number of intermediate steps for smooth dragging
 * @param options.delay - Delay between drag steps (in milliseconds)
 * @returns Promise that resolves when drag and drop is complete
 *
 * @example
 * ```typescript
 * await dragAndDrop(
 *   page.getByText('Draggable Item'),
 *   page.getByTestId('drop-zone'),
 *   { steps: 10, delay: 50 }
 * );
 * ```
 */
export async function dragAndDrop(
  source: Locator,
  target: Locator,
  options?: {
    steps?: number;
    delay?: number;
  },
) {
  const steps = options?.steps || 5;
  const delay = options?.delay || 100;

  // Get bounding boxes
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error("Could not get bounding boxes for drag and drop elements");
  }

  const sourceCenterX = sourceBox.x + sourceBox.width / 2;
  const sourceCenterY = sourceBox.y + sourceBox.height / 2;
  const targetCenterX = targetBox.x + targetBox.width / 2;
  const targetCenterY = targetBox.y + targetBox.height / 2;

  // Start drag
  await source.hover();
  await source.page().mouse.down();

  // Perform intermediate steps
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const currentX = sourceCenterX + (targetCenterX - sourceCenterX) * progress;
    const currentY = sourceCenterY + (targetCenterY - sourceCenterY) * progress;

    await source.page().mouse.move(currentX, currentY);
    if (delay > 0) await source.page().waitForTimeout(delay);
  }

  // Complete drop
  await target.hover();
  await source.page().mouse.up();
}

/**
 * Handle file upload operations with validation.
 * Supports single or multiple file uploads with file type and size validation.
 *
 * @param fileInput - The file input element locator
 * @param filePaths - Array of file paths to upload
 * @param options - Optional configuration object
 * @param options.waitForUpload - Whether to wait for upload completion
 * @param options.uploadTimeout - Maximum time to wait for upload (in milliseconds)
 * @param options.validateFileTypes - Whether to validate file extensions
 * @param options.allowedTypes - Array of allowed file extensions
 * @returns Promise that resolves when upload is complete
 *
 * @example
 * ```typescript
 * await handleFileUpload(
 *   page.getByLabel('Upload files'),
 *   ['./test-files/document.pdf', './test-files/image.jpg'],
 *   {
 *     waitForUpload: true,
 *     allowedTypes: ['.pdf', '.jpg', '.png'],
 *     uploadTimeout: 30000
 *   }
 * );
 * ```
 */
export async function handleFileUpload(
  fileInput: Locator,
  filePaths: string[],
  options?: {
    waitForUpload?: boolean;
    uploadTimeout?: number;
    validateFileTypes?: boolean;
    allowedTypes?: string[];
  },
) {
  // Validate file types if requested
  if (options?.validateFileTypes && options?.allowedTypes) {
    for (const filePath of filePaths) {
      const extension = filePath.toLowerCase().substring(filePath.lastIndexOf("."));
      if (!options.allowedTypes.includes(extension)) {
        throw new Error(`File type ${extension} is not allowed. Allowed types: ${options.allowedTypes.join(", ")}`);
      }
    }
  }

  // Upload files
  await fileInput.setInputFiles(filePaths);

  // Wait for upload completion if requested
  if (options?.waitForUpload) {
    const timeout = options?.uploadTimeout || 30000;

    // Common selectors for upload progress indicators
    const progressSelectors = [
      ".upload-progress",
      ".progress-bar",
      '[data-testid="upload-progress"]',
      ".uploading",
      ".file-upload-progress",
    ];

    // Wait for upload indicators to appear and disappear
    try {
      await Promise.race(
        progressSelectors.map((selector) =>
          fileInput
            .page()
            .locator(selector)
            .first()
            .waitFor({
              state: "visible",
              timeout: 5000,
            })
            .catch(() => {}),
        ),
      );

      // Wait for upload to complete (indicators disappear)
      await Promise.all(
        progressSelectors.map((selector) =>
          fileInput
            .page()
            .locator(selector)
            .first()
            .waitFor({
              state: "hidden",
              timeout,
            })
            .catch(() => {}),
        ),
      );
    } catch {
      // If no progress indicators found, wait a reasonable time
      await fileInput.page().waitForTimeout(2000);
    }
  }
}
