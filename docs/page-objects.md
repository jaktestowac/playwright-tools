# Page Objects

The `page-objects` module provides utilities and patterns for creating maintainable page object models in Playwright tests.

## Overview

Page objects help organize your test code by encapsulating page-specific functionality and selectors. This module provides base classes and utilities to make page object creation more efficient and consistent.

## Key Features

- **Base Page Class** - Common functionality for all page objects
- **Element Locator Management** - Centralized locator definitions
- **Action Methods** - Reusable interaction patterns
- **Validation Helpers** - Page state verification methods

## Basic Usage

```typescript
import { BasePage } from "playwright-tools/page-objects";

class LoginPage extends BasePage {
  private selectors = {
    usernameInput: '[data-testid="username"]',
    passwordInput: '[data-testid="password"]',
    loginButton: '[data-testid="login-button"]',
    errorMessage: '.error-message'
  };

  async login(username: string, password: string) {
    await this.page.fill(this.selectors.usernameInput, username);
    await this.page.fill(this.selectors.passwordInput, password);
    await this.page.click(this.selectors.loginButton);
  }

  async getErrorMessage() {
    return await this.page.textContent(this.selectors.errorMessage);
  }
}
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
