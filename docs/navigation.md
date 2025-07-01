# Navigation

The `navigation` module provides safe navigation utilities and page management helpers for Playwright tests.

## Overview

Navigation in web applications can be complex, involving loading states, redirects, and dynamic content. This module provides utilities for safe navigation, page state validation, and handling various navigation scenarios reliably.

## Key Features

- **Safe Navigation** - Navigate with loading state validation
- **Page State Checking** - Verify page loaded correctly
- **URL Validation** - Assert navigation to correct URLs
- **Browser History** - Manage back/forward navigation
- **Multi-tab Management** - Handle multiple browser tabs

## Basic Usage

```typescript
import { 
  safeNavigate,
  waitForPageLoad,
  assertCurrentUrl,
  goBack,
  goForward 
} from "playwright-tools/navigation";

// Safe navigation with loading validation
await safeNavigate(page, 'https://example.com', {
  waitForSelector: '.main-content',
  timeout: 10000
});

// Validate current URL
await assertCurrentUrl(page, /dashboard/);

// Browser history navigation
await goBack(page);
await goForward(page);
```

## Safe Navigation

```typescript
// Navigate and wait for specific elements
await safeNavigate(page, '/login', {
  waitForSelector: '#login-form',
  waitForNetworkIdle: true,
  timeout: 15000
});

// Navigate with custom loading validation
await safeNavigate(page, '/dashboard', {
  waitForFunction: () => window.appReady === true,
  waitForSelector: '.dashboard-content',
  expectedTitle: /Dashboard/
});
```

## Page State Validation

```typescript
// Wait for complete page load
await waitForPageLoad(page, {
  networkIdle: true,
  domContentLoaded: true,
  requiredElements: ['.header', '.navigation', '.content']
});

// Validate page is ready for interaction
const isReady = await isPageReady(page, {
  checkElements: ['.interactive-element'],
  checkNetworkIdle: true,
  timeout: 5000
});
```

## URL and Route Management

```typescript
// Assert current URL matches pattern
await assertCurrentUrl(page, 'https://example.com/dashboard');
await assertCurrentUrl(page, /\/users\/\d+/);

// Wait for URL change
await waitForUrlChange(page, {
  expectedUrl: /success/,
  timeout: 10000
});

// Handle redirects
await handleRedirect(page, {
  fromUrl: '/old-page',
  toUrl: '/new-page',
  timeout: 5000
});
```

## Browser History

```typescript
// Navigate through browser history
await goBack(page, { waitForLoad: true });
await goForward(page, { waitForLoad: true });

// Navigate to specific history position
await navigateToHistoryPosition(page, -2); // Go back 2 pages
```

## Multi-tab Management

```typescript
// Open new tab and switch
const newTab = await openNewTab(page.context(), 'https://example.com');
await switchToTab(newTab);

// Close tab and return to original
await closeTab(newTab);
await switchToTab(page);
```

## Advanced Navigation Scenarios

```typescript
// Navigate with retry on failure
await navigateWithRetry(page, '/unstable-page', {
  maxRetries: 3,
  retryDelay: 1000,
  waitForSelector: '.content'
});

// Handle single-page application navigation
await navigateSPA(page, '/route', {
  waitForPushState: true,
  waitForSelector: '[data-route="/route"]'
});
```

## Best Practices

- Always wait for page load completion before interactions
- Validate URLs after navigation to ensure correct routing
- Handle loading states and network delays
- Use specific selectors to confirm page content loaded
- Test navigation with slow network conditions
- Handle navigation errors gracefully

## Related Modules

- [Waiting](./waiting.md) - For advanced waiting strategies
- [Element Queries](./element-queries.md) - For page state validation
- [Network](./network.md) - For network-based navigation waiting