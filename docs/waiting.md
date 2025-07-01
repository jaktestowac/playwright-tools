# Waiting

The `waiting` module provides smart waiting strategies and utilities for handling dynamic content in Playwright tests.

## Overview

Modern web applications are highly dynamic, with content loading asynchronously. This module offers advanced waiting strategies that go beyond basic Playwright waits, providing more reliable and efficient ways to handle dynamic content.

## Key Features

- **Smart Wait Strategies** - Intelligent waiting based on multiple conditions
- **Custom Wait Conditions** - Create your own waiting logic
- **Polling Utilities** - Wait for conditions with custom intervals
- **Timeout Management** - Configurable timeout handling
- **State-based Waiting** - Wait for specific application states

## Basic Usage

```typescript
import { 
  waitForCondition,
  waitForStableContent,
  waitForElementsToStabilize,
  pollUntil 
} from "playwright-tools/waiting";

// Wait for a custom condition
await waitForCondition(async () => {
  const count = await page.locator('.item').count();
  return count > 5;
}, { timeout: 10000 });

// Wait for content to stop changing
await waitForStableContent(page.locator('.dynamic-list'), {
  stableTime: 2000, // Wait 2 seconds without changes
  timeout: 30000
});

// Poll until condition is met
const result = await pollUntil(async () => {
  const status = await page.getAttribute('.status', 'data-state');
  return status === 'completed' ? status : null;
}, { interval: 500, timeout: 10000 });
```

## Wait Strategies

- **Element Stability** - Wait for elements to stop changing
- **Network Idle** - Wait for network requests to complete
- **Custom Conditions** - Wait for application-specific states
- **Multiple Elements** - Wait for complex element relationships
- **Value Stabilization** - Wait for values to stabilize

## Advanced Examples

```typescript
// Wait for multiple conditions simultaneously
await waitForCondition(async () => {
  const isVisible = await page.locator('#content').isVisible();
  const isEnabled = await page.locator('#submit').isEnabled();
  const hasData = await page.locator('.data-row').count() > 0;
  
  return isVisible && isEnabled && hasData;
});

// Wait for text content to stabilize
await waitForStableContent(page.locator('.loading-text'), {
  stableTime: 1000,
  checkInterval: 100
});
```

## Best Practices

- Use specific wait conditions rather than fixed timeouts
- Combine multiple wait strategies for complex scenarios
- Set reasonable timeout values based on application behavior
- Prefer waiting for content stability over arbitrary delays
- Consider network conditions when setting timeouts

## Related Modules

- [Element Queries](./element-queries.md) - For element existence checks
- [Retry](./retry.md) - For retry mechanisms with backoff
- [Network](./network.md) - For network-based waiting
