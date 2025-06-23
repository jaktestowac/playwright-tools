# 🎭 playwright-tools

A comprehensive collection of utilities for Playwright testing that simplify common testing patterns and enhance your automation workflow.

[![npm version](https://badge.fury.io/js/playwright-tools.svg)](https://badge.fury.io/js/playwright-tools)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

---

## ✨ Features

- 🛡️ **Safe Element Interactions** - Built-in waits and error handling for reliable interactions
- 🔄 **Retry Mechanisms** - Exponential backoff retry logic for flaky operations
- 📸 **Enhanced Screenshots** - Timestamped screenshots with debugging annotations
- 🔍 **Element Queries** - Existence checks and bulk operations without throwing errors
- 🌐 **Navigation Utilities** - Safe navigation with loading state checks
- ⌨️ **Advanced Interactions** - File uploads, drag & drop, keyboard shortcuts
- 📊 **Table Utilities** - Extract and validate table data efficiently
- 🎯 **Accessibility Helpers** - Check ARIA attributes and accessibility properties
- 💾 **Storage Management** - Handle localStorage and sessionStorage operations
- 🌍 **Network Helpers** - Wait for specific requests and monitor network activity
- 🔧 **Page Objects** - Reusable page object patterns and utilities
- 📝 **Test Data Factories** - Generate consistent test data across tests
- 📋 **Assertions** - Enhanced assertion helpers for multiple elements
- ⚡ **Test Utilities** - Filter and dispatch tests with skip/runOnly flags
- 🧪 **TypeScript Support** - Full type safety with comprehensive TypeScript definitions
- 🪶 **Zero Dependencies** - No additional dependencies beyond Playwright

---

## 📦 Installation

```bash
npm install playwright-tools
```

**Peer Dependency**: This package requires `@playwright/test` to be installed in your project.

```bash
npm install @playwright/test
```

### Modular Imports

You can import utilities individually for better tree-shaking:

```typescript
// Import specific modules
import { safeClick, safeFill } from "playwright-tools/interactions";
import { waitForElements, elementExists } from "playwright-tools/element-queries";
import { takeTimestampedScreenshot } from "playwright-tools/screenshots";
import { retryAction } from "playwright-tools/retry";

// Or import everything
import * as pwUtils from "playwright-tools";
```

---

## 🚀 Quick Start

### Basic Element Interactions

```typescript
import { safeClick, safeFill, fillForm } from "playwright-tools";

// Safe click with automatic wait for visibility
await safeClick(page.locator("#submit-button"));

// Safe fill with clear and wait
await safeFill(page.locator("#username"), "john.doe@example.com");

// Fill multiple form fields at once
await fillForm([
  { locator: page.locator("#username"), value: "john.doe" },
  { locator: page.locator("#password"), value: "secure123" },
  { locator: page.locator("#email"), value: "john@example.com" },
]);
```

### Element Queries & Bulk Operations

```typescript
import {
  elementExists,
  waitForElements,
  getTextsFromElements,
  getAttributesFromElements,
  isElementEnabled,
  extractElementData,
} from "playwright-tools";

// Check if element exists without throwing
const exists = await elementExists(page.locator("#optional-element"));

// Wait for multiple elements simultaneously
await waitForElements([page.locator("#header"), page.locator("#navigation"), page.locator("#content")]);

// Get text from multiple elements
const texts = await getTextsFromElements([page.locator(".item-1"), page.locator(".item-2"), page.locator(".item-3")]);

// Get attributes from multiple elements
const hrefs = await getAttributesFromElements(page.locator("a.nav-link").all(), "href");

// Check if element is enabled
const isEnabled = await isElementEnabled(page.locator("#submit-btn"));

// Extract comprehensive element data
const elementData = await extractElementData(page.locator("#main-button"), {
  attributes: ["id", "class", "data-testid"],
  includeText: true,
  includeStyles: ["color", "background-color"],
});
```

### Navigation & Page Utilities

```typescript
import { safeNavigate, waitForPageLoad, waitForPageIdle, takeTimestampedScreenshot } from "playwright-tools";

// Safe navigation with URL validation
await safeNavigate(page, "/dashboard", {
  expectedUrlPattern: /\/dashboard/,
  timeout: 10000,
});

// Wait for page to fully load (no network activity)
await waitForPageLoad(page);

// Wait for page to be completely idle (no animations, timers, network)
await waitForPageIdle(page, {
  networkIdle: true,
  noAnimations: true,
  noTimers: true,
});

// Take screenshot with timestamp
const screenshotPath = await takeTimestampedScreenshot(page, "login-page");
```

### Advanced Interactions

```typescript
import { pressKeyCombo, dragAndDrop, handleFileUpload, scrollToElement } from "playwright-tools";

// Keyboard shortcuts
await pressKeyCombo(page, "Control+A"); // Select all
await pressKeyCombo(page, "Control+C"); // Copy
await pressKeyCombo(page, "Control+V", {
  element: page.getByLabel("Description"),
}); // Paste in specific field

// Drag and drop
await dragAndDrop(page.locator("#draggable-item"), page.locator("#drop-zone"));

// File upload with validation
await handleFileUpload(page.locator('input[type="file"]'), ["./test-files/document.pdf", "./test-files/image.png"], {
  waitForUpload: true,
  validateFileTypes: true,
  allowedTypes: [".pdf", ".png", ".jpg"],
});

// Smooth scroll to element
await scrollToElement(page.locator("#footer"), {
  behavior: "smooth",
  block: "center",
});
```

### Network & Storage

```typescript
import { waitForNetworkRequest, handleStorage } from "playwright-tools";

// Wait for specific API call
const response = await waitForNetworkRequest(page, "/api/users", {
  method: "GET",
  status: 200,
  timeout: 10000,
});

// Handle browser storage
await handleStorage(page, "set", "userToken", "abc123");
const token = await handleStorage(page, "get", "userToken");
await handleStorage(page, "remove", "userToken");
await handleStorage(page, "clear"); // Clear all localStorage
```

### Accessibility Testing

```typescript
import { checkAccessibility } from "playwright-tools";

// Check accessibility properties
const a11y = await checkAccessibility(page.getByRole("button"), {
  checkRole: true,
  checkLabel: true,
  checkDescription: true,
});

expect(a11y.role).toBe("button");
expect(a11y.accessibleName).toBeTruthy();
expect(a11y.focusable).toBe(true);
```

### Table Data Extraction

```typescript
import { extractTableData } from "playwright-tools";

// Extract data from tables
const tableData = await extractTableData(page.locator("table"), {
  includeHeaders: true,
});
// Returns: [{ Name: 'John', Age: '25', Email: 'john@example.com' }, ...]
```

### Dialog Handling

```typescript
import { handleDialog } from "playwright-tools";

// Handle confirmation dialogs
const dialogInfo = await handleDialog(page, () => page.getByRole("button", { name: "Delete" }).click(), {
  accept: true,
  expectedMessage: /Are you sure/,
});
```

### Retry & Error Handling

```typescript
import { retryAction, waitForAnyCondition } from "playwright-tools";

// Retry flaky operations with exponential backoff
const result = await retryAction(
  async () => {
    await page.click("#sometimes-slow-button");
    return await page.locator("#result").textContent();
  },
  {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000,
  },
);

// Wait for any condition to be met
const conditionIndex = await waitForAnyCondition([
  () => expect(page.locator("#success")).toBeVisible(),
  () => expect(page.locator("#error")).toBeVisible(),
  () => expect(page.locator("#loading")).toBeHidden(),
]);
```

### Assertions & Testing

```typescript
import {
  expectElementsToBeVisible,
  expectAll,
  waitForTextInAnyElement,
  testDispatcher,
  measureTime,
} from "playwright-tools";

// Assert multiple elements are visible sequentially
await expectElementsToBeVisible([page.locator("#header"), page.locator("#footer"), page.locator("#sidebar")]);

// Run multiple assertions concurrently
await expectAll([
  () => expect(page.getByText("Welcome")).toBeVisible(),
  () => expect(page.getByRole("button", { name: "Login" })).toBeEnabled(),
  () => expect(page.locator(".header")).toHaveClass(/active/),
  () => expect(page.getByLabel("Username")).toHaveValue("john.doe"),
]);

// Wait for text to appear in any element
const foundElement = await waitForTextInAnyElement(
  [page.locator(".notification"), page.locator(".alert"), page.locator(".message")],
  "Success",
);

// Filter tests based on skip/runOnly flags
const tests = [
  { name: "test1", skip: false },
  { name: "test2", skip: true },
  { name: "test3", runOnly: true },
];
const filteredTests = testDispatcher(tests);

// Measure operation performance
const { result, duration } = await measureTime(() => page.goto("/slow-page"), "page-load");
```

### Page Objects & Test Data

```typescript
import { createPageObject, createTestDataFactory } from "playwright-tools";

// Create reusable page object
const loginPage = createPageObject(page, "/login");
await loginPage.navigate();
await loginPage.waitForReady();
await loginPage.takeScreenshot("login-page-loaded");

// Generate test data
const dataFactory = createTestDataFactory();
const userData = dataFactory.user({ name: "Custom Name" });
const loginForm = dataFactory.loginForm();
const futureDate = dataFactory.futureDate(30); // 30 days from now
```

---

## 📚 Complete API Reference

### 🎯 Element Interactions

| Function                            | Description                                             |
| ----------------------------------- | ------------------------------------------------------- |
| `safeClick(locator, options?)`      | Click element after ensuring it's visible and clickable |
| `safeFill(locator, text, options?)` | Fill input after clearing and ensuring visibility       |
| `fillForm(formData, options?)`      | Fill multiple form fields efficiently                   |

### 🔍 Element Queries

| Function                                             | Description                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| `elementExists(locator, options?)`                   | Check if element exists without throwing errors               |
| `waitForElements(locators, options?)`                | Wait for multiple elements to be visible simultaneously       |
| `getTextsFromElements(locators)`                     | Get text content from multiple elements                       |
| `getAttributesFromElements(locators, attributeName)` | Get attribute values from multiple elements                   |
| `isElementEnabled(locator, options?)`                | Check if element is enabled and interactable                  |
| `waitForVisibleWithRetry(locator, options?)`         | Wait for element with retry logic                             |
| `extractElementData(locator, options?)`              | Extract comprehensive element data (text, attributes, styles) |
| `scrollToElement(locator, options?)`                 | Smooth scroll to element with positioning options             |

### 🌐 Navigation & Page Management

| Function                            | Description                                                        |
| ----------------------------------- | ------------------------------------------------------------------ |
| `safeNavigate(page, url, options?)` | Navigate with URL validation and loading checks                    |
| `waitForPageLoad(page, options?)`   | Wait for page to fully load (networkidle)                          |
| `waitForPageIdle(page, options?)`   | Wait for complete page idle state (no animations, timers, network) |

### ⌨️ Advanced Interactions

| Function                                           | Description                                     |
| -------------------------------------------------- | ----------------------------------------------- |
| `pressKeyCombo(page, keys, options?)`              | Execute keyboard shortcuts and key combinations |
| `dragAndDrop(source, target, options?)`            | Perform drag and drop operations                |
| `handleFileUpload(fileInput, filePaths, options?)` | Handle file uploads with validation             |

### 📸 Screenshots & Visual Testing

| Function                                          | Description                              |
| ------------------------------------------------- | ---------------------------------------- |
| `takeTimestampedScreenshot(page, name, options?)` | Take screenshots with ISO timestamps     |
| `debugScreenshot(page, name, options?)`           | Take annotated screenshots for debugging |

### 🔧 Assertions & Expectations

| Function                              | Description                                       |
| ------------------------------------- | ------------------------------------------------- |
| `expectElementsToBeVisible(locators)` | Assert multiple elements are visible sequentially |
| `expectAll(expectations)`             | Run multiple expect assertions concurrently       |

### ⏳ Waiting & Timing

| Function                                            | Description                                             |
| --------------------------------------------------- | ------------------------------------------------------- |
| `waitForTextInAnyElement(locators, text, options?)` | Wait for text to appear in any of the provided elements |
| `waitForAnyCondition(conditions, options?)`         | Wait for any condition to be met                        |
| `measureTime(operation, name)`                      | Measure operation execution time                        |

### 🔄 Retry & Error Handling

| Function                        | Description                            |
| ------------------------------- | -------------------------------------- |
| `retryAction(action, options?)` | Retry actions with exponential backoff |

### ⚡ Test Utilities

| Function                | Description                              |
| ----------------------- | ---------------------------------------- |
| `testDispatcher(tests)` | Filter tests based on skip/runOnly flags |

### ♿ Accessibility Testing

| Function                                | Description                                           |
| --------------------------------------- | ----------------------------------------------------- |
| `checkAccessibility(locator, options?)` | Validate ARIA attributes and accessibility properties |

### 💾 Storage Management

| Function                                                     | Description                            |
| ------------------------------------------------------------ | -------------------------------------- |
| `handleStorage(page, operation, key?, value?, storageType?)` | Manage localStorage and sessionStorage |

### 🌍 Network & API Testing

| Function                                            | Description                        |
| --------------------------------------------------- | ---------------------------------- |
| `waitForNetworkRequest(page, urlPattern, options?)` | Wait for specific network requests |

### 💬 Dialog Handling

| Function                               | Description                            |
| -------------------------------------- | -------------------------------------- |
| `handleDialog(page, action, options?)` | Handle modal dialogs and popups safely |

### 📊 Table & Data Extraction

| Function                                   | Description                          |
| ------------------------------------------ | ------------------------------------ |
| `extractTableData(tableLocator, options?)` | Extract data from tables efficiently |

### 🏗️ Page Objects & Patterns

| Function                          | Description                                            |
| --------------------------------- | ------------------------------------------------------ |
| `createPageObject(page, baseUrl)` | Create reusable page objects with common functionality |

### 🧪 Test Data Generation

| Function                          | Description                                |
| --------------------------------- | ------------------------------------------ |
| `createTestDataFactory(options?)` | Generate consistent test data across tests |

---

## 🎨 Advanced Usage Patterns

### Custom Test Patterns

```typescript
import { test, expect } from "@playwright/test";
import { safeNavigate, waitForPageIdle, takeTimestampedScreenshot, expectAll, retryAction } from "playwright-tools";

test("Complete user workflow", async ({ page }) => {
  // Navigate safely with validation
  await safeNavigate(page, "/app", {
    expectedUrlPattern: /\/app/,
    timeout: 10000,
  });

  // Wait for complete page readiness
  await waitForPageIdle(page, {
    networkIdle: true,
    noAnimations: true,
  });

  // Take baseline screenshot
  await takeTimestampedScreenshot(page, "app-loaded");

  // Perform multiple assertions concurrently
  await expectAll([
    () => expect(page.locator(".header")).toBeVisible(),
    () => expect(page.locator(".sidebar")).toBeVisible(),
    () => expect(page.locator(".main-content")).toBeVisible(),
  ]);

  // Retry flaky operations
  const result = await retryAction(async () => {
    await page.click(".load-data-btn");
    await expect(page.locator(".data-loaded")).toBeVisible();
    return page.locator(".result").textContent();
  });

  expect(result).toContain("Success");
});
```

### Data-Driven Testing

```typescript
import { testDispatcher, createTestDataFactory } from "playwright-tools";

const dataFactory = createTestDataFactory();

const testCases = [
  {
    name: "Valid user registration",
    userData: dataFactory.user(),
    skip: false,
  },
  {
    name: "Admin user registration",
    userData: dataFactory.user({ role: "admin" }),
    runOnly: true, // Focus on this test
  },
  {
    name: "Invalid email test",
    userData: { ...dataFactory.user(), email: "invalid-email" },
    skip: true, // Skip this test for now
  },
];

// Filter tests based on skip/runOnly flags
const activeTests = testDispatcher(testCases);

activeTests.forEach((testCase) => {
  test(testCase.name, async ({ page }) => {
    // Use testCase.userData in your test
    await fillForm([
      { locator: page.locator("#name"), value: testCase.userData.name },
      { locator: page.locator("#email"), value: testCase.userData.email },
    ]);
  });
});
```

### Page Object Pattern Enhancement

```typescript
import { createPageObject } from "playwright-tools";

class LoginPage {
  private pageObject;

  constructor(page: Page) {
    this.pageObject = createPageObject(page, "/login");
  }

  async login(credentials: { username: string; password: string }) {
    await this.pageObject.navigate();
    await this.pageObject.waitForReady();

    await fillForm([
      { locator: this.pageObject.getByLabel("Username"), value: credentials.username },
      { locator: this.pageObject.getByLabel("Password"), value: credentials.password },
    ]);

    await safeClick(this.pageObject.getByRole("button", { name: "Login" }));
    await this.pageObject.takeScreenshot("after-login");
  }
}
```

---

## 🛠️ Configuration & Best Practices

### TypeScript Configuration

For optimal TypeScript support, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Playwright Configuration

Recommended `playwright.config.ts` settings:

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  use: {
    // Global timeout for all utils
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  // Configure screenshot directory
  testDir: "./tests",
  outputDir: "./test-results",
});
```

### Error Handling Best Practices

```typescript
import { retryAction, elementExists, safeClick } from "playwright-tools";

// Always check element existence for optional elements
const hasNotification = await elementExists(page.locator(".notification"));
if (hasNotification) {
  await safeClick(page.locator(".notification .close-btn"));
}

// Use retry for flaky network-dependent operations
const apiData = await retryAction(
  async () => {
    await page.reload();
    await waitForNetworkRequest(page, "/api/data", { status: 200 });
    return page.locator(".data-display").textContent();
  },
  { maxRetries: 3 },
);
```

### Performance Optimization

```typescript
import { expectAll, waitForElements } from "playwright-tools";

// ✅ Good: Concurrent operations
await Promise.all([
  waitForElements([page.locator(".header"), page.locator(".footer")]),
  expectAll([
    () => expect(page.locator(".sidebar")).toBeVisible(),
    () => expect(page.locator(".content")).toBeVisible(),
  ]),
]);

// ❌ Avoid: Sequential operations when not necessary
// await expectElementsToBeVisible([...]); // Sequential
// await waitForElements([...]); // Then wait more
```

---

## 🚀 Migration Guide

### From Raw Playwright

```typescript
// Before (raw Playwright)
await page.locator("#button").waitFor({ state: "visible" });
await page.locator("#button").click();

// After (playwright-tools)
await safeClick(page.locator("#button"));
```

```typescript
// Before (checking existence)
try {
  await page.locator("#optional").waitFor({ timeout: 1000 });
  // Element exists
} catch {
  // Element doesn't exist
}

// After
const exists = await elementExists(page.locator("#optional"));
if (exists) {
  // Element exists
}
```

### From Other Test Utilities

```typescript
// Before (manual retry logic)
let retries = 3;
while (retries > 0) {
  try {
    await page.click("#flaky-button");
    break;
  } catch (error) {
    retries--;
    if (retries === 0) throw error;
    await page.waitForTimeout(1000);
  }
}

// After
await retryAction(() => page.click("#flaky-button"));
```

---

## 📖 Resources & Learning Materials

### **🦎 Practice Application**

- [GAD (GUI API Demo)](https://github.com/jaktestowac/gad-gui-api-demo) - Our free application designed specifically for automation practice

### **🇵🇱 Polish Resources**

- [Free Playwright Resources](https://jaktestowac.pl/darmowy-playwright/) - Comprehensive Polish learning materials
- [Playwright Basics](https://www.youtube.com/playlist?list=PLfKhn9AcZ-cD2TCB__K7NP5XARaCzZYn7) - YouTube series (Polish)
- [Playwright Elements](https://www.youtube.com/playlist?list=PLfKhn9AcZ-cAcpd-XN4pKeo-l4YK35FDA) - Advanced concepts (Polish)
- [Playwright MCP](https://www.youtube.com/playlist?list=PLfKhn9AcZ-cCqD34AG5YRejujaBqCBgl4) - MCP course (Polish)
- [Discord Community](https://discord.gg/mUAqQ7FUaZ) - First Polish Playwright community!
- [Playwright Info](https://playwright.info/) - First and only Polish Playwright blog

### **🇬🇧 English Resources**

- [VS Code Extensions](https://marketplace.visualstudio.com/publishers/jaktestowac-pl) - Our free Playwright plugins
- [Playwright Documentation](https://playwright.dev/docs/intro) - Official documentation
- [Playwright GitHub](https://github.com/microsoft/playwright) - Source code and issues

---

## 📞 Contact & Support

Feel free to reach out to us:

- 🌐 **Website**: [jaktestowac.pl](https://jaktestowac.pl)
- 💼 **LinkedIn**: [jaktestowac.pl](https://www.linkedin.com/company/jaktestowac/)
- 💬 **Discord**: [Polish Playwright Community](https://discord.gg/mUAqQ7FUaZ)
- 📧 **Support**: Check our website for contact details
- 🐛 **Issues**: [GitHub Issues](https://github.com/jaktestowac/playwright-tools/issues)

---

## 🌟 Show Your Support

If you found this package helpful:

- ⭐ **Star this repository** to show your support
- 🔄 **Share with your team** to help spread knowledge about advanced Playwright testing patterns
- 🗣️ **Tell the community** about your experience with playwright-tools
- 💝 **Contribute** by submitting issues or pull requests

---

**Happy testing and automating tests!** 🚀

**jaktestowac.pl Team** 💚❤️

_PS. For more resources and updates, follow us on our [website](https://jaktestowac.pl) and [GitHub](https://github.com/jaktestowac)._

---

_Built with 💚❤️ for the Playwright and testing automation community_

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/jaktestowac/playwright-tools.svg?style=social&label=Star)](https://github.com/jaktestowac/playwright-tools)
[![GitHub forks](https://img.shields.io/github/forks/jaktestowac/playwright-tools.svg?style=social&label=Fork)](https://github.com/jaktestowac/playwright-tools/fork)
[![GitHub issues](https://img.shields.io/github/issues/jaktestowac/playwright-tools.svg)](https://github.com/jaktestowac/playwright-tools/issues)

</div>
