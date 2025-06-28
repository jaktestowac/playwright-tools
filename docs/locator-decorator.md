# Locator Decorator

The Locator Decorator is a powerful utility that extends Playwright locators with additional functionality, making them more robust and easier to use in tests. It provides enhanced interaction methods, custom method support, and method override capabilities.

## Features

- **Enhanced Methods**: Adds safe interaction methods from the interactions module
- **Custom Methods**: Allows users to add their own custom methods to locators
- **Method Overrides**: Enables overriding existing locator methods while preserving originals
- **Factory Pattern**: Provides factory functions for creating enhanced locators with predefined configurations
- **Page Extension**: Extends page objects with enhanced locator creation methods

## Basic Usage

### Creating Enhanced Locators

```typescript
import { createEnhancedLocator } from 'playwright-tools';

// Basic usage with default enhancements
const enhancedButton = createEnhancedLocator(page.getByRole('button'));
await enhancedButton.safeClick();

// With custom configuration
const enhancedInput = createEnhancedLocator(page.getByLabel('Username'), {
  enableEnhancedMethods: true,
  allowOverrides: false,
  customMethods: {
    async typeSlowly(text: string, delay: number = 100) {
      for (const char of text) {
        await this.fill(char);
        await this.page().waitForTimeout(delay);
      }
    }
  }
});
```

### Using Enhanced Page Methods

```typescript
import { extendPage } from 'playwright-tools';

// Extend page with enhanced locator methods
const enhancedPage = extendPage(page, {
  enableEnhancedMethods: true,
  customMethods: {
    async waitForAnimation() {
      await this.waitForFunction(() => {
        return !document.querySelector('[style*="animation"]');
      });
    }
  }
});

// Use enhanced locators
const button = enhancedPage.locator('button');
await button.waitForAnimation();
await button.safeClick();
```

## Enhanced Methods

The locator decorator adds the following enhanced methods to locators:

### Safe Interaction Methods

- `safeClick(options?)`: Safely clicks an element with error handling
- `safeFill(text, options?)`: Safely fills an input field with error handling

### Enhanced Query Methods

- `isEnabled()`: Checks if an element is enabled
- `waitForVisibleWithRetry(options?)`: Waits for element visibility with retry logic
- `extractData(options?)`: Extracts data from an element
- `checkAccessibility(options?)`: Performs accessibility checks

### Enhanced Action Methods

- `scrollTo(options?)`: Scrolls element into view with custom options
- `pressKeys(combo, options?)`: Presses keyboard combinations
- `dragTo(target, options?)`: Performs drag and drop operations
- `uploadFiles(filePaths, options?)`: Handles file uploads

### Utility Methods

- `getDescription()`: Gets a readable description of the element
- `waitForEnabled(timeout?)`: Waits for element to be enabled
- `waitForDisabled(timeout?)`: Waits for element to be disabled

## Configuration Options

### LocatorDecoratorConfig

```typescript
interface LocatorDecoratorConfig {
  // Whether to add enhanced methods from interactions module
  enableEnhancedMethods?: boolean;
  // Whether to allow method overrides
  allowOverrides?: boolean;
  // Custom methods to add
  customMethods?: Record<string, CustomLocatorMethod>;
  // Methods to override (original methods will be preserved with 'original' prefix)
  overrideMethods?: string[];
  // Default options for enhanced methods
  defaultOptions?: {
    safeClick?: SafeInteractionOptions;
    safeFill?: SafeInteractionOptions;
    extractData?: ElementDataOptions;
    checkAccessibility?: AccessibilityOptions;
  };
}
```

## Custom Methods

### Adding Custom Methods

```typescript
const enhanced = createEnhancedLocator(locator, {
  customMethods: {
    async highlight() {
      await this.evaluate(el => {
        el.style.border = '2px solid red';
        setTimeout(() => el.style.border = '', 1000);
      });
    },
    
    async typeSlowly(text: string, delay: number = 100) {
      for (const char of text) {
        await this.fill(char);
        await this.page().waitForTimeout(delay);
      }
    },
    
    async waitForAnimation() {
      await this.waitForFunction(() => {
        return !document.querySelector('[style*="animation"]');
      });
    }
  }
});

// Use custom methods
await enhanced.highlight();
await enhanced.typeSlowly('Hello World', 50);
await enhanced.waitForAnimation();
```

### Method Overrides

```typescript
const enhanced = createEnhancedLocator(locator, {
  overrideMethods: ['click', 'fill'],
  customMethods: {
    async click() {
      console.log('Custom click behavior');
      // Call original method
      return this.originalClick();
    },
    
    async fill(text: string) {
      console.log(`Filling with: ${text}`);
      // Call original method
      return this.originalFill(text);
    }
  }
});

// Original methods are preserved with 'original' prefix
await enhanced.click(); // Uses custom click
await enhanced.originalClick(); // Uses original click
```

## Factory Pattern

### Creating Locator Factories

