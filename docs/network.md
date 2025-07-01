# Network

The `network` module provides utilities for monitoring and managing network requests during Playwright tests.

## Overview

Modern web applications make numerous network requests. This module helps you wait for specific requests, intercept responses, and validate network behavior to ensure your tests are reliable and comprehensive.

## Key Features

- **Request Waiting** - Wait for specific API calls to complete
- **Response Interception** - Mock or modify network responses
- **Network State Monitoring** - Track loading and idle states
- **Request Validation** - Assert request parameters and responses
- **Performance Tracking** - Monitor request timing and sizes

## Basic Usage

```typescript
import { 
  waitForRequest,
  waitForResponse,
  interceptRequest,
  waitForNetworkIdle,
  getAllRequests 
} from "playwright-tools/network";

// Wait for specific requests
await waitForRequest(page, '**/api/users');
await waitForResponse(page, '**/api/data', { status: 200 });

// Wait for network to be idle
await waitForNetworkIdle(page, { timeout: 5000 });

// Intercept and modify requests
await interceptRequest(page, '**/api/config', {
  response: { status: 200, body: { feature: 'enabled' } }
});
```

## Request Monitoring

```typescript
// Wait for multiple requests to complete
await Promise.all([
  waitForRequest(page, '**/api/user'),
  waitForRequest(page, '**/api/settings'),
  waitForRequest(page, '**/api/notifications')
]);

// Wait for request with specific method
await waitForRequest(page, '**/api/data', {
  method: 'POST',
  timeout: 10000
});

// Capture request details
const request = await waitForRequest(page, '**/api/users');
console.log('Request URL:', request.url());
console.log('Request headers:', request.headers());
```

## Response Handling

```typescript
// Wait for successful response
const response = await waitForResponse(page, '**/api/data', {
  status: 200,
  timeout: 15000
});

const responseData = await response.json();
expect(responseData).toHaveProperty('users');

// Handle different response statuses
await waitForResponse(page, '**/api/submit', {
  status: [200, 201, 202], // Accept multiple success statuses
  timeout: 10000
});
```

## Request Interception

```typescript
// Mock API responses
await interceptRequest(page, '**/api/users', {
  response: {
    status: 200,
    contentType: 'application/json',
    body: [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' }
    ]
  }
});

// Modify request headers
await interceptRequest(page, '**/api/**', {
  headers: {
    'Authorization': 'Bearer mock-token',
    'X-Test-Mode': 'true'
  }
});

// Simulate network errors
await interceptRequest(page, '**/api/flaky', {
  abort: 'failed'
});
```

## Network State Monitoring

```typescript
// Wait for all network activity to settle
await waitForNetworkIdle(page, {
  idleTime: 2000, // 2 seconds of inactivity
  timeout: 30000
});

// Monitor specific request patterns
await waitForNetworkIdle(page, {
  urlPatterns: ['**/api/**'],
  ignorePatterns: ['**/analytics/**']
});
```

## Request Validation

```typescript
// Validate request was made with correct data
const requests = await getAllRequests(page, '**/api/submit');
const submitRequest = requests[0];

expect(submitRequest.method()).toBe('POST');
expect(submitRequest.postData()).toContain('username=test');

// Assert response content
const response = await submitRequest.response();
const responseBody = await response.json();
expect(responseBody.success).toBe(true);
```

## Performance Monitoring

```typescript
// Track request timing
const performanceData = await trackRequestPerformance(page, '**/api/data');
expect(performanceData.duration).toBeLessThan(2000);

// Monitor total network usage
const networkUsage = await getNetworkUsage(page);
console.log(`Total requests: ${networkUsage.requestCount}`);
console.log(`Total bytes: ${networkUsage.totalBytes}`);
```

## Best Practices

- Always wait for critical API calls before proceeding
- Use network idle waiting for pages with dynamic content
- Mock external API dependencies for reliable tests
- Validate both request and response data
- Monitor network performance in addition to functionality
- Handle network timeouts gracefully

## Related Modules

- [Network Monitoring](./network-monitoring.md) - For advanced network analysis
- [Waiting](./waiting.md) - For coordinating network and UI waits
- [Performance](./performance.md) - For network performance metrics