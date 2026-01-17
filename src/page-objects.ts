import type { Page, Locator } from "@playwright/test";
import { safeNavigate, waitForPageIdle } from "./navigation";
import { takeTimestampedScreenshot, debugScreenshot as _debugScreenshot } from "./screenshots";
import { measureTime, waitForTextInAnyElement, waitForAnyCondition } from "./waiting";
import { safeClick, safeFill, fillForm } from "./interactions";
import {
  waitForElements,
  elementExists,
  getTextsFromElements,
  getAttributesFromElements,
  isElementEnabled,
  extractElementData,
} from "./element-queries";
import { retryAction } from "./retry";
import { expectElementsToBeVisible, expectAll } from "./assertions";
import { checkAccessibility } from "./accessibility";
import { handleStorage } from "./storage";
import { waitForNetworkRequest } from "./network";
import { handleDialog } from "./dialogs";
import { extractTableData } from "./tables";
import { pressKeyCombo, dragAndDrop, handleFileUpload } from "./advanced-interactions";
import { FormField, PageObjectOptions } from "./types";

export type PageObject = ReturnType<typeof createPageObject>;

export interface WithComponentsOptions {
  /**
   * When true, the components factory runs on first access of `page.components`.
   * The result is cached.
   */
  lazy?: boolean;
}

export type ComponentsFactory<TComponents extends object> = (pageObject: PageObject) => TComponents;

export interface BulkElementOperation {
  locators: Locator[];
  timeout?: number;
}

/**
 * Create an enhanced page object with comprehensive functionality.
 * Provides a rich set of utilities for page interactions, testing, and automation.
 *
 * @param page - The Playwright page instance
 * @param baseUrl - Base URL for the page
 * @param options - Optional configuration for the page object
 * @returns Enhanced page object with extensive capabilities
 *
 * @example
 * ```typescript
 * const loginPage = createPageObject(page, '/login', {
 *   defaultTimeout: 10000,
 *   enableAccessibilityChecks: true
 * });
 *
 * await loginPage.navigate();
 * await loginPage.waitForReady();
 * await loginPage.fillForm([
 *   { locator: loginPage.getByLabel('Username'), value: 'john.doe' },
 *   { locator: loginPage.getByLabel('Password'), value: 'secret123' }
 * ]);
 * await loginPage.safeClick(loginPage.getByRole('button', { name: 'Login' }));
 * ```
 */