```typescript
import { createEnhancedLocatorFactory } from 'playwright-tools';

// Create a factory with custom configuration
const createMyLocator = createEnhancedLocatorFactory({
  enableEnhancedMethods: true,
  allowOverrides: true,
  customMethods: {
    async highlight() {
      await this.evaluate(el => {
        el.style.border = '2px solid red';
        setTimeout(() => el.style.border = '', 1000);
      });
    }
  }
});

// Use the factory
const button = createMyLocator(page.getByRole('button'));
await button.highlight();
await button.safeClick();
```

## Page Extension

### Extending Page Objects

```typescript
import { extendPage } from 'playwright-tools';

// Extend page with enhanced locator methods
const enhancedPage = extendPage(page, {
  enableEnhancedMethods: true,
  customMethods: {
    async waitForAnimation() {
      await this.waitForFunction(() => {
        return !document.querySelector('[style*="animation"]');
      });
    }
  }
});

// Use enhanced locators
const button = enhancedPage.locator('button');
const input = enhancedPage.getByLabel('Username');
const submit = enhancedPage.getByRole('button', { name: 'Submit' });

await button.waitForAnimation();
await input.safeFill('testuser');
await submit.safeClick();
```

### Available Enhanced Page Methods

- `locator(selector, options?)`
- `getByRole(role, options?)`
- `getByText(text, options?)`
- `getByLabel(text, options?)`
- `getByTestId(testId)`
- `getByPlaceholder(text, options?)`
- `getByTitle(text, options?)`

## Utility Functions

### Checking Enhanced Locators

```typescript
import { isEnhancedLocator, getOriginalLocator } from 'playwright-tools';

const enhanced = createEnhancedLocator(locator);

// Check if locator is enhanced
if (isEnhancedLocator(enhanced)) {
  console.log('This is an enhanced locator');
}

// Get original locator
const original = getOriginalLocator(enhanced);
```

## Advanced Examples

### Form Handling with Enhanced Locators

```typescript
// Create enhanced page with form-specific methods
const enhancedPage = extendPage(page, {
  customMethods: {
    async fillFormField(label: string, value: string) {
      const field = this.getByLabel(label);
      await field.safeFill(value);
      return field;
    },
    
    async submitForm() {
      const submitButton = this.getByRole('button', { name: /submit|save/i });
      await submitButton.safeClick();
    }
  }
});

// Use in tests
await enhancedPage.fillFormField('Username', 'testuser');
await enhancedPage.fillFormField('Password', 'password123');
await enhancedPage.submitForm();
```

### Custom Validation Methods

```typescript
const enhanced = createEnhancedLocator(locator, {
  customMethods: {
    async validateRequired() {
      const value = await this.inputValue();
      if (!value || value.trim() === '') {
        throw new Error('Field is required');
      }
      return true;
    },
    
    async validateEmail() {
      const value = await this.inputValue();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    }
  }
});

// Use validation methods
await enhanced.validateRequired();
await enhanced.validateEmail();
```

### Performance Monitoring

```typescript
const enhanced = createEnhancedLocator(locator, {
  customMethods: {
    async clickWithTiming() {
      const start = performance.now();
      await this.safeClick();
      const duration = performance.now() - start;
      console.log(`Click took ${duration}ms`);
      return duration;
    }
  }
});

const clickTime = await enhanced.clickWithTiming();
```

## Best Practices

1. **Use Enhanced Methods**: Prefer `safeClick()` and `safeFill()` over regular `click()` and `fill()` for better error handling.

2. **Custom Methods for Reusability**: Create custom methods for common patterns in your application.

3. **Method Overrides Sparingly**: Only override methods when necessary, and always call the original method when possible.

4. **Factory Pattern**: Use factories to create consistent enhanced locators across your test suite.

5. **Page Extension**: Extend pages with enhanced locators for better organization and reusability.

6. **Type Safety**: Use TypeScript interfaces to ensure type safety with custom methods.

## Error Handling

The enhanced locator methods include built-in error handling:

```typescript
// Safe methods return boolean indicating success
const success = await enhanced.safeClick({ catchErrors: true });
if (!success) {
  console.log('Click failed, but test continues');
}

// Custom error handling
await enhanced.safeClick({
  catchErrors: true,
  onError: (error, context) => {
    console.log(`Click failed in ${context}:`, error.message);
  }
});
```

## Migration Guide

### From Regular Locators

```typescript
// Before
await page.getByRole('button').click();
await page.getByLabel('Username').fill('user');

// After
const enhancedPage = extendPage(page);
await enhancedPage.getByRole('button').safeClick();
await enhancedPage.getByLabel('Username').safeFill('user');
```

### From Custom Helper Functions

```typescript
// Before
async function clickButton(page, selector) {
  await page.locator(selector).waitFor({ state: 'visible' });
  await page.locator(selector).click();
}

// After
const enhanced = createEnhancedLocator(page.locator(selector));
await enhanced.safeClick();
```

The Locator Decorator provides a powerful way to extend Playwright locators with additional functionality while maintaining compatibility with existing code. It promotes code reusability, better error handling, and more maintainable test suites. 