# 🚀 Migration Guide

A comprehensive guide to migrate from raw Playwright to `playwright-tools` utilities.

## 📋 Overview

This guide helps you transition from raw Playwright APIs to the enhanced utilities provided by `playwright-tools`. Each section shows the "before" and "after" code patterns with explanations.

## 🎯 Element Interactions

### Click Operations

**Before (Raw Playwright):**
```typescript
// Manual waiting and error handling
await page.locator("#button").waitFor({ state: "visible" });
await page.locator("#button").click();

// Or with try-catch for optional elements
try {
  await page.locator("#optional-button").waitFor({ timeout: 5000 });
  await page.locator("#optional-button").click();
} catch {
  // Element not found, continue
}
```

**After (playwright-tools):**
```typescript
import { safeClick } from "playwright-tools/interactions";

// Basic usage - throws on error (same as raw Playwright)
await safeClick(page.locator("#button"));

// With custom timeout
await safeClick(page.locator("#optional-button"), { timeout: 5000 });

// With error handling - returns false on error
const clicked = await safeClick(page.locator("#optional-button"), { 
  catchErrors: true,
  timeout: 5000 
});

if (clicked) {
  console.log("Button was clicked successfully");
} else {
  console.log("Button was not found or not clickable");
}

// With custom error handler
await safeClick(page.locator("#button"), {
  catchErrors: true,
  onError: (error, context) => console.log(`Click failed: ${context}`, error)
});
```

### Form Filling

**Before (Raw Playwright):**
```typescript
// Manual form filling with clear
await page.locator("#username").waitFor({ state: "visible" });
await page.locator("#username").clear();
await page.locator("#username").fill("john.doe");

// Multiple fields sequentially
await page.locator("#email").waitFor({ state: "visible" });
await page.locator("#email").clear();
await page.locator("#email").fill("john@example.com");

await page.locator("#password").waitFor({ state: "visible" });
await page.locator("#password").clear();
await page.locator("#password").fill("secure123");
```

**After (playwright-tools):**
```typescript
import { safeFill, fillForm } from "playwright-tools/interactions";

// Single field with automatic clear
await safeFill(page.locator("#username"), "john.doe");

// With error handling
const filled = await safeFill(page.locator("#optional-input"), "value", { 
  catchErrors: true,
  timeout: 5000 
});

// Multiple fields concurrently
await fillForm([
  { locator: page.locator("#username"), value: "john.doe" },
  { locator: page.locator("#email"), value: "john@example.com" },
  { locator: page.locator("#password"), value: "secure123" },
]);

// With error handling for form
const formFilled = await fillForm([
  { locator: page.locator("#required"), value: "required" },
  { locator: page.locator("#optional"), value: "optional" }
], { catchErrors: true });
```

## 🔍 Element Queries

### Existence Checks

**Before (Raw Playwright):**
```typescript
// Manual existence checking
let elementExists = false;
try {
  await page.locator("#optional-element").waitFor({ timeout: 1000 });
  elementExists = true;
} catch {
  elementExists = false;
}

if (elementExists) {
  await page.locator("#optional-element").click();
}
```

**After (playwright-tools):**
```typescript
import { elementExists } from "playwright-tools/element-queries";

// Simple existence check
const exists = await elementExists(page.locator("#optional-element"));

if (exists) {
  await safeClick(page.locator("#optional-element"));
}

// Or use safeClick with error handling
const clicked = await safeClick(page.locator("#optional-element"), { 
  catchErrors: true 
});
```

### Multiple Element Waiting

**Before (Raw Playwright):**
```typescript
// Sequential waiting
await page.locator("#header").waitFor({ state: "visible" });
await page.locator("#navigation").waitFor({ state: "visible" });
await page.locator("#content").waitFor({ state: "visible" });
```

**After (playwright-tools):**
```typescript
import { waitForElements } from "playwright-tools/element-queries";

// Concurrent waiting
await waitForElements([
  page.locator("#header"),
  page.locator("#navigation"),
  page.locator("#content"),
]);
```

## 🌐 Navigation

### Page Navigation

**Before (Raw Playwright):**
```typescript
// Basic navigation with manual waiting
await page.goto("/dashboard");
await page.waitForLoadState("networkidle");

// Or with URL validation
await page.goto("/dashboard");
if (!page.url().includes("/dashboard")) {
  throw new Error("Navigation failed");
}
```

**After (playwright-tools):**
```typescript
import { safeNavigate } from "playwright-tools/navigation";

// Safe navigation with automatic validation
await safeNavigate(page, "/dashboard", {
  expectedUrlPattern: /\/dashboard/,
  timeout: 10000,
});
```

### Page Load Waiting

