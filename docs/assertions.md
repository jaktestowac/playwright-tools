# Assertions

The `assertions` module provides enhanced assertion helpers for validating multiple elements and complex conditions in Playwright tests.

## Overview

While Playwright provides excellent built-in assertions, this module extends them with utilities for bulk assertions, soft assertions, and custom validation patterns that make your tests more readable and maintainable.

## Key Features

- **Bulk Assertions** - Assert conditions on multiple elements
- **Soft Assertions** - Collect multiple assertion failures
- **Custom Matchers** - Domain-specific assertion helpers
- **Element Collections** - Assert on arrays of elements
- **Visual Assertions** - Enhanced screenshot comparisons

## Basic Usage

```typescript
import { 
  assertAll,
  expectElements,
  softAssert,
  assertElementsHaveText,
  assertElementsVisible 
} from "playwright-tools/assertions";

// Assert multiple conditions
await assertAll([
  () => expect(page.locator('h1')).toBeVisible(),
  () => expect(page.locator('nav')).toBeVisible(),
  () => expect(page.locator('footer')).toBeVisible()
]);

// Assert on element collections
const menuItems = page.locator('.menu-item');
await assertElementsVisible(menuItems);
await assertElementsHaveText(menuItems, ['Home', 'About', 'Contact']);
```

## Bulk Assertions

```typescript
// Assert properties of multiple elements
const buttons = page.locator('button');
await expectElements(buttons).toBeEnabled();
await expectElements(buttons).toHaveClass(/btn/);

// Assert specific text content
const tableRows = page.locator('tr');
await assertElementsHaveText(tableRows, [
  'Header Row',
  'Data Row 1', 
  'Data Row 2'
]);
```

## Soft Assertions

```typescript
// Collect multiple failures before reporting
const softAsserts = softAssert();

await softAsserts.expect(page.locator('h1')).toBeVisible();
await softAsserts.expect(page.locator('h1')).toHaveText('Welcome');
await softAsserts.expect(page.locator('.logo')).toBeVisible();

// Report all failures at once
softAsserts.assertAll();
```

## Custom Assertions

```typescript
// Domain-specific assertions
await assertPageIsLoaded(page, {
  requiredElements: ['header', 'nav', 'main', 'footer'],
  expectedTitle: /Dashboard/,
  maxLoadTime: 3000
});

// Form validation assertions
await assertFormIsValid(page.locator('form'), {
  requiredFields: ['email', 'password'],
  errorSelectors: ['.error-message']
});
```

## Visual Assertions

```typescript
// Enhanced screenshot comparisons
await assertVisualState(page, 'homepage', {
  fullPage: true,
  threshold: 0.1,
  maskElements: ['.dynamic-content']
});

// Element-specific visual checks
await assertElementAppearance(page.locator('.chart'), 'chart-snapshot');
```

## Best Practices

- Use bulk assertions to reduce test execution time
- Implement soft assertions for comprehensive validation
- Create domain-specific assertion helpers for common patterns
- Group related assertions together for better readability
- Use visual assertions for layout and styling validation

## Related Modules

- [Element Queries](./element-queries.md) - For element existence checks
- [Screenshots](./screenshots.md) - For visual assertion support
- [Element Interactions](./interactions.md) - For element state validation