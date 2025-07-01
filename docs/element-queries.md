# Element Queries

The `element-queries` module provides utilities for querying and extracting information from elements without throwing errors.

## Overview

Traditional Playwright element operations throw errors when elements don't exist or aren't in the expected state. This module provides safe alternatives that return boolean values or null, making your tests more resilient and easier to write.

## Key Features

- **Safe Element Checks** - Check element existence without throwing errors
- **Bulk Operations** - Process multiple elements efficiently
- **Data Extraction** - Extract text, attributes, and styles from elements
- **Element State Queries** - Check visibility, enabled state, and more
- **Scroll Utilities** - Smart scrolling with various strategies

## Basic Usage

```typescript
import { 
  elementExists,
  waitForElements,
  getTextsFromElements,
  extractElementData,
  isElementEnabled 
} from "playwright-tools/element-queries";

// Check if element exists without throwing
const exists = await elementExists(page.locator('.optional-banner'));
if (exists) {
  await page.locator('.optional-banner').click();
}

// Wait for multiple elements at once
await waitForElements([
  page.locator('header'),
  page.locator('nav'),
  page.locator('footer')
]);

// Extract text from multiple elements
const menuItems = await page.locator('.menu-item').all();
const menuTexts = await getTextsFromElements(menuItems);
```

## Data Extraction

```typescript
// Extract comprehensive element data
const buttonData = await extractElementData(page.locator('#submit'), {
  attributes: ['id', 'class', 'disabled'],
  includeText: true,
  includeStyles: ['color', 'background-color']
});

// Result: { text: 'Submit', id: 'submit', class: 'btn primary', ... }
```

## Element State Checks

```typescript
// Check if element is enabled and ready
const canSubmit = await isElementEnabled(page.locator('#submit-button'));
if (canSubmit) {
  await page.locator('#submit-button').click();
}

// Wait for element with retry logic
await waitForVisibleWithRetry(page.locator('.dynamic-content'), {
  timeout: 30000,
  retries: 5
});
```

## Scrolling Utilities

```typescript
// Scroll to element with custom options
await scrollToElement(page.locator('#footer'), {
  behavior: 'smooth',
  block: 'center',
  offset: { y: -100 } // 100px above the element
});
```

## Best Practices

- Use `elementExists()` instead of try/catch blocks for optional elements
- Leverage bulk operations for processing multiple elements
- Extract comprehensive data in single operations to reduce DOM queries
- Use state checks before performing actions on elements
- Prefer scrolling utilities over basic scrollIntoView for better control

## Related Modules

- [Element Interactions](./interactions.md) - For safe element interactions
- [Waiting](./waiting.md) - For advanced waiting strategies
- [Assertions](./assertions.md) - For validating element states