**Before (Raw Playwright):**
```typescript
// Multiple wait conditions
await page.waitForLoadState("networkidle");
await page.waitForLoadState("domcontentloaded");

// Or manual timeout
await page.waitForTimeout(2000);
```

**After (playwright-tools):**
```typescript
import { waitForPageLoad, waitForPageIdle } from "playwright-tools/navigation";

// Wait for network idle
await waitForPageLoad(page);

// Wait for complete page idle (no animations, timers, network)
await waitForPageIdle(page, {
  networkIdle: true,
  noAnimations: true,
  noTimers: true,
});
```

## 📸 Screenshots

### Basic Screenshots

**Before (Raw Playwright):**
```typescript
// Manual timestamp generation
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
await page.screenshot({ path: `screenshots/test-${timestamp}.png` });
```

**After (playwright-tools):**
```typescript
import { takeTimestampedScreenshot } from "playwright-tools/screenshots";

// Automatic timestamped screenshots
const screenshotPath = await takeTimestampedScreenshot(page, "test");
```

## 🔄 Retry Logic

### Manual Retry

**Before (Raw Playwright):**
```typescript
// Manual retry implementation
let retries = 3;
let result = null;

while (retries > 0) {
  try {
    await page.click("#flaky-button");
    result = await page.locator("#result").textContent();
    break;
  } catch (error) {
    retries--;
    if (retries === 0) throw error;
    await page.waitForTimeout(1000);
  }
}
```

**After (playwright-tools):**
```typescript
import { retryAction } from "playwright-tools/retry";

// Automatic retry with exponential backoff
const result = await retryAction(
  async () => {
    await page.click("#flaky-button");
    return await page.locator("#result").textContent();
  },
  {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000,
  },
);
```

## 📊 Assertions

### Multiple Assertions

**Before (Raw Playwright):**
```typescript
// Sequential assertions
await expect(page.locator(".header")).toBeVisible();
await expect(page.locator(".sidebar")).toBeVisible();
await expect(page.locator(".content")).toBeVisible();
```

**After (playwright-tools):**
```typescript
import { expectAll } from "playwright-tools/assertions";

// Concurrent assertions
await expectAll([
  () => expect(page.locator(".header")).toBeVisible(),
  () => expect(page.locator(".sidebar")).toBeVisible(),
  () => expect(page.locator(".content")).toBeVisible(),
]);
```

## 💾 Storage Management

### Local Storage

**Before (Raw Playwright):**
```typescript
// Manual storage operations
await page.evaluate(() => {
  localStorage.setItem("userToken", "abc123");
});

const token = await page.evaluate(() => {
  return localStorage.getItem("userToken");
});

await page.evaluate(() => {
  localStorage.removeItem("userToken");
});
```

**After (playwright-tools):**
```typescript
import { handleStorage } from "playwright-tools/storage";

// Simplified storage operations
await handleStorage(page, "set", "userToken", "abc123");
const token = await handleStorage(page, "get", "userToken");
await handleStorage(page, "remove", "userToken");
```

## 🌍 Network Monitoring

### Network Request Waiting

**Before (Raw Playwright):**
```typescript
// Manual network request monitoring
const responsePromise = page.waitForResponse(response => 
  response.url().includes("/api/users") && response.status() === 200
);

await page.click("#load-users");
const response = await responsePromise;
```

**After (playwright-tools):**
```typescript
import { waitForNetworkRequest } from "playwright-tools/network";

// Simplified network request waiting
const response = await waitForNetworkRequest(page, "/api/users", {
  method: "GET",
  status: 200,
  timeout: 10000,
});
```

## 🎯 Advanced Interactions

### File Upload

**Before (Raw Playwright):**
```typescript
// Manual file upload with validation
const fileInput = page.locator('input[type="file"]');
await fileInput.setInputFiles(["./test-files/document.pdf"]);

// Manual validation
const fileName = await fileInput.evaluate(el => el.files?.[0]?.name);
if (!fileName?.endsWith('.pdf')) {
  throw new Error("Invalid file type");
}
```

**After (playwright-tools):**
```typescript
import { handleFileUpload } from "playwright-tools/advanced-interactions";

// Automatic file upload with validation
await handleFileUpload(page.locator('input[type="file"]'), ["./test-files/document.pdf"], {
  waitForUpload: true,
  validateFileTypes: true,
  allowedTypes: [".pdf", ".png", ".jpg"],
});
```

### Keyboard Shortcuts

**Before (Raw Playwright):**
```typescript
// Manual keyboard combinations
await page.keyboard.press("Control+a");
await page.keyboard.press("Control+c");
await page.locator("#target").focus();
await page.keyboard.press("Control+v");
```

