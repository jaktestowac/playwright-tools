# Error Handling

The `error-handling` module provides robust error handling patterns and utilities for Playwright tests.

## Overview

Proper error handling is crucial for stable and maintainable tests. This module offers patterns for graceful error recovery, detailed error reporting, and retry mechanisms for common failure scenarios.

## Key Features

- **Error Recovery Patterns** - Graceful handling of common failures
- **Custom Error Types** - Specific error classes for different scenarios
- **Error Reporting** - Detailed error information and context
- **Retry Mechanisms** - Automatic retry for transient failures
- **Debugging Helpers** - Tools for error investigation

## Basic Usage

```typescript
import { 
  withErrorHandling,
  retryOnError,
  captureErrorContext,
  isTransientError 
} from "playwright-tools/error-handling";

// Wrap operations with error handling
await withErrorHandling(async () => {
  await page.click("#submit-button");
}, {
  onError: async (error) => {
    await captureErrorContext(page, error);
  }
});

// Retry operations that might fail temporarily
await retryOnError(async () => {
  await page.waitForSelector(".dynamic-content");
}, {
  maxRetries: 3,
  delay: 1000
});
```

## Error Types

- **TimeoutError** - Element or operation timeouts
- **NetworkError** - Network-related failures
- **ElementNotFoundError** - Missing elements
- **NavigationError** - Page navigation failures
- **ValidationError** - Test assertion failures

## Error Recovery Strategies

- **Retry with Backoff** - Exponential delay between retries
- **Fallback Actions** - Alternative actions when primary fails
- **Context Preservation** - Maintain test state during recovery
- **Graceful Degradation** - Continue with reduced functionality
- **Fast Fail** - Quick failure for unrecoverable errors

## Best Practices

- Use specific error types for different failure modes
- Capture screenshots and page state on errors
- Log detailed error context for debugging
- Implement appropriate retry strategies
- Avoid catching errors you can't handle meaningfully

## Related Modules

- [Retry](./retry.md) - For exponential backoff retry logic
- [Screenshots](./screenshots.md) - For error documentation
- [Test Utils](./test-utils.md) - For test organization and filtering
