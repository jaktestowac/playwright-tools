# 📚 playwright-tools Documentation

Welcome to the comprehensive documentation for `playwright-tools` - a powerful collection of utilities that enhance your Playwright testing experience.

## 🎯 Quick Navigation

### Core Modules

- **[Element Interactions](./interactions.md)** - Safe clicks, fills, and form handling
- **[Element Queries](./element-queries.md)** - Existence checks and bulk operations
- **[Navigation](./navigation.md)** - Safe navigation and page management
- **[Advanced Interactions](./advanced-interactions.md)** - File uploads, drag & drop, keyboard shortcuts
- **[Screenshots](./screenshots.md)** - Timestamped and debug screenshots
- **[Assertions](./assertions.md)** - Enhanced assertion helpers
- **[Waiting](./waiting.md)** - Smart waiting strategies
- **[Retry](./retry.md)** - Exponential backoff retry logic

### Specialized Modules

- **[Accessibility](./accessibility.md)** - ARIA and accessibility testing
- **[Storage](./storage.md)** - localStorage and sessionStorage management
- **[Network](./network.md)** - Network request monitoring and waiting
- **[Network Monitoring](./network-monitoring.md)** - Advanced network analysis
- **[Dialogs](./dialogs.md)** - Modal and popup handling
- **[Tables](./tables.md)** - Table data extraction and validation
- **[Page Objects](./page-objects.md)** - Reusable page object patterns
- **[Test Data](./test-data.md)** - Test data generation factories
- **[Performance](./performance.md)** - Performance measurement utilities
- **[Error Handling](./error-handling.md)** - Error handling patterns
- **[Test Utils](./test-utils.md)** - Test filtering and dispatching
- **[Enhanced Locators](./locator-decorator.md)** - Enhanced locator methods

### Examples & Guides

- **[Examples](./examples/)** - Practical usage examples
- **[Migration Guide](./migration-guide.md)** - From raw Playwright to playwright-tools
- **[Best Practices](./best-practices.md)** - Recommended patterns and configurations

## 🚀 Getting Started

### Installation

```bash
npm install playwright-tools
```

**Peer Dependency**: Requires `@playwright/test` to be installed in your project.

```bash
npm install @playwright/test
```

### Basic Usage

```typescript
import { safeClick, safeFill, elementExists } from "playwright-tools";

// Safe element interactions
await safeClick(page.locator("#submit-button"));
await safeFill(page.locator("#username"), "john.doe@example.com");

// Check element existence without throwing
const exists = await elementExists(page.locator("#optional-element"));
```

### Modular Imports

Import specific modules for better tree-shaking:

```typescript
// Import specific modules
import { safeClick, safeFill } from "playwright-tools/interactions";
import { waitForElements, elementExists } from "playwright-tools/element-queries";
import { takeTimestampedScreenshot } from "playwright-tools/screenshots";
import { retryAction } from "playwright-tools/retry";

// Or import everything
import * as pwUtils from "playwright-tools";
```

## 🎨 Key Features

- 🛡️ **Safe Element Interactions** - Built-in waits and error handling
- 🔄 **Retry Mechanisms** - Exponential backoff for flaky operations
- 📸 **Enhanced Screenshots** - Timestamped screenshots with debugging
- 🔍 **Element Queries** - Existence checks without throwing errors
- 🌐 **Navigation Utilities** - Safe navigation with loading checks
- ⌨️ **Advanced Interactions** - File uploads, drag & drop, keyboard shortcuts
- 📊 **Table Utilities** - Extract and validate table data
- 🎯 **Accessibility Helpers** - ARIA attributes and accessibility testing
- 💾 **Storage Management** - localStorage and sessionStorage operations
- 🌍 **Network Helpers** - Wait for requests and monitor network activity
- 🔧 **Page Objects** - Reusable page object patterns
- 📝 **Test Data Factories** - Generate consistent test data
- 📋 **Assertions** - Enhanced assertion helpers for multiple elements
- ⚡ **Test Utilities** - Filter and dispatch tests
- 🧪 **TypeScript Support** - Full type safety
- 🪶 **Zero Dependencies** - No additional dependencies beyond Playwright

## 📖 Documentation Structure

Each module has its own dedicated documentation page with:

- **Overview** - What the module provides
- **API Reference** - Complete function documentation
- **Examples** - Practical usage examples
- **Best Practices** - Recommended patterns
- **Migration Guide** - How to migrate from raw Playwright

## 🔗 Quick Links

- **[GitHub Repository](https://github.com/jaktestowac/playwright-tools)**
- **[NPM Package](https://www.npmjs.com/package/playwright-tools)**
- **[Issues & Bug Reports](https://github.com/jaktestowac/playwright-tools/issues)**
- **[Community Discord](https://discord.gg/mUAqQ7FUaZ)**

## 🆘 Need Help?

- Check the **[Examples](./examples/)** directory for practical usage
- Review the **[Migration Guide](./migration-guide.md)** for common patterns
- Join our **[Discord Community](https://discord.gg/mUAqQ7FUaZ)** for support
- Visit **[jaktestowac.pl](https://jaktestowac.pl)** for more resources

---

**Happy testing! 🚀**

_Built with 💚❤️ by the jaktestowac.pl team_
