# Screenshots

The `screenshots` module provides enhanced screenshot capabilities with timestamping, debugging features, and comparison utilities.

## Overview

Screenshots are essential for debugging test failures and documenting test results. This module extends Playwright's built-in screenshot capabilities with automatic timestamping, debug screenshots, and visual comparison utilities.

## Key Features

- **Timestamped Screenshots** - Automatic timestamp in filenames
- **Debug Screenshots** - Enhanced screenshots with context information
- **Visual Comparisons** - Compare screenshots for visual regression testing
- **Element Screenshots** - Capture specific elements with context
- **Failure Screenshots** - Automatic screenshots on test failures

## Basic Usage

```typescript
import { 
  takeTimestampedScreenshot,
  takeDebugScreenshot,
  takeElementScreenshot,
  compareScreenshots 
} from "playwright-tools/screenshots";

// Take screenshot with timestamp
await takeTimestampedScreenshot(page, 'login-page');
// Result: login-page-2023-12-25-14-30-45.png

// Take debug screenshot with context
await takeDebugScreenshot(page, 'form-validation-error', {
  includeConsole: true,
  includeNetworkLogs: true,
  highlightElement: '.error-message'
});

// Capture specific element
await takeElementScreenshot(page.locator('.chart'), 'sales-chart');
```

## Timestamped Screenshots

```typescript
// Basic timestamped screenshot
await takeTimestampedScreenshot(page, 'homepage');

// Custom timestamp format
await takeTimestampedScreenshot(page, 'dashboard', {
  timestampFormat: 'YYYY-MM-DD_HH-mm-ss',
  path: './screenshots/dashboard'
});

// Include test context in filename
await takeTimestampedScreenshot(page, 'checkout', {
  includeTestName: true,
  includeBrowser: true
});
// Result: checkout-test-name-chrome-2023-12-25-14-30-45.png
```

## Debug Screenshots

```typescript
// Enhanced debug screenshot
await takeDebugScreenshot(page, 'payment-failure', {
  includeConsole: true,        // Include console logs
  includeNetworkLogs: true,    // Include network activity
  includePageInfo: true,       // Include URL, title, etc.
  highlightElement: '.error',  // Highlight specific elements
  annotations: [
    { text: 'Error occurred here', x: 100, y: 200 },
    { text: 'Expected button', x: 300, y: 400 }
  ]
});

// Screenshot with custom context
await takeDebugScreenshot(page, 'complex-interaction', {
  context: {
    userAction: 'clicked submit button',
    expectedResult: 'form submission',
    actualResult: 'validation error'
  }
});
```

## Element Screenshots

```typescript
// Capture specific element
await takeElementScreenshot(page.locator('.data-table'), 'user-table', {
  padding: 20,           // Add padding around element
  includeBackground: true, // Include page background
  maskElements: ['.sensitive-data'] // Mask sensitive content
});

// Multiple element screenshots
const elements = [
  { locator: page.locator('.header'), name: 'header' },
  { locator: page.locator('.sidebar'), name: 'sidebar' },
  { locator: page.locator('.content'), name: 'content' }
];

await takeMultipleElementScreenshots(page, elements);
```

## Visual Comparisons

```typescript
// Compare current state with baseline
const comparisonResult = await compareScreenshots(
  page,
  'dashboard-baseline.png',
  'dashboard-current',
  {
    threshold: 0.1,           // 10% difference tolerance
    maskElements: ['.timestamp'], // Ignore dynamic content
    highlightDifferences: true
  }
);

if (!comparisonResult.matches) {
  console.log(`Differences found: ${comparisonResult.diffPercentage}%`);
  // Diff image saved as dashboard-current-diff.png
}
```

## Failure Screenshots

```typescript
// Automatic screenshot on test failure
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await takeFailureScreenshot(page, testInfo.title, {
      includeFullPage: true,
      includeConsoleErrors: true,
      includeNetworkErrors: true
    });
  }
});

// Screenshot with error context
await takeFailureScreenshot(page, 'login-test', {
  error: new Error('Login failed'),
  context: {
    username: 'test@example.com',
    action: 'attempted login'
  }
});
```

## Screenshot Series

```typescript
// Capture screenshot series for workflows
const series = await startScreenshotSeries(page, 'checkout-flow');

await series.capture('cart-page');
await page.click('#checkout-button');

await series.capture('shipping-info');
await page.fill('#address', '123 Main St');

await series.capture('payment-info');
await page.fill('#card-number', '4111111111111111');

await series.capture('confirmation');
await series.finish(); // Generates numbered sequence
```

## Advanced Features

```typescript
// Screenshot with custom viewport
await takeTimestampedScreenshot(page, 'mobile-view', {
  viewport: { width: 375, height: 667 },
  deviceScaleFactor: 2
});

// Screenshot with wait conditions
await takeTimestampedScreenshot(page, 'loaded-content', {
  waitForSelector: '.content-loaded',
  waitForNetworkIdle: true,
  timeout: 10000
});

// Batch screenshots with different configurations
await takeBatchScreenshots(page, [
  { name: 'desktop', viewport: { width: 1920, height: 1080 } },
  { name: 'tablet', viewport: { width: 768, height: 1024 } },
  { name: 'mobile', viewport: { width: 375, height: 667 } }
]);
```

## Best Practices

- Use descriptive names for screenshots
- Include timestamps for debugging failed test runs
- Mask sensitive information in screenshots
- Use element screenshots to focus on specific areas
- Set up automatic failure screenshots for debugging
- Organize screenshots in folders by test suite or feature
- Use visual comparisons for regression testing

## Related Modules

- [Element Queries](./element-queries.md) - For element-based screenshots
- [Assertions](./assertions.md) - For visual assertion support
- [Error Handling](./error-handling.md) - For failure screenshot automation