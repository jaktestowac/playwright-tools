# 🎭 playwright-tools

A comprehensive collection of utilities for Playwright testing that simplify common testing patterns and enhance your automation workflow.

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![NPM Version](https://img.shields.io/npm/v/playwright-tools.svg)](https://www.npmjs.com/package/playwright-tools)
[![License](https://img.shields.io/npm/l/playwright-tools.svg)](https://github.com/jaktestowac/playwright-tools/blob/main/LICENSE)

---

## ✨ Features

- 🛡️ **Safe Element Interactions** - Built-in waits and error handling for reliable interactions
- 🔄 **Retry Mechanisms** - Exponential backoff retry logic for flaky operations
- 📸 **Enhanced Screenshots** - Timestamped screenshots with debugging annotations
- 🔍 **Element Queries** - Existence checks and bulk operations without throwing errors
- 🌐 **Navigation Utilities** - Safe navigation with loading state checks
- ⌨️ **Advanced Interactions** - File uploads, drag & drop, keyboard shortcuts
- 📊 **Table Utilities** - Extract and validate table data efficiently
- 🎯 **Accessibility Helpers** - Check ARIA attributes and accessibility properties
- 💾 **Storage Management** - Handle localStorage and sessionStorage operations
- 🌍 **Network Helpers** - Wait for specific requests and monitor network activity
- 🔧 **Page Objects** - Reusable page object patterns and utilities
- 📝 **Test Data Factories** - Generate consistent test data across tests
- 📋 **Assertions** - Enhanced assertion helpers for multiple elements
- ⚡ **Test Utilities** - Filter and dispatch tests with skip/runOnly flags
- 🧪 **TypeScript Support** - Full type safety with comprehensive TypeScript definitions
- 🪶 **Zero Dependencies** - No additional dependencies beyond Playwright

---

## 📦 Installation

```bash
npm install playwright-tools
```

**Peer Dependency**: This package requires `@playwright/test` to be installed in your project.

```bash
npm install @playwright/test
```

---

## 🚀 Quick Start

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

---

## 📚 Documentation

📖 **Complete documentation is available in the [docs](./docs/) directory:**

- **[📖 Main Documentation](./docs/README.md)** - Overview and navigation
- **[🎯 Element Interactions](./docs/interactions.md)** - Safe clicks, fills, and form handling
- **[🔍 Element Queries](./docs/element-queries.md)** - Existence checks and bulk operations
- **[🌐 Navigation](./docs/navigation.md)** - Safe navigation and page management
- **[⌨️ Advanced Interactions](./docs/advanced-interactions.md)** - File uploads, drag & drop, keyboard shortcuts
- **[🌐 Locator Decorator](./docs/locator-decorator.md)** - Extend Playwright locators with custom methods
- **[📸 Screenshots](./docs/screenshots.md)** - Timestamped and debug screenshots
- **[📋 Assertions](./docs/assertions.md)** - Enhanced assertion helpers
- **[⏳ Waiting](./docs/waiting.md)** - Smart waiting strategies
- **[🔄 Retry](./docs/retry.md)** - Exponential backoff retry logic
- **[🎯 Accessibility](./docs/accessibility.md)** - ARIA and accessibility testing
- **[💾 Storage](./docs/storage.md)** - localStorage and sessionStorage management
- **[🌍 Network](./docs/network.md)** - Network request monitoring and waiting
- **[📊 Network Monitoring](./docs/network-monitoring.md)** - Advanced network analysis
- **[💬 Dialogs](./docs/dialogs.md)** - Modal and popup handling
- **[📊 Tables](./docs/tables.md)** - Table data extraction and validation
- **[🔧 Page Objects](./docs/page-objects.md)** - Reusable page object patterns
- **[⚡ Performance](./docs/performance.md)** - Performance measurement utilities
- **[🛠️ Error Handling](./docs/error-handling.md)** - Error handling patterns
- **[⚡ Test Utils](./docs/test-utils.md)** - Test filtering and dispatching

### Guides & Examples

- **[📝 Examples](./docs/examples/)** - Practical usage examples
- **[🚀 Migration Guide](./docs/migration-guide.md)** - From raw Playwright to playwright-tools
- **[🛠️ Best Practices](./docs/best-practices.md)** - Recommended patterns and configurations

---

## 💡 Quick Examples

### Form Handling

```typescript
import { fillForm, safeClick } from "playwright-tools";

await fillForm([
  { locator: page.locator("#username"), value: "john.doe" },
  { locator: page.locator("#password"), value: "secure123" },
  { locator: page.locator("#email"), value: "john@example.com" },
]);

await safeClick(page.locator("#submit"));
```

### Element Queries

```typescript
import { elementExists, waitForElements } from "playwright-tools";

// Check if element exists without throwing
const exists = await elementExists(page.locator("#optional-element"));

// Wait for multiple elements concurrently
await waitForElements([
  page.locator("#header"),
  page.locator("#navigation"),
  page.locator("#content"),
]);
```

### Network Monitoring

```typescript
import { waitForNetworkRequest } from "playwright-tools";

// Wait for specific API call
const response = await waitForNetworkRequest(page, "/api/users", {
  method: "GET",
  status: 200,
  timeout: 10000,
});
```

### Retry Logic

```typescript
import { retryAction } from "playwright-tools";

// Retry flaky operations with exponential backoff
const result = await retryAction(
  async () => {
    await page.click("#sometimes-slow-button");
    return await page.locator("#result").textContent();
  },
  { maxRetries: 3, baseDelay: 1000 }
);
```

### Locator Decorator

The **Locator Decorator** lets you extend Playwright locators with custom methods, enhanced safe interactions, and even method overrides. This makes your locators more powerful, reusable, and tailored to your app.

### Key Features

- Add your own methods to any locator
- Use enhanced methods like `safeClick`, `safeFill`, `extractData`, and more
- Override existing locator methods (e.g., custom `click`)
- Factory and page extension patterns for consistent usage

### Quick Example

```typescript
import { createEnhancedLocator, extendPage } from "playwright-tools";

// Enhance a single locator
const enhanced = createEnhancedLocator(page.locator("#my-btn"), {
  customMethods: {
    async highlight() {
      await this.evaluate(el => el.style.border = "2px solid red");
    }
  }
});
await enhanced.safeClick();
await enhanced.highlight();

// Or extend the whole page for consistent usage
const enhancedPage = extendPage(page, {
  customMethods: {
    async waitForAnimation() {
      await this.waitForFunction(() => !document.querySelector('[style*="animation"]'));
    }
  }
});
const btn = enhancedPage.locator("#my-btn");
await btn.safeClick();
await btn.waitForAnimation();
```

**See the full documentation:**  
[📖 Locator Decorator Guide](./docs/locator-decorator.md)

---

## 🔗 Quick Links

- **[📖 Full Documentation](./docs/README.md)**
- **[📝 Examples](./docs/examples/)**
- **[🚀 Migration Guide](./docs/migration-guide.md)**
- **[🛠️ Best Practices](./docs/best-practices.md)**
- **[🐛 Issues & Bug Reports](https://github.com/jaktestowac/playwright-tools/issues)**
- **[💬 Discord Community](https://discord.gg/mUAqQ7FUaZ)**

---

## 📖 Resources & Learning Materials

### **🦎 Practice Application**

- [GAD (GUI API Demo)](https://github.com/jaktestowac/gad-gui-api-demo) - Our free application designed specifically for automation practice

### **🇵🇱 Polish Resources**

- [Free Playwright Resources](https://jaktestowac.pl/darmowy-playwright/) - Comprehensive Polish learning materials
- [Playwright Basics](https://www.youtube.com/playlist?list=PLfKhn9AcZ-cD2TCB__K7NP5XARaCzZYn7) - YouTube series (Polish)
- [Playwright Elements](https://www.youtube.com/playlist?list=PLfKhn9AcZ-cAcpd-XN4pKeo-l4YK35FDA) - Advanced concepts (Polish)
- [Playwright MCP](https://www.youtube.com/playlist?list=PLfKhn9AcZ-cCqD34AG5YRejujaBqCBgl4) - MCP course (Polish)
- [Discord Community](https://discord.gg/mUAqQ7FUaZ) - First Polish Playwright community!
- [Playwright Info](https://playwright.info/) - First and only Polish Playwright blog

### **🇬🇧 English Resources**

- [VS Code Extensions](https://marketplace.visualstudio.com/publishers/jaktestowac-pl) - Our free Playwright plugins
- [Playwright Documentation](https://playwright.dev/docs/intro) - Official documentation
- [Playwright GitHub](https://github.com/microsoft/playwright) - Source code and issues

---

## 📞 Contact & Support

Feel free to reach out to us:

- 🌐 **Website**: [jaktestowac.pl](https://jaktestowac.pl)
- 💼 **LinkedIn**: [jaktestowac.pl](https://www.linkedin.com/company/jaktestowac/)
- 💬 **Discord**: [Polish Playwright Community](https://discord.gg/mUAqQ7FUaZ)
- 📧 **Support**: Check our website for contact details
- 🐛 **Issues**: [GitHub Issues](https://github.com/jaktestowac/playwright-tools/issues)

---

## 🌟 Show Your Support

If you found this package helpful:

- ⭐ **Star this repository** to show your support
- 🔄 **Share with your team** to help spread knowledge about advanced Playwright testing patterns
- 🗣️ **Tell the community** about your experience with playwright-tools
- 💝 **Contribute** by submitting issues or pull requests

---

**Happy testing and automating tests!** 🚀

**jaktestowac.pl Team** 💚❤️

_PS. For more resources and updates, follow us on our [website](https://jaktestowac.pl) and [GitHub](https://github.com/jaktestowac)._

---

_Built with 💚❤️ for the Playwright and testing automation community_

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/jaktestowac/playwright-tools.svg?style=social&label=Star)](https://github.com/jaktestowac/playwright-tools)
[![GitHub forks](https://img.shields.io/github/forks/jaktestowac/playwright-tools.svg?style=social&label=Fork)](https://github.com/jaktestowac/playwright-tools/fork)
[![GitHub issues](https://img.shields.io/github/issues/jaktestowac/playwright-tools.svg)](https://github.com/jaktestowac/playwright-tools/issues)

</div>