**After (playwright-tools):**
```typescript
import { pressKeyCombo } from "playwright-tools/advanced-interactions";

// Simplified keyboard shortcuts
await pressKeyCombo(page, "Control+A");
await pressKeyCombo(page, "Control+C");
await pressKeyCombo(page, "Control+V", {
  element: page.locator("#target"),
});
```

## 📋 Complete Migration Example

### Before (Raw Playwright)
```typescript
test("User registration flow", async ({ page }) => {
  // Navigation
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  
  // Form filling
  await page.locator("#username").waitFor({ state: "visible" });
  await page.locator("#username").clear();
  await page.locator("#username").fill("john.doe");
  
  await page.locator("#email").waitFor({ state: "visible" });
  await page.locator("#email").clear();
  await page.locator("#email").fill("john@example.com");
  
  await page.locator("#password").waitFor({ state: "visible" });
  await page.locator("#password").clear();
  await page.locator("#password").fill("secure123");
  
  // Submit
  await page.locator("#submit").waitFor({ state: "visible" });
  await page.locator("#submit").click();
  
  // Wait for success
  await page.locator(".success-message").waitFor({ state: "visible" });
  
  // Assertions
  await expect(page.locator(".success-message")).toBeVisible();
  await expect(page.url()).toContain("/dashboard");
});
```

### After (playwright-tools)
```typescript
import { safeNavigate, fillForm, safeClick, waitForElements, expectAll } from "playwright-tools";

test("User registration flow", async ({ page }) => {
  // Safe navigation
  await safeNavigate(page, "/register");
  
  // Efficient form filling
  await fillForm([
    { locator: page.locator("#username"), value: "john.doe" },
    { locator: page.locator("#email"), value: "john@example.com" },
    { locator: page.locator("#password"), value: "secure123" },
  ]);
  
  // Safe submit
  await safeClick(page.locator("#submit"));
  
  // Wait for success elements
  await waitForElements([page.locator(".success-message")]);
  
  // Concurrent assertions
  await expectAll([
    () => expect(page.locator(".success-message")).toBeVisible(),
    () => expect(page.url()).toContain("/dashboard"),
  ]);
});
```

### With Error Handling
```typescript
import { safeNavigate, fillForm, safeClick, waitForElements, expectAll } from "playwright-tools";

test("User registration flow with error handling", async ({ page }) => {
  // Safe navigation
  await safeNavigate(page, "/register");
  
  // Form filling with error handling
  const formFilled = await fillForm([
    { locator: page.locator("#username"), value: "john.doe" },
    { locator: page.locator("#email"), value: "john@example.com" },
    { locator: page.locator("#password"), value: "secure123" },
    { locator: page.locator("#optional-field"), value: "optional" }, // This might not exist
  ], { 
    catchErrors: true,
    onError: (error, context) => console.log(`Form fill error: ${context}`, error)
  });
  
  if (!formFilled) {
    console.log("Some form fields could not be filled");
  }
  
  // Safe submit with error handling
  const submitted = await safeClick(page.locator("#submit"), { 
    catchErrors: true,
    onError: (error, context) => console.log(`Submit error: ${context}`, error)
  });
  
  if (submitted) {
    // Wait for success elements
    await waitForElements([page.locator(".success-message")]);
    
    // Concurrent assertions
    await expectAll([
      () => expect(page.locator(".success-message")).toBeVisible(),
      () => expect(page.url()).toContain("/dashboard"),
    ]);
  } else {
    console.log("Submit button was not found or not clickable");
  }
});
```

## 🛠️ Migration Checklist

- [ ] **Install playwright-tools**: `npm install playwright-tools`
- [ ] **Update imports**: Replace raw Playwright imports with playwright-tools modules
- [ ] **Replace element interactions**: Use `safeClick`, `safeFill`, `fillForm`
- [ ] **Update element queries**: Use `elementExists`, `waitForElements`
- [ ] **Improve navigation**: Use `safeNavigate`, `waitForPageLoad`
- [ ] **Add retry logic**: Use `retryAction` for flaky operations
- [ ] **Enhance assertions**: Use `expectAll` for concurrent assertions
- [ ] **Simplify storage**: Use `handleStorage` for localStorage operations
- [ ] **Add network monitoring**: Use `waitForNetworkRequest` for API calls
- [ ] **Add error handling**: Use `catchErrors: true` for optional elements
- [ ] **Test thoroughly**: Ensure all functionality works as expected

## 📚 Additional Resources

- **[Main Documentation](../README.md)**
- **[API Reference](../README.md#quick-navigation)**
- **[Examples](../examples/)**
- **[Best Practices](../best-practices.md)**

---

**Need help with migration?** Join our [Discord Community](https://discord.gg/mUAqQ7FUaZ) or visit [jaktestowac.pl](https://jaktestowac.pl)
