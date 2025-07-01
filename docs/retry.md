# Retry

The `retry` module provides exponential backoff retry logic and utilities for handling flaky operations in Playwright tests.

## Overview

Flaky tests are a common challenge in web automation. This module provides intelligent retry mechanisms with exponential backoff, custom retry conditions, and configurable retry strategies to make your tests more reliable.

## Key Features

- **Exponential Backoff** - Smart retry delays that increase over time
- **Custom Retry Conditions** - Define when operations should be retried
- **Configurable Strategies** - Different retry patterns for different scenarios
- **Retry Statistics** - Track retry attempts and success rates
- **Circuit Breaker Pattern** - Prevent cascading failures

## Basic Usage

```typescript
import { 
  retryAction,
  retryWithExponentialBackoff,
  retryUntilSuccess,
  createRetryPolicy 
} from "playwright-tools/retry";

// Basic retry with exponential backoff
await retryAction(async () => {
  await page.click('#submit-button');
  await expect(page.locator('.success-message')).toBeVisible();
}, {
  maxRetries: 3,
  baseDelay: 1000
});

// Retry until condition is met
await retryUntilSuccess(async () => {
  const status = await page.textContent('.status');
  return status === 'Complete';
}, { timeout: 30000 });
```

## Exponential Backoff

```typescript
// Retry with increasing delays
await retryWithExponentialBackoff(async () => {
  await page.reload();
  await page.waitForSelector('.dynamic-content');
}, {
  maxRetries: 5,
  baseDelay: 500,    // Start with 500ms
  maxDelay: 10000,   // Cap at 10 seconds
  backoffFactor: 2   // Double delay each time
});

// Custom backoff calculation
await retryAction(async () => {
  // Your operation here
}, {
  maxRetries: 4,
  delayCalculation: (attempt) => Math.min(1000 * Math.pow(1.5, attempt), 8000)
});
```

## Custom Retry Conditions

```typescript
// Retry only on specific errors
await retryAction(async () => {
  await page.click('#api-call-button');
}, {
  maxRetries: 3,
  shouldRetry: (error) => {
    return error.message.includes('TimeoutError') || 
           error.message.includes('NetworkError');
  }
});

// Retry with success validation
await retryAction(async () => {
  await page.fill('#search', 'query');
  await page.press('#search', 'Enter');
  
  // Validate success condition
  const results = await page.locator('.search-result').count();
  if (results === 0) {
    throw new Error('No search results found');
  }
}, {
  maxRetries: 3,
  baseDelay: 2000
});
```

## Retry Policies

```typescript
// Create reusable retry policies
const networkRetryPolicy = createRetryPolicy({
  maxRetries: 5,
  baseDelay: 1000,
  backoffFactor: 1.5,
  shouldRetry: (error) => error.message.includes('network')
});

const uiRetryPolicy = createRetryPolicy({
  maxRetries: 3,
  baseDelay: 500,
  shouldRetry: (error) => error.message.includes('element not found')
});

// Use policies
await retryAction(async () => {
  await page.goto('https://api.example.com/data');
}, networkRetryPolicy);

await retryAction(async () => {
  await page.click('.dynamic-button');
}, uiRetryPolicy);
```

## Advanced Retry Scenarios

```typescript
// Retry with different strategies for different attempts
await retryAction(async () => {
  await page.click('#submit');
}, {
  maxRetries: 4,
  retryStrategies: [
    { attempts: [1, 2], delay: 1000 },      // Fast retries first
    { attempts: [3, 4], delay: 5000 }       // Slower retries later
  ]
});

// Retry with cleanup between attempts
await retryAction(async () => {
  await page.fill('#form-field', 'value');
  await page.click('#submit');
}, {
  maxRetries: 3,
  onRetry: async (attempt, error) => {
    console.log(`Retry attempt ${attempt}: ${error.message}`);
    await page.reload(); // Reset page state
  }
});
```

## Circuit Breaker Pattern

```typescript
// Prevent cascading failures
const circuitBreaker = createCircuitBreaker({
  failureThreshold: 5,    // Open after 5 failures
  recoveryTimeout: 30000, // Try again after 30 seconds
  monitoringPeriod: 60000 // Reset after 1 minute
});

await retryWithCircuitBreaker(async () => {
  await page.goto('https://unreliable-service.com');
}, circuitBreaker);
```

## Retry Statistics

```typescript
// Track retry performance
const stats = createRetryStatistics();

await retryAction(async () => {
  await page.click('#flaky-button');
}, {
  maxRetries: 3,
  statistics: stats
});

console.log(`Success rate: ${stats.getSuccessRate()}%`);
console.log(`Average attempts: ${stats.getAverageAttempts()}`);
console.log(`Total retries: ${stats.getTotalRetries()}`);
```

## Conditional Retry

```typescript
// Retry based on page state
await retryUntilCondition(async () => {
  await page.click('#refresh-data');
  
  const isLoading = await page.locator('.loading').isVisible();
  const hasData = await page.locator('.data-row').count() > 0;
  
  return !isLoading && hasData;
}, {
  timeout: 30000,
  interval: 2000,
  timeoutMessage: 'Data never finished loading'
});
```

## Best Practices

- Use exponential backoff to avoid overwhelming servers
- Set reasonable maximum retry counts to prevent infinite loops
- Implement proper cleanup between retry attempts
- Use specific retry conditions rather than retrying all errors
- Monitor retry statistics to identify flaky areas
- Consider circuit breaker pattern for external dependencies

## Related Modules

- [Waiting](./waiting.md) - For condition-based waiting
- [Error Handling](./error-handling.md) - For error recovery patterns
- [Network](./network.md) - For network-related retries