# Network Monitoring

The `network-monitoring` module provides advanced utilities for comprehensive network analysis and monitoring during Playwright tests.

## Overview

Beyond basic network request handling, this module offers detailed network analysis, performance monitoring, and advanced debugging capabilities for complex network scenarios in your Playwright tests.

## Key Features

- **Advanced Request Analysis** - Detailed request/response inspection
- **Network Performance Metrics** - Comprehensive timing analysis
- **Traffic Pattern Detection** - Identify unusual network behavior
- **Resource Optimization** - Analyze resource loading efficiency
- **Network Debugging** - Enhanced debugging tools for network issues

## Basic Usage

```typescript
import { 
  startNetworkMonitoring,
  getNetworkAnalysis,
  analyzeRequestPatterns,
  generateNetworkReport 
} from "playwright-tools/network-monitoring";

// Start comprehensive monitoring
const monitor = await startNetworkMonitoring(page);

// Perform actions while monitoring
await page.goto('https://example.com');
await page.click('#load-data');

// Get detailed analysis
const analysis = await getNetworkAnalysis(monitor);
console.log(`Total requests: ${analysis.totalRequests}`);
console.log(`Failed requests: ${analysis.failedRequests}`);
console.log(`Average response time: ${analysis.averageResponseTime}ms`);
```

## Advanced Request Analysis

```typescript
// Analyze specific request patterns
const patterns = await analyzeRequestPatterns(page, {
  timeWindow: 30000, // 30 seconds
  groupBy: 'domain',
  includeTimings: true
});

// Identify slow requests
const slowRequests = patterns.filter(req => req.duration > 2000);
console.log(`Found ${slowRequests.length} slow requests`);

// Analyze request sizes
const largeRequests = patterns.filter(req => req.responseSize > 1024 * 1024);
console.log(`Found ${largeRequests.length} requests over 1MB`);
```

## Performance Metrics

```typescript
// Get comprehensive performance data
const performance = await getNetworkPerformanceMetrics(page);

expect(performance.metrics).toMatchObject({
  totalRequestTime: expect.any(Number),
  averageRequestTime: expect.any(Number),
  totalTransferredBytes: expect.any(Number),
  requestsPerSecond: expect.any(Number)
});

// Monitor performance over time
const monitor = await startPerformanceMonitoring(page, {
  interval: 1000, // Sample every second
  duration: 30000 // Monitor for 30 seconds
});
```

## Traffic Pattern Detection

```typescript
// Detect unusual traffic patterns
const anomalies = await detectNetworkAnomalies(page, {
  baselineRequests: 10, // Expected baseline
  thresholds: {
    requestSpike: 50, // Alert if requests > 50
    errorRate: 0.1,   // Alert if error rate > 10%
    slowRequests: 0.2 // Alert if slow requests > 20%
  }
});

if (anomalies.length > 0) {
  console.log('Network anomalies detected:', anomalies);
}
```

## Resource Optimization Analysis

```typescript
// Analyze resource loading efficiency
const optimization = await analyzeResourceOptimization(page);

console.log('Optimization opportunities:');
console.log(`Uncompressed resources: ${optimization.uncompressed.length}`);
console.log(`Large images: ${optimization.largeImages.length}`);
console.log(`Render-blocking resources: ${optimization.renderBlocking.length}`);

// Generate optimization recommendations
const recommendations = await generateOptimizationRecommendations(page);
```

## Network Debugging

```typescript
// Enhanced debugging for failed requests
const failedRequests = await getFailedRequests(page);
for (const request of failedRequests) {
  console.log(`Failed: ${request.url()}`);
  console.log(`Error: ${request.failure()?.errorText}`);
  console.log(`Timing: ${JSON.stringify(request.timing())}`);
}

// Trace network issues
const trace = await traceNetworkIssues(page, {
  trackRedirects: true,
  trackCaching: true,
  trackTiming: true
});
```

## Comprehensive Reporting

```typescript
// Generate detailed network report
const report = await generateNetworkReport(page, {
  includeTimings: true,
  includeHeaders: true,
  includePayloads: false, // Exclude for privacy
  groupBy: 'resourceType'
});

// Export report for analysis
await exportNetworkReport(report, './network-analysis.json');

// Create visual network timeline
await generateNetworkTimeline(page, './timeline.html');
```

## Real-time Monitoring

```typescript
// Set up real-time monitoring with alerts
const monitor = await setupRealtimeMonitoring(page, {
  alerts: {
    slowRequest: { threshold: 3000, action: 'log' },
    failedRequest: { threshold: 1, action: 'screenshot' },
    highErrorRate: { threshold: 0.1, action: 'abort' }
  }
});

// Monitor specific endpoints
await monitorEndpoints(page, [
  { url: '**/api/critical', maxResponseTime: 1000 },
  { url: '**/api/data', maxResponseTime: 2000 }
]);
```

## Best Practices

- Monitor network behavior throughout test execution
- Set up alerts for performance regressions
- Analyze request patterns to optimize test timing
- Use network monitoring for debugging flaky tests
- Generate reports for performance tracking over time
- Monitor both functional and non-functional network aspects

## Related Modules

- [Network](./network.md) - For basic network request handling
- [Performance](./performance.md) - For general performance monitoring
- [Waiting](./waiting.md) - For network-based waiting strategies