export function createPageObject(page: Page, baseUrl: string, options: PageObjectOptions = {}) {
  const defaultTimeout = options.defaultTimeout || 30000;
  const enablePerformanceMonitoring = options.enablePerformanceMonitoring || false;
  const enableAccessibilityChecks = options.enableAccessibilityChecks || false;

  return {
    page,
    baseUrl,
    options,

    // Core Navigation Methods
    async navigate(navOptions?: {
      waitUntil?: "load" | "domcontentloaded" | "networkidle";
      expectedUrlPattern?: RegExp;
      timeout?: number;
    }) {
      const operation = () =>
        safeNavigate(page, baseUrl, {
          ...navOptions,
          timeout: navOptions?.timeout || defaultTimeout,
        });

      return enablePerformanceMonitoring ? measureTime(operation, `navigate-${baseUrl}`) : operation();
    },

    async waitForReady(timeout = defaultTimeout) {
      await waitForPageIdle(page, { timeout });
    },

    async reload(options?: { waitUntil?: "load" | "domcontentloaded" | "networkidle" }) {
      await page.reload(options);
      await this.waitForReady();
    },

    async goBack() {
      await page.goBack();
      await this.waitForReady();
    },

    async goForward() {
      await page.goForward();
      await this.waitForReady();
    },

    // Enhanced Element Interactions
    async safeClick(locator: Locator, clickOptions?: { timeout?: number; retries?: number }) {
      const operation = () => safeClick(locator, { timeout: clickOptions?.timeout || defaultTimeout });

      if (clickOptions?.retries) {
        return retryAction(operation, { maxRetries: clickOptions.retries });
      }
      return operation();
    },

    async safeFill(locator: Locator, text: string, fillOptions?: { timeout?: number; retries?: number }) {
      const operation = () => safeFill(locator, text, { timeout: fillOptions?.timeout || defaultTimeout });

      if (fillOptions?.retries) {
        return retryAction(operation, { maxRetries: fillOptions.retries });
      }
      return operation();
    },

    async fillForm(formFields: FormField[], formOptions?: { timeout?: number; validateAfterFill?: boolean }) {
      await fillForm(formFields, { timeout: formOptions?.timeout || defaultTimeout });

      if (formOptions?.validateAfterFill) {
        // Validate all fields were filled correctly
        for (const field of formFields) {
          const value = await field.locator.inputValue();
          if (value !== field.value) {
            throw new Error(`Form field validation failed. Expected: ${field.value}, Actual: ${value}`);
          }
        }
      }
    },

    // Bulk Element Operations
    async waitForElements(locators: Locator[], timeout = defaultTimeout) {
      return waitForElements(locators, { timeout });
    },

    async getTextsFromElements(locators: Locator[]) {
      return getTextsFromElements(locators);
    },

    async getAttributesFromElements(locators: Locator[], attributeName: string) {
      return getAttributesFromElements(locators, attributeName);
    },

    async checkElementsExistence(locators: Locator[], timeout = defaultTimeout) {
      const checks = locators.map((locator) => elementExists(locator, { timeout }));
      return Promise.all(checks);
    },

    async validateElementsEnabled(locators: Locator[], timeout = defaultTimeout) {
      const checks = locators.map((locator) => isElementEnabled(locator, { timeout }));
      return Promise.all(checks);
    },

    // Advanced Interactions
    async dragAndDrop(
      sourceLocator: Locator,
      targetLocator: Locator,
      dropOptions?: {
        steps?: number;
        delay?: number;
      },
    ) {
      return dragAndDrop(sourceLocator, targetLocator, dropOptions);
    },

    async handleFileUpload(
      fileInputLocator: Locator,
      filePaths: string[],
      uploadOptions?: {
        waitForUpload?: boolean;
        validateFileTypes?: boolean;
        allowedTypes?: string[];
      },
    ) {
      return handleFileUpload(fileInputLocator, filePaths, uploadOptions);
    },

    async pressKeyCombo(keys: string, keyOptions?: { element?: Locator }) {
      return pressKeyCombo(page, keys, keyOptions);
    },

    // Enhanced Screenshots and Visual Testing
    async takeScreenshot(
      name: string,
      screenshotOptions?: {
        path?: string;
        fullPage?: boolean;
        clip?: { x: number; y: number; width: number; height: number };
      },
    ) {
      return takeTimestampedScreenshot(page, name, screenshotOptions);
    },
    async debugScreenshot(
      name: string,
      debugOptions?: {
        path?: string;
        highlightElements?: Locator[];
        annotations?: string[];
      },
    ) {
      return _debugScreenshot(page, name, debugOptions);
    },

    async takeElementScreenshot(locator: Locator, name: string) {
      const elementHandle = await locator.elementHandle();
      if (elementHandle) {
        return elementHandle.screenshot({ path: `${name}-${Date.now()}.png` });
      }
      throw new Error(`Element not found for screenshot: ${name}`);
    },

    // Performance Monitoring
    async measurePageLoad() {
      return measureTime(() => this.navigate(), `page-load-${baseUrl}`);
    },

    async measureOperation<T>(operation: () => Promise<T>, operationName: string) {
      return measureTime(operation, operationName);
    },

    // Page State and Information
    async extractAllText() {
      return (await page.textContent("body")) || "";
    },

    async getPageTitle() {
      return page.title();
    },

    async getCurrentUrl() {
      return page.url();
    },

    async getPageMetadata() {
      return page.evaluate(() => {
        const title = document.title;
        const description = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
        const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute("content") || "";
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "";

        return { title, description, keywords, canonical, url: window.location.href };
      });
    },

    async getPagePerformanceMetrics() {
      return page.evaluate(() => {
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
          firstByte: navigation.responseStart - navigation.requestStart,
        };
      });
    },

    // Element Queries and Validation
    async elementExists(locator: Locator, timeout = defaultTimeout) {
      return elementExists(locator, { timeout });
    },

    async isElementEnabled(locator: Locator, timeout = defaultTimeout) {
      return isElementEnabled(locator, { timeout });
    },

    async extractElementData(
      locator: Locator,
      extractOptions?: {
        attributes?: string[];
        includeText?: boolean;
        includeStyles?: string[];
      },
    ) {
      return extractElementData(locator, extractOptions);
    },

    async waitForTextInElements(locators: Locator[], text: string, timeout = defaultTimeout) {
      return waitForTextInAnyElement(locators, text, { timeout });
    },

    async waitForAnyCondition(conditions: (() => Promise<void>)[], timeout = defaultTimeout) {
      return waitForAnyCondition(conditions, { timeout });
    },

    // Accessibility Testing
    async checkAccessibility(
      locator: Locator,
      a11yOptions?: {
        checkRole?: boolean;
        checkLabel?: boolean;
        checkDescription?: boolean;
      },
    ) {
      if (enableAccessibilityChecks || a11yOptions) {
        return checkAccessibility(locator, a11yOptions);
      }
      return null;
    },

    async validatePageAccessibility(elements: Locator[]) {
      if (!enableAccessibilityChecks) return [];

      const results = [];
      for (const element of elements) {
        try {
          const a11yData = await checkAccessibility(element, {
            checkRole: true,
            checkLabel: true,
            checkDescription: true,
          });
          results.push({ element, accessibility: a11yData, valid: true });
        } catch (error) {
          results.push({ element, error, valid: false });
        }
      }
      return results;
    },

    // Storage Management
    async setLocalStorage(key: string, value: string) {
      return handleStorage(page, "set", key, value, "local");
    },

    async getLocalStorage(key: string) {
      return handleStorage(page, "get", key, undefined, "local");
    },

    async removeLocalStorage(key: string) {
      return handleStorage(page, "remove", key, undefined, "local");
    },

    async clearLocalStorage() {
      return handleStorage(page, "clear", undefined, undefined, "local");
    },

    async setSessionStorage(key: string, value: string) {
      return handleStorage(page, "set", key, value, "session");
    },

    async getSessionStorage(key: string) {
      return handleStorage(page, "get", key, undefined, "session");
    },

    // Network and API Monitoring
    async waitForNetworkRequest(
      urlPattern: string,
      requestOptions?: {
        method?: string;
        status?: number;
        timeout?: number;
      },
    ) {
      return waitForNetworkRequest(page, urlPattern, {
        ...requestOptions,
        timeout: requestOptions?.timeout || defaultTimeout,
      });
    },

    async monitorNetworkRequests(duration = 5000) {
      const requests: any[] = [];
      const responseHandler = (response: any) => {
        requests.push({
          url: response.url(),
          method: response.request().method(),
          status: response.status(),
          timestamp: Date.now(),
        });
      };

      page.on("response", responseHandler);
      await page.waitForTimeout(duration);
      page.off("response", responseHandler);

      return requests;
    },

    // Dialog Handling
    async handleDialog(
      action: () => Promise<void>,
      dialogOptions?: {
        accept?: boolean;
        expectedMessage?: RegExp;
      },
    ) {
      return handleDialog(page, action, dialogOptions);
    },

    // Table Operations
    async extractTableData(
      tableLocator: Locator,
      tableOptions?: {
        includeHeaders?: boolean;
        headerSelector?: string;
        rowSelector?: string;
        cellSelector?: string;
      },
    ) {
      return extractTableData(tableLocator, tableOptions);
    },

    // Utility Methods
    async scrollToTop() {
      await page.keyboard.press("Home");
    },

    async scrollToBottom() {
      await page.keyboard.press("End");
    },

    async refresh() {
      await page.reload();
      await this.waitForReady();
    },

    async waitForSelector(selector: string, timeout = defaultTimeout) {
      return page.waitForSelector(selector, { timeout });
    },

    async hover(locator: Locator) {
      await locator.hover();
    },

    async focus(locator: Locator) {
      await locator.focus();
    },

    async selectOption(locator: Locator, value: string | string[]) {
      await locator.selectOption(value);
    },

    async check(locator: Locator) {
      await locator.check();
    },

    async uncheck(locator: Locator) {
      await locator.uncheck();
    },

    // Locator Factory Methods
    locator(selector: string) {
      return page.locator(selector);
    },

    getByRole(role: any, options?: any) {
      return page.getByRole(role, options);
    },

    getByText(text: string | RegExp, options?: any) {
      return page.getByText(text, options);
    },

    getByLabel(text: string | RegExp, options?: any) {
      return page.getByLabel(text, options);
    },

    getByTestId(testId: string) {
      return page.getByTestId(testId);
    },

    getByPlaceholder(text: string | RegExp, options?: any) {
      return page.getByPlaceholder(text, options);
    },

    getByAltText(text: string | RegExp, options?: any) {
      return page.getByAltText(text, options);
    },

    getByTitle(text: string | RegExp, options?: any) {
      return page.getByTitle(text, options);
    },

    // Advanced Locator Methods
    first() {
      return this.locator(":first-child");
    },

    last() {
      return this.locator(":last-child");
    },

    nth(index: number) {
      return this.locator(`:nth-child(${index + 1})`);
    },

    // Error Handling and Retry
    async retryOperation<T>(
      operation: () => Promise<T>,
      retryOptions?: {
        maxRetries?: number;
        baseDelay?: number;
        maxDelay?: number;
      },
    ) {
      return retryAction(operation, retryOptions);
    },

    // Cleanup and State Management
    async cleanup() {
      // Clear any pending operations
      await page.waitForLoadState("networkidle");

      // Clear local storage if needed
      if (options.baseUrl) {
        await this.clearLocalStorage();
      }
    },

    // Custom Extensions (for inheritance)
    extend<T>(extensions: T): typeof this & T {
      return Object.assign(this, extensions);
    },
  };
}

