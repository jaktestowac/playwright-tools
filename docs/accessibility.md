# Accessibility

The `accessibility` module provides utilities for testing and validating accessibility features in your Playwright tests.

## Overview

Accessibility testing ensures your web applications are usable by everyone, including users with disabilities. This module helps automate accessibility checks and provides utilities for testing ARIA attributes, keyboard navigation, and screen reader compatibility.

## Key Features

- **ARIA Testing** - Validate ARIA attributes and roles
- **Keyboard Navigation** - Test keyboard accessibility
- **Screen Reader Support** - Check screen reader compatibility
- **Color Contrast** - Validate color contrast ratios
- **Focus Management** - Test focus behavior and order

## Basic Usage

```typescript
import { 
  checkAriaAttributes,
  testKeyboardNavigation,
  validateColorContrast,
  getFocusOrder 
} from "playwright-tools/accessibility";

// Check ARIA attributes
const ariaIssues = await checkAriaAttributes(page);
expect(ariaIssues).toHaveLength(0);

// Test keyboard navigation
await testKeyboardNavigation(page, {
  startElement: '.first-focusable',
  expectedOrder: ['.nav-item-1', '.nav-item-2', '.nav-item-3']
});

// Validate color contrast
const contrastIssues = await validateColorContrast(page);
expect(contrastIssues).toHaveLength(0);
```

## ARIA Testing

```typescript
// Check specific ARIA attributes
await checkAriaAttributes(page.locator('[role="button"]'), {
  requiredAttributes: ['aria-label', 'aria-describedby'],
  allowedRoles: ['button', 'link']
});

// Validate ARIA landmarks
const landmarks = await getAriaLandmarks(page);
expect(landmarks).toContain('main');
expect(landmarks).toContain('navigation');
```

## Keyboard Navigation

```typescript
// Test full keyboard navigation flow
await testKeyboardNavigation(page, {
  keys: ['Tab', 'Tab', 'Enter'],
  expectedFocus: '#submit-button'
});

// Get focus order for validation
const focusOrder = await getFocusOrder(page);
console.log('Focus order:', focusOrder);
```

## Best Practices

- Include accessibility tests in your regular test suite
- Test with both keyboard and screen reader navigation
- Validate ARIA attributes for dynamic content
- Check color contrast for all text elements
- Test focus management in single-page applications

## Related Modules

- [Element Queries](./element-queries.md) - For element state checking
- [Advanced Interactions](./advanced-interactions.md) - For keyboard interactions
- [Assertions](./assertions.md) - For accessibility assertions