# Performance

The `performance` module provides utilities for measuring and monitoring performance metrics during your Playwright tests.

## Overview

Performance testing is essential for web applications. This module helps you capture performance metrics, monitor page load times, and track resource usage during test execution.

## Key Features

- **Page Load Metrics** - Measure page load performance
- **Resource Monitoring** - Track network requests and responses
- **Memory Usage** - Monitor memory consumption
- **Timing Utilities** - Measure custom operations
- **Performance Assertions** - Validate performance thresholds

## Basic Usage

```typescript
import { 
  measurePageLoad, 
  trackResourceUsage,
  startPerformanceMonitoring,
  getPerformanceMetrics 
} from "playwright-tools/performance";

// Measure page load time
const loadTime = await measurePageLoad(page, "https://example.com");
console.log(`Page loaded in ${loadTime}ms`);

// Monitor resource usage
await startPerformanceMonitoring(page);
await page.goto("https://example.com");
const metrics = await getPerformanceMetrics(page);

// Assert performance thresholds
expect(metrics.loadTime).toBeLessThan(3000); // Under 3 seconds
expect(metrics.totalBytes).toBeLessThan(1024 * 1024); // Under 1MB
```

## Performance Metrics

- **First Contentful Paint (FCP)** - Time to first content render
- **Largest Contentful Paint (LCP)** - Time to largest content render
- **Cumulative Layout Shift (CLS)** - Visual stability metric
- **Time to Interactive (TTI)** - Time until page is interactive
- **Total Blocking Time (TBT)** - Main thread blocking time

## Best Practices

- Set realistic performance thresholds based on your application
- Monitor performance in different network conditions
- Track performance trends over time
- Test on various devices and browsers
- Focus on user-perceived performance metrics

## Related Modules

- [Network Monitoring](./network-monitoring.md) - For detailed network analysis
- [Screenshots](./screenshots.md) - For visual performance documentation
- [Assertions](./assertions.md) - For threshold validation
