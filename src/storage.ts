import { Page } from "@playwright/test";

/**
 * Handle browser storage operations (localStorage/sessionStorage).
 * Provides a convenient interface for managing browser storage in tests.
 *
 * @param page - The Playwright page instance
 * @param operation - The storage operation to perform
 * @param key - The storage key
 * @param value - The value to set (for set operations)
 * @param storageType - Type of storage ('local' or 'session')
 * @returns Promise that resolves to the operation result
 *
 * @example
 * ```typescript
 * await handleStorage(page, 'set', 'userToken', 'abc123');
 * const token = await handleStorage(page, 'get', 'userToken');
 * await handleStorage(page, 'remove', 'userToken');
 * await handleStorage(page, 'clear');
 * ```
 */
export async function handleStorage(
  page: Page,
  operation: "get" | "set" | "remove" | "clear",
  key?: string,
  value?: string,
  storageType: "local" | "session" = "local",
): Promise<string | null | void> {
  const storage = storageType === "local" ? "localStorage" : "sessionStorage";
  switch (operation) {
    case "get":
      if (!key) throw new Error("Key is required for get operation");
      return await page.evaluate(
        ([storage, key]) => {
          const storageObj = storage === "localStorage" ? window.localStorage : window.sessionStorage;
          return storageObj.getItem(key);
        },
        [storage, key],
      );

    case "set":
      if (!key || value === undefined) throw new Error("Key and value are required for set operation");
      await page.evaluate(
        ([storage, key, value]) => {
          const storageObj = storage === "localStorage" ? window.localStorage : window.sessionStorage;
          storageObj.setItem(key, value);
        },
        [storage, key, value],
      );
      break;

    case "remove":
      if (!key) throw new Error("Key is required for remove operation");
      await page.evaluate(
        ([storage, key]) => {
          const storageObj = storage === "localStorage" ? window.localStorage : window.sessionStorage;
          storageObj.removeItem(key);
        },
        [storage, key],
      );
      break;

    case "clear":
      await page.evaluate((storage) => {
        const storageObj = storage === "localStorage" ? window.localStorage : window.sessionStorage;
        storageObj.clear();
      }, storage);
      break;
  }
}
