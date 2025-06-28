import type { Page } from "@playwright/test";

/**
 * Handle modal dialogs and popups safely.
 * Provides a unified interface for dealing with various types of dialogs.
 *
 * @param page - The Playwright page instance
 * @param action - Function that triggers the dialog
 * @param options - Optional configuration object
 * @param options.accept - Whether to accept the dialog (default: true)
 * @param options.promptText - Text to enter in prompt dialogs
 * @param options.expectedMessage - Pattern to match dialog message
 * @param expect - The Playwright expect function (optional, for message validation)
 * @returns Promise that resolves to dialog information
 *
 * @example
 * ```typescript
 * const dialogInfo = await handleDialog(
 *   page,
 *   () => page.getByRole('button', { name: 'Delete' }).click(),
 *   {
 *     accept: true,
 *     expectedMessage: /Are you sure/
 *   },
 *   expect
 * );
 * ```
 */
export async function handleDialog(
  page: Page,
  action: () => Promise<void>,
  options?: {
    accept?: boolean;
    promptText?: string;
    expectedMessage?: RegExp;
  },
  expect?: any,
) {
  const accept = options?.accept !== false;
  let dialogInfo: { type: string; message: string; defaultValue?: string } | null = null;

  const dialogHandler = (dialog: any) => {
    dialogInfo = {
      type: dialog.type(),
      message: dialog.message(),
      defaultValue: dialog.defaultValue(),
    };

    if (options?.expectedMessage && expect) {
      expect(dialog.message()).toMatch(options.expectedMessage);
    }

    if (dialog.type() === "prompt" && options?.promptText) {
      return dialog.accept(options.promptText);
    }

    return accept ? dialog.accept() : dialog.dismiss();
  };

  page.on("dialog", dialogHandler);

  try {
    await action();
    // Wait a bit for the dialog to appear
    await page.waitForTimeout(100);
  } finally {
    page.off("dialog", dialogHandler);
  }

  return dialogInfo;
}
