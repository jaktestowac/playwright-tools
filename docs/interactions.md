# 🎯 Element Interactions

Safe and reliable element interaction utilities that handle common edge cases and provide built-in error handling.

## 📖 Overview

The interactions module provides enhanced element interaction functions that go beyond Playwright's basic actions. These utilities include automatic waiting, error handling, and best practices for reliable test automation.

## 🚀 Quick Start

```typescript
import { safeClick, safeFill, fillForm } from "playwright-tools/interactions";

// Safe click with automatic wait
await safeClick(page.locator("#submit-button"));

// Safe fill with clear and wait
await safeFill(page.locator("#username"), "john.doe@example.com");

// Fill multiple form fields efficiently
await fillForm([
  { locator: page.locator("#username"), value: "john.doe" },
  { locator: page.locator("#password"), value: "secure123" },
  { locator: page.locator("#email"), value: "john@example.com" },
]);
```

## 📚 API Reference

### `safeClick(locator, options?)`

Wait for an element to be visible and clickable before clicking. Ensures the element is ready for interaction before performing the click action.

**Parameters:**
- `locator` - The Playwright locator for the element to click
- `options.timeout` - Maximum time to wait for the element to be visible (in milliseconds)
- `options.catchErrors` - Whether to catch and handle errors gracefully (default: false)
- `options.onError` - Callback function called when an error occurs
- `options.force` - Whether to bypass actionability checks (default: false)
- `options.noWaitAfter` - Whether to wait for navigation after the action (default: false)
- `options.trial` - Whether to perform the action in trial mode (default: false)

**Returns:** Promise<boolean> - true if successful, false if catchErrors is true and an error occurred

**Example:**
```typescript
// Basic usage - throws on error
await safeClick(page.getByRole('button', { name: 'Submit' }));

// With error handling - returns false on error
const clicked = await safeClick(page.locator('#optional-button'), { 
  catchErrors: true,
  timeout: 5000 
});

// With custom error handler
await safeClick(page.locator('#button'), {
  catchErrors: true,
  onError: (error, context) => console.log(`Click failed: ${context}`, error)
});
```

### `safeFill(locator, text, options?)`

Fill input field with text after ensuring it's ready for interaction. Clears any existing content before filling with the new text.

**Parameters:**
- `locator` - The Playwright locator for the input element
- `text` - The text to fill into the input field
- `options.timeout` - Maximum time to wait for the element to be visible (in milliseconds)
- `options.catchErrors` - Whether to catch and handle errors gracefully (default: false)
- `options.onError` - Callback function called when an error occurs
- `options.force` - Whether to bypass actionability checks (default: false)
- `options.noWaitAfter` - Whether to wait for navigation after the action (default: false)
- `options.trial` - Whether to perform the action in trial mode (default: false)

**Returns:** Promise<boolean> - true if successful, false if catchErrors is true and an error occurred

**Example:**
```typescript
// Basic usage - throws on error
await safeFill(page.getByLabel('Username'), 'john.doe');

// With error handling - returns false on error
const filled = await safeFill(page.locator('#optional-input'), 'value', { 
  catchErrors: true,
  timeout: 5000 
});
```

### `fillForm(formData, options?)`

Fill multiple form fields efficiently in a single operation. Clears and fills each field after ensuring it's ready for interaction.

**Parameters:**
- `formData` - Array of objects with locator and value pairs
- `options.timeout` - Maximum time to wait for each field (in milliseconds)
- `options.catchErrors` - Whether to catch and handle errors gracefully (default: false)
- `options.onError` - Callback function called when an error occurs
- `options.force` - Whether to bypass actionability checks (default: false)
- `options.noWaitAfter` - Whether to wait for navigation after the action (default: false)
- `options.trial` - Whether to perform the action in trial mode (default: false)

**Returns:** Promise<boolean> - true if successful, false if catchErrors is true and an error occurred

