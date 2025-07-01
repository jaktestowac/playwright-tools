# Storage

The `storage` module provides utilities for managing localStorage, sessionStorage, and cookies in Playwright tests.

## Overview

Modern web applications heavily rely on browser storage for state management, user preferences, and session data. This module provides utilities to easily manipulate and validate browser storage during your tests.

## Key Features

- **localStorage Management** - Set, get, and clear localStorage data
- **sessionStorage Operations** - Manage session-specific storage
- **Cookie Utilities** - Handle cookies with advanced options
- **Storage State Validation** - Assert storage contents and states
- **Bulk Storage Operations** - Efficiently manage multiple storage items

## Basic Usage

```typescript
import { 
  setLocalStorageItem,
  getLocalStorageItem,
  clearLocalStorage,
  setSessionStorageItem,
  getAllCookies 
} from "playwright-tools/storage";

// localStorage operations
await setLocalStorageItem(page, 'user-preference', 'dark-mode');
const preference = await getLocalStorageItem(page, 'user-preference');
console.log(preference); // 'dark-mode'

// sessionStorage operations  
await setSessionStorageItem(page, 'temp-data', JSON.stringify({ id: 123 }));

// Clear all storage
await clearLocalStorage(page);
await clearSessionStorage(page);
```

## localStorage Management

```typescript
// Set individual items
await setLocalStorageItem(page, 'theme', 'dark');
await setLocalStorageItem(page, 'language', 'en-US');

// Set multiple items at once
await setLocalStorageItems(page, {
  'user-id': '12345',
  'session-token': 'abc123',
  'preferences': JSON.stringify({ theme: 'dark', lang: 'en' })
});

// Get and validate items
const userId = await getLocalStorageItem(page, 'user-id');
expect(userId).toBe('12345');

// Get all localStorage data
const allData = await getAllLocalStorageItems(page);
console.log('All localStorage:', allData);
```

## sessionStorage Operations

```typescript
// Session-specific data management
await setSessionStorageItem(page, 'form-draft', JSON.stringify({
  name: 'John Doe',
  email: 'john@example.com'
}));

// Retrieve and parse session data
const formDraft = await getSessionStorageItem(page, 'form-draft');
const parsedDraft = JSON.parse(formDraft);

// Clear specific session items
await removeSessionStorageItem(page, 'temp-token');

// Check if session item exists
const exists = await sessionStorageItemExists(page, 'user-session');
```

## Cookie Management

```typescript
// Set cookies with options
await setCookie(page, 'session-id', 'abc123', {
  domain: 'example.com',
  path: '/',
  expires: Date.now() + 86400000, // 24 hours
  httpOnly: true,
  secure: true
});

// Get specific cookie
const sessionCookie = await getCookie(page, 'session-id');
console.log('Session ID:', sessionCookie.value);

// Get all cookies
const allCookies = await getAllCookies(page);
console.log(`Found ${allCookies.length} cookies`);

// Delete cookies
await deleteCookie(page, 'temp-cookie');
await deleteAllCookies(page);
```

## Storage State Validation

```typescript
// Assert localStorage contains expected data
await assertLocalStorageContains(page, {
  'user-authenticated': 'true',
  'user-role': 'admin'
});

// Assert sessionStorage is empty
await assertSessionStorageEmpty(page);

// Validate cookie properties
await assertCookieExists(page, 'auth-token');
await assertCookieHasProperty(page, 'session-id', {
  secure: true,
  httpOnly: true
});
```

## Bulk Operations

```typescript
// Backup storage state
const storageBackup = await backupStorageState(page);

// Restore storage state
await restoreStorageState(page, storageBackup);

// Copy storage between contexts
const sourceStorage = await exportStorageState(sourcePage);
await importStorageState(targetPage, sourceStorage);

// Clear all storage types
await clearAllStorage(page); // localStorage + sessionStorage + cookies
```

## Advanced Storage Scenarios

```typescript
// Wait for storage to be populated
await waitForStorageItem(page, 'app-initialized', 'true', {
  timeout: 10000
});

// Monitor storage changes
const monitor = await startStorageMonitoring(page);
// ... perform actions ...
const changes = await getStorageChanges(monitor);
console.log('Storage changes:', changes);

// Set storage before navigation
await setStorageForContext(page.context(), {
  localStorage: { 'return-url': '/dashboard' },
  sessionStorage: { 'temp-id': '789' },
  cookies: [{ name: 'preference', value: 'compact-view' }]
});
```

## Storage Utilities

```typescript
// Get storage size information
const storageInfo = await getStorageInfo(page);
console.log(`localStorage: ${storageInfo.localStorage.size} bytes`);
console.log(`sessionStorage: ${storageInfo.sessionStorage.size} bytes`);
console.log(`Cookies: ${storageInfo.cookies.count} items`);

// Check storage quota
const quota = await getStorageQuota(page);
if (quota.usage > quota.quota * 0.9) {
  console.warn('Storage nearly full!');
}
```

## Test Setup Helpers

```typescript
// Set up common test data
await setupTestStorage(page, {
  userRole: 'admin',
  authToken: 'test-token-123',
  preferences: {
    theme: 'dark',
    language: 'en-US',
    notifications: true
  }
});

// Clean up after tests
test.afterEach(async ({ page }) => {
  await clearTestStorage(page);
});
```

## Best Practices

- Clear storage before tests to ensure clean state
- Use JSON.stringify/parse for complex objects in storage
- Set appropriate cookie security flags for authentication
- Monitor storage usage to avoid quota limits
- Back up storage state for complex test scenarios
- Validate storage state after authentication flows

## Related Modules

- [Assertions](./assertions.md) - For storage state validation
- [Navigation](./navigation.md) - For storage persistence across pages
- [Test Utils](./test-utils.md) - For test storage setup helpers