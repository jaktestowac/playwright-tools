# Page Objects

The `page-objects` module provides utilities and patterns for creating maintainable page object models in Playwright tests.

## Overview

Page objects help organize your test code by encapsulating page-specific functionality and selectors. This module provides base classes and utilities to make page object creation more efficient and consistent.

## Key Features

- **Factory-based page objects** - Plain objects (no inheritance required)
- **Navigation + waiting helpers** - `navigate()`, `waitForReady()`, `reload()`, etc.
- **Safe interactions** - `safeClick()`, `safeFill()`, `fillForm()`
- **Utilities** - screenshots, network waits, accessibility checks, retries
- **Composable extensions** - add your own methods/fields via `.extend()`

## Basic Usage

```typescript
import { createPageObject } from "playwright-tools";

export function createLoginPage(page: import("@playwright/test").Page) {
  const p = createPageObject(page, "/login", {
    defaultTimeout: 10_000,
  });

  return p.extend({
    async login(username: string, password: string) {
      await p.navigate();
      await p.waitForReady();

      await p.safeFill(p.getByTestId("username"), username);
      await p.safeFill(p.getByTestId("password"), password);
      await p.safeClick(p.getByTestId("login-button"));
    },

    errorMessage() {
      return p.locator(".error-message");
    },
  });
}
```

## Composing components into a page object

If you use the `components` factories (e.g. `createTextInput`, `createDropdown`, etc.) you can attach them to a page object in a consistent way.

### Option A: add a `components` property (recommended)

```ts
import { createPageObject, withComponents, createTextInput, createCheckbox } from "playwright-tools";

export function createSettingsPage(page: import("@playwright/test").Page) {
  const p = createPageObject(page, "/settings");

  return withComponents(p, (po) => ({
    email: createTextInput(po.page, po.getByTestId("email")),
    marketingOptIn: createCheckbox(po.page, po.getByTestId("marketing")),
  }));
}

// usage
// const settings = createSettingsPage(page)
// await settings.components.email.fill("user@example.com")
// await settings.components.marketingOptIn.check()
```

### Option B: one-shot factory

```ts
import { createPageObjectWithComponents, createTextInput } from "playwright-tools";

const p = createPageObjectWithComponents(page, "/login", {}, (po) => ({
  username: createTextInput(po.page, po.getByLabel("Username")),
  password: createTextInput(po.page, po.getByLabel("Password")),
}));

await p.components.username.fill("john.doe");
```

### Lazy components

If you want components created only when first used:

```ts
import { withComponents } from "playwright-tools";

const p = withComponents(
  createPageObject(page, "/whatever"),
  (po) => ({
    // ...create components here
  }),
  { lazy: true },
);
```

## Best Practices

- Keep page objects focused on a single page or component
- Use descriptive method names that reflect user actions
- Centralize all selectors at the top of the class
- Include validation methods for page state verification
- Avoid assertions in page objects - return data for test assertions

## Related Modules

- [Element Interactions](./interactions.md) - For safe element interactions
- [Element Queries](./element-queries.md) - For element existence checks
- [Waiting](./waiting.md) - For smart waiting strategies