/**
 * Attach a `components` property to an existing page object.
 *
 * This is useful for composing page objects out of smaller, reusable component factories.
 *
 * @example
 * ```ts
 * const page = createPageObject(pwPage, "/login");
 * const login = withComponents(page, (p) => ({
 *   email: createTextInput(p.page, p.getByTestId("email")),
 *   password: createTextInput(p.page, p.getByTestId("password")),
 * }));
 *
 * await login.components.email.fill("user@example.com");
 * ```
 */
export function withComponents<TComponents extends object>(
  pageObject: PageObject,
  factory: ComponentsFactory<TComponents>,
  options: WithComponentsOptions = {},
): PageObject & { components: TComponents } {
  if (options.lazy) {
    let cached: TComponents | undefined;
    Object.defineProperty(pageObject, "components", {
      enumerable: true,
      configurable: true,
      get() {
        if (!cached) cached = factory(pageObject);
        return cached;
      },
    });
    return pageObject as PageObject & { components: TComponents };
  }

  const components = factory(pageObject);
  return pageObject.extend({ components }) as PageObject & { components: TComponents };
}

/**
 * Convenience factory: create a page object and attach `components`.
 */
export function createPageObjectWithComponents<TComponents extends object>(
  page: Page,
  baseUrl: string,
  options: PageObjectOptions,
  factory: ComponentsFactory<TComponents>,
  withComponentsOptions: WithComponentsOptions = {},
): PageObject & { components: TComponents } {
  const pageObject = createPageObject(page, baseUrl, options);
  return withComponents(pageObject, factory, withComponentsOptions);
}
