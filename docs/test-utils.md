# Test Utils

The `test-utils` module provides utilities for organizing, filtering, and managing your Playwright tests efficiently.

## Overview

As test suites grow, organizing and managing tests becomes challenging. This module offers utilities for test filtering, test data management, test execution control, and test organization patterns.

## Key Features

- **Test Filtering** - Run specific test subsets based on criteria
- **Test Dispatching** - Distribute tests across multiple workers
- **Test Tagging** - Organize tests with metadata tags
- **Environment Detection** - Adapt tests to different environments
- **Test Helpers** - Common test setup and teardown utilities

## Basic Usage

```typescript
import { 
  filterTestsByTag,
  runTestsInParallel,
  setupTestEnvironment,
  skipTestIf,
  onlyRunIf 
} from "playwright-tools/test-utils";

// Filter tests by tags
const smokeTests = filterTestsByTag(["smoke", "critical"]);

// Conditional test execution
test.describe("Mobile Tests", () => {
  skipTestIf(!isMobile, "Desktop only test");
  
  test("mobile navigation", async ({ page }) => {
    // Mobile-specific test logic
  });
});

// Environment-specific setup
test.beforeEach(async ({ page }) => {
  await setupTestEnvironment(page, {
    environment: process.env.TEST_ENV || "staging",
    features: ["feature-flag-1", "feature-flag-2"]
  });
});
```

## Test Organization

- **Tags and Labels** - Categorize tests by functionality
- **Test Suites** - Group related tests together
- **Parallel Execution** - Optimize test run times
- **Environment Configuration** - Manage different test environments
- **Test Dependencies** - Handle test order and dependencies

## Filtering Options

- **By Tags** - Run tests with specific tags
- **By Environment** - Run environment-specific tests
- **By Feature** - Run tests for specific features
- **By Priority** - Run high-priority tests first
- **By Duration** - Filter by test execution time

## Best Practices

- Use descriptive tags for easy test filtering
- Keep test dependencies minimal
- Design tests to run independently
- Use environment variables for configuration
- Implement proper test isolation

## Related Modules

- [Page Objects](./page-objects.md) - For test organization patterns
- [Error Handling](./error-handling.md) - For robust test execution