**Example:**
```typescript
// Basic usage - throws on first error
await fillForm([
  { locator: page.getByLabel('Username'), value: 'john.doe' },
  { locator: page.getByLabel('Email'), value: 'john@example.com' },
  { locator: page.getByLabel('Password'), value: 'securepass123' }
]);

// With error handling - continues on errors
const results = await fillForm([
  { locator: page.locator('#required'), value: 'required' },
  { locator: page.locator('#optional'), value: 'optional' }
], { catchErrors: true });
```

## 💡 Usage Examples

### Basic Form Filling

```typescript
import { safeFill, fillForm } from "playwright-tools/interactions";

test('Fill login form', async ({ page }) => {
  await page.goto('/login');
  
  // Fill form fields individually
  await safeFill(page.locator('#username'), 'testuser');
  await safeFill(page.locator('#password'), 'password123');
  
  // Or fill multiple fields at once
  await fillForm([
    { locator: page.locator('#username'), value: 'testuser' },
    { locator: page.locator('#password'), value: 'password123' },
    { locator: page.locator('#email'), value: 'test@example.com' }
  ]);
});
```

### Error Handling for Optional Elements

```typescript
import { safeClick, safeFill } from "playwright-tools/interactions";

test('Handle optional elements gracefully', async ({ page }) => {
  await page.goto('/dynamic-form');
  
  // Handle optional notification
  const notificationClosed = await safeClick(page.locator('.notification .close-btn'), {
    catchErrors: true,
    onError: (error, context) => console.log(`Could not close notification: ${context}`)
  });
  
  if (notificationClosed) {
    console.log('Notification was closed successfully');
  }
  
  // Fill required fields
  await safeFill(page.locator('#required-field'), 'required value');
  
  // Try to fill optional field
  const optionalFilled = await safeFill(page.locator('#optional-field'), 'optional value', {
    catchErrors: true,
    timeout: 5000
  });
  
  if (!optionalFilled) {
    console.log('Optional field was not found, continuing...');
  }
  
  await safeClick(page.locator('#submit'));
});
```

### Form Filling with Error Handling

```typescript
import { fillForm, safeClick } from "playwright-tools/interactions";

test('Fill form with error handling', async ({ page }) => {
  await page.goto('/complex-form');
  
  // Fill form with some optional fields
  const formFilled = await fillForm([
    { locator: page.locator('#name'), value: 'John Doe' },
    { locator: page.locator('#email'), value: 'john@example.com' },
    { locator: page.locator('#phone'), value: '123-456-7890' }, // Optional
    { locator: page.locator('#company'), value: 'Acme Corp' }, // Optional
  ], {
    catchErrors: true,
    onError: (error, context) => console.log(`Form fill error: ${context}`, error)
  });
  
  if (formFilled) {
    console.log('All form fields were filled successfully');
  } else {
    console.log('Some optional fields could not be filled');
  }
  
  // Submit form
  const submitted = await safeClick(page.locator('#submit'), {
    catchErrors: true,
    onError: (error, context) => console.log(`Submit failed: ${context}`, error)
  });
  
  if (submitted) {
    await expect(page.locator('.success-message')).toBeVisible();
  }
});
```

### Dynamic Form Handling

```typescript
import { safeClick, safeFill } from "playwright-tools/interactions";

test('Dynamic form interaction', async ({ page }) => {
  await page.goto('/dynamic-form');
  
  // Wait for dynamic content to load
  await page.waitForSelector('.form-field');
  
  // Fill fields as they become available
  const fields = await page.locator('.form-field').all();
  
  for (const field of fields) {
    const label = await field.locator('label').textContent();
    const input = field.locator('input');
    
    if (label?.includes('Name')) {
      await safeFill(input, 'John Doe');
    } else if (label?.includes('Email')) {
      await safeFill(input, 'john@example.com');
    } else {
      // Handle optional fields with error handling
      const filled = await safeFill(input, 'default value', {
        catchErrors: true,
        onError: (error, context) => console.log(`Could not fill ${label}: ${context}`)
      });
      
      if (!filled) {
        console.log(`Skipping optional field: ${label}`);
      }
    }
  }
  
  await safeClick(page.locator('#submit'));
});
```

