# 🛠️ Best Practices

Comprehensive guidelines and recommendations for using `playwright-tools` effectively in your test automation projects.

## 📋 Overview

This guide covers best practices for configuration, performance optimization, error handling, and maintaining reliable test suites with `playwright-tools`.

## ⚙️ Configuration

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
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true
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
    // Enable screenshots on failure
    screenshot: "only-on-failure",
    // Enable video recording
    video: "retain-on-failure",
  },
  // Configure test directories
  testDir: "./tests",
  outputDir: "./test-results",
  // Parallel execution
  workers: process.env.CI ? 2 : undefined,
  // Retry failed tests
  retries: process.env.CI ? 2 : 0,
});
```

### Environment Variables

Set up environment-specific configurations:

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    actionTimeout: parseInt(process.env.ACTION_TIMEOUT || "10000"),
  },
  timeout: parseInt(process.env.TEST_TIMEOUT || "30000"),
});
```

## 🚀 Performance Optimization

### Concurrent Operations

**✅ Good: Use concurrent operations when possible**

```typescript
import { waitForElements, expectAll } from "playwright-tools";

// Wait for multiple elements concurrently
await waitForElements([
  page.locator(".header"),
  page.locator(".sidebar"),
  page.locator(".content"),
]);

// Run multiple assertions concurrently
await expectAll([
  () => expect(page.locator(".header")).toBeVisible(),
  () => expect(page.locator(".sidebar")).toBeVisible(),
  () => expect(page.locator(".content")).toBeVisible(),
]);
```

**❌ Avoid: Sequential operations when not necessary**

```typescript
// Sequential waiting (slower)
await page.locator(".header").waitFor({ state: "visible" });
await page.locator(".sidebar").waitFor({ state: "visible" });
await page.locator(".content").waitFor({ state: "visible" });

// Sequential assertions (slower)
await expect(page.locator(".header")).toBeVisible();
await expect(page.locator(".sidebar")).toBeVisible();
await expect(page.locator(".content")).toBeVisible();
```

### Efficient Form Filling

**✅ Good: Use `fillForm` for multiple fields**

```typescript
import { fillForm } from "playwright-tools/interactions";

await fillForm([
  { locator: page.locator("#username"), value: "john.doe" },
  { locator: page.locator("#email"), value: "john@example.com" },
  { locator: page.locator("#password"), value: "secure123" },
]);
```

**❌ Avoid: Sequential form filling**

```typescript
// Sequential filling (slower)
await safeFill(page.locator("#username"), "john.doe");
await safeFill(page.locator("#email"), "john@example.com");
await safeFill(page.locator("#password"), "secure123");
```

### Timeout Optimization

Set appropriate timeouts based on your application's performance:

```typescript
// Fast-loading elements
await safeClick(page.locator("#fast-button"), { timeout: 2000 });

// Slow-loading elements
await safeFill(page.locator("#slow-input"), "value", { timeout: 15000 });

// Network-dependent operations
await waitForNetworkRequest(page, "/api/data", { timeout: 20000 });
```

## 🛡️ Error Handling

### Graceful Element Handling

**✅ Good: Check element existence for optional elements**

```typescript
import { elementExists, safeClick } from "playwright-tools";

const hasNotification = await elementExists(page.locator(".notification"));
if (hasNotification) {
  await safeClick(page.locator(".notification .close-btn"));
}
```

**❌ Avoid: Try-catch for expected scenarios**

```typescript
// Less readable and harder to maintain
try {
  await page.locator(".notification").waitFor({ timeout: 1000 });
  await page.locator(".notification .close-btn").click();
} catch {
  // Element not found, continue
}
```

### Retry for Flaky Operations

**✅ Good: Use retry for network-dependent operations**

```typescript
import { retryAction, waitForNetworkRequest } from "playwright-tools";

const apiData = await retryAction(
  async () => {
    await page.reload();
    await waitForNetworkRequest(page, "/api/data", { status: 200 });
    return page.locator(".data-display").textContent();
  },
  { maxRetries: 3, baseDelay: 1000 }
);
```

### Comprehensive Error Messages

**✅ Good: Provide meaningful error context**

```typescript
import { safeClick } from "playwright-tools/interactions";

try {
  await safeClick(page.locator("#submit-button"), { timeout: 10000 });
} catch (error) {
  throw new Error(`Failed to click submit button: ${error.message}`);
}
```

## 📸 Screenshot Management

### Strategic Screenshot Placement

```typescript
import { takeTimestampedScreenshot } from "playwright-tools/screenshots";

test("User registration flow", async ({ page }) => {
  // Baseline screenshot
  await takeTimestampedScreenshot(page, "registration-start");
  
  // Fill form
  await fillForm([...]);
  
  // Pre-submit screenshot
  await takeTimestampedScreenshot(page, "registration-form-filled");
  
  // Submit form
  await safeClick(page.locator("#submit"));
  
  // Post-submit screenshot
  await takeTimestampedScreenshot(page, "registration-submitted");
});
```

### Debug Screenshots

Use debug screenshots for troubleshooting:

```typescript
import { debugScreenshot } from "playwright-tools/screenshots";

test("Debug complex interaction", async ({ page }) => {
  try {
    await complexInteraction(page);
  } catch (error) {
    // Take debug screenshot before failing
    await debugScreenshot(page, "complex-interaction-failed");
    throw error;
  }
});
```

## 🔄 Test Data Management

### Consistent Test Data

```typescript
import { createTestDataFactory } from "playwright-tools/test-data";

const dataFactory = createTestDataFactory();

test("User registration", async ({ page }) => {
  const userData = dataFactory.user({
    name: "Test User",
    email: "test@example.com",
  });
  
  await fillForm([
    { locator: page.locator("#name"), value: userData.name },
    { locator: page.locator("#email"), value: userData.email },
  ]);
});
```