## 🔄 Migration from Raw Playwright

### Before (Raw Playwright)
```typescript
// Manual waiting and error handling
await page.locator("#button").waitFor({ state: "visible" });
await page.locator("#button").click();

// Manual form filling
await page.locator("#username").waitFor({ state: "visible" });
await page.locator("#username").clear();
await page.locator("#username").fill("john.doe");

// Manual error handling for optional elements
try {
  await page.locator("#optional").waitFor({ timeout: 1000 });
  await page.locator("#optional").click();
} catch {
  // Element not found, continue
}
```

### After (playwright-tools)
```typescript
// Automatic waiting and error handling
await safeClick(page.locator("#button"));

// Automatic form filling with clear
await safeFill(page.locator("#username"), "john.doe");

// Graceful error handling for optional elements
const clicked = await safeClick(page.locator("#optional"), { 
  catchErrors: true 
});
if (clicked) {
  // Element was clicked successfully
}
```

## ⚡ Performance Tips

### Concurrent Form Filling
```typescript
// ✅ Good: Use fillForm for multiple fields
await fillForm([
  { locator: page.locator("#field1"), value: "value1" },
  { locator: page.locator("#field2"), value: "value2" },
  { locator: page.locator("#field3"), value: "value3" },
]);

// ❌ Avoid: Sequential filling
// await safeFill(page.locator("#field1"), "value1");
// await safeFill(page.locator("#field2"), "value2");
// await safeFill(page.locator("#field3"), "value3");
```

### Error Handling Strategy
```typescript
// ✅ Good: Use catchErrors for optional elements
const optionalClicked = await safeClick(page.locator("#optional"), { 
  catchErrors: true 
});

// ✅ Good: Use error callbacks for debugging
await safeClick(page.locator("#button"), {
  catchErrors: true,
  onError: (error, context) => console.log(`Click failed: ${context}`, error)
});

// ❌ Avoid: Try-catch for expected scenarios
// try {
//   await page.locator("#optional").click();
// } catch {
//   // Less readable and harder to maintain
// }
```

### Timeout Optimization
```typescript
// Use shorter timeouts for fast-loading elements
await safeClick(page.locator("#fast-button"), { timeout: 2000 });

// Use longer timeouts for slow-loading elements
await safeFill(page.locator("#slow-input"), "value", { timeout: 15000 });

// Use error handling for elements that might not exist
const exists = await safeClick(page.locator("#maybe-exists"), { 
  catchErrors: true,
  timeout: 5000 
});
```

## 🛠️ Best Practices

1. **Use `catchErrors: true`** for optional elements that might not exist
2. **Provide meaningful error callbacks** for debugging and logging
3. **Set appropriate timeouts** based on your application's performance
4. **Use `fillForm`** for multiple form fields to improve performance
5. **Handle return values** when using error handling to check success
6. **Combine with element queries** for conditional interactions
7. **Use error callbacks** to log context-specific error information

## 🔗 Related Modules

- **[Element Queries](./element-queries.md)** - Check element existence before interactions
- **[Advanced Interactions](./advanced-interactions.md)** - File uploads, drag & drop, keyboard shortcuts
- **[Retry](./retry.md)** - Handle flaky interactions with retry logic
- **[Waiting](./waiting.md)** - Advanced waiting strategies

## 📚 Additional Resources

- **[Main Documentation](../README.md)**
- **[Examples](../examples/)**
- **[Best Practices](../best-practices.md)**
- **[Migration Guide](../migration-guide.md)**

---

**Need help?** Join our [Discord Community](https://discord.gg/mUAqQ7FUaZ) or visit [jaktestowac.pl](https://jaktestowac.pl) 