### Data Cleanup

```typescript
test("Create and cleanup test data", async ({ page }) => {
  const testUser = dataFactory.user();
  
  // Create test data
  await createUser(testUser);
  
  try {
    // Run test
    await testUserFlow(page, testUser);
  } finally {
    // Cleanup test data
    await deleteUser(testUser.email);
  }
});
```

## 🌐 Network Monitoring

### API Performance Testing

```typescript
import { monitorNetworkDuring } from "playwright-tools/network-monitoring";

test("API performance", async ({ page }) => {
  const { result, report } = await monitorNetworkDuring(
    page,
    async () => {
      await page.click("#load-data");
      await page.waitForSelector(".data-loaded");
    },
    {
      urlFilter: /\/api\//,
      trackPerformance: true,
      slowRequestThreshold: 500,
    }
  );
  
  // Assert performance metrics
  expect(report.summary.averageResponseTime).toBeLessThan(300);
  expect(report.slowRequests.length).toBe(0);
});
```

### Network Error Detection

```typescript
import { createNetworkMonitor } from "playwright-tools/network-monitoring";

test("Detect network errors", async ({ page }) => {
  const monitor = createNetworkMonitor(page, {
    captureResponseBodies: true,
  });
  
  await monitor.start();
  await page.goto("/problematic-page");
  await monitor.stop();
  
  const report = monitor.getReport();
  
  // Assert no failed requests
  expect(report.summary.failedRequests).toBe(0);
  expect(report.failedRequests.length).toBe(0);
});
```

## 🎯 Accessibility Testing

### Comprehensive Accessibility Checks

```typescript
import { checkAccessibility } from "playwright-tools/accessibility";

test("Form accessibility", async ({ page }) => {
  await page.goto("/registration-form");
  
  const formAccessibility = await checkAccessibility(page.locator("form"), {
    checkRole: true,
    checkLabel: true,
    checkDescription: true,
    checkFocusable: true,
  });
  
  expect(formAccessibility.accessibleName).toBeTruthy();
  expect(formAccessibility.focusable).toBe(true);
});
```

## 💾 Storage Management

### Test Isolation

```typescript
import { handleStorage } from "playwright-tools/storage";

test("User preferences", async ({ page }) => {
  // Clear storage before test
  await handleStorage(page, "clear");
  
  // Set test data
  await handleStorage(page, "set", "userPreferences", JSON.stringify({
    theme: "dark",
    language: "en",
  }));
  
  // Test functionality
  await page.goto("/preferences");
  await expect(page.locator(".dark-theme")).toBeVisible();
  
  // Cleanup after test
  await handleStorage(page, "clear");
});
```

## 🔧 Page Object Patterns

### Reusable Page Objects

```typescript
import { createPageObject } from "playwright-tools/page-objects";

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

## 📊 Test Organization

### Test Structure

```typescript
// tests/user-management.spec.ts
import { test, expect } from "@playwright/test";
import { safeNavigate, fillForm, safeClick, expectAll } from "playwright-tools";

test.describe("User Management", () => {
  test.beforeEach(async ({ page }) => {
    await safeNavigate(page, "/admin/users");
  });
  
  test("should create new user", async ({ page }) => {
    await safeClick(page.locator("#add-user"));
    
    await fillForm([
      { locator: page.locator("#name"), value: "New User" },
      { locator: page.locator("#email"), value: "new@example.com" },
    ]);
    
    await safeClick(page.locator("#save"));
    
    await expectAll([
      () => expect(page.locator(".success-message")).toBeVisible(),
      () => expect(page.locator("text=New User")).toBeVisible(),
    ]);
  });
});
```

### Test Utilities

```typescript
// test-utils/common.ts
import { safeNavigate, waitForPageLoad } from "playwright-tools";

export async function loginAsUser(page: Page, credentials: UserCredentials) {
  await safeNavigate(page, "/login");
  await fillForm([
    { locator: page.locator("#username"), value: credentials.username },
    { locator: page.locator("#password"), value: credentials.password },
  ]);
  await safeClick(page.locator("#login"));
  await waitForPageLoad(page);
}
```

## 🚨 Common Pitfalls

### 1. Over-using Timeouts

**❌ Avoid: Setting very long timeouts**

```typescript
// Too long timeout
await safeClick(page.locator("#button"), { timeout: 60000 });
```

**✅ Good: Use appropriate timeouts**

```typescript
// Reasonable timeout
await safeClick(page.locator("#button"), { timeout: 10000 });
```

### 2. Ignoring Network Activity

**❌ Avoid: Not waiting for network requests**

```typescript
await page.click("#load-data");
await expect(page.locator(".data")).toBeVisible(); // May fail
```

**✅ Good: Wait for network requests**

```typescript
await page.click("#load-data");
await waitForNetworkRequest(page, "/api/data", { status: 200 });
await expect(page.locator(".data")).toBeVisible();
```

### 3. Not Handling Optional Elements

**❌ Avoid: Assuming elements always exist**

```typescript
await safeClick(page.locator(".optional-button")); // May fail
```

**✅ Good: Check existence first**

```typescript
const hasButton = await elementExists(page.locator(".optional-button"));
if (hasButton) {
  await safeClick(page.locator(".optional-button"));
}
```

## 📚 Additional Resources

- **[Main Documentation](../README.md)**
- **[Migration Guide](./migration-guide.md)**
- **[Examples](../examples/)**
- **[API Reference](../README.md#quick-navigation)**

---

**Need help?** Join our [Discord Community](https://discord.gg/mUAqQ7FUaZ) or visit [jaktestowac.pl](https://jaktestowac.pl) 