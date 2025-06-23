/**
 * Advanced Network Monitoring Examples
 *
 * This file demonstrates various use cases for the network monitoring functionality.
 * These examples can be used as reference for implementing network monitoring in your tests.
 */

import { Page } from "@playwright/test";
import { createNetworkMonitor, monitorNetworkDuring } from "../src/network-monitoring";

/**
 * Example 1: Basic Network Monitoring
 * Monitor all network activity during page navigation
 */
export async function basicNetworkMonitoring(page: Page) {
  const monitor = createNetworkMonitor(page);

  await monitor.start();
  await page.goto("https://example.com");
  await monitor.stop();

  const report = monitor.getReport();
  console.log(`Total requests: ${report.summary.totalRequests}`);
  console.log(`Failed requests: ${report.summary.failedRequests}`);
  console.log(`Average response time: ${report.summary.averageResponseTime}ms`);

  return report;
}

/**
 * Example 2: API Performance Testing
 * Monitor API calls and analyze performance
 */
export async function apiPerformanceTest(page: Page) {
  const monitor = createNetworkMonitor(page, {
    urlFilter: /\/api\//,
    captureResponseBodies: true,
    trackPerformance: true,
    slowRequestThreshold: 500,
  });

  await monitor.start();

  // Simulate API-heavy operations
  await page.goto("/dashboard");
  await page.click("#load-data-button");
  await page.waitForSelector("#data-loaded");

  await monitor.stop();

  const report = monitor.getReport();

  console.log("API Performance Report:");
  console.log(`- API requests: ${report.summary.totalRequests}`);
  console.log(`- Slow API calls: ${report.slowRequests.length}`);
  console.log(`- Requests per second: ${report.performanceMetrics.requestsPerSecond.toFixed(2)}`);

  // Export detailed report
  const jsonReport = monitor.exportToJson();
  // Save to file or send to monitoring system

  return report;
}

/**
 * Example 3: Monitoring Specific User Journey
 * Track network activity during a complete user workflow
 */
export async function userJourneyNetworkAnalysis(page: Page) {
  const { result, report } = await monitorNetworkDuring(
    page,
    async () => {
      // Complete user journey
      await page.goto("/login");
      await page.fill("#username", "user@example.com");
      await page.fill("#password", "password123");
      await page.click("#login-button");
      await page.waitForURL("/dashboard");

      await page.click("#profile-menu");
      await page.click("#settings-link");
      await page.waitForURL("/settings");

      return "User journey completed";
    },
    {
      captureRequestBodies: true,
      captureResponseBodies: true,
      trackPerformance: true,
    },
  );

  console.log(`Journey result: ${result}`);
  console.log(`Network requests during journey: ${report.summary.totalRequests}`);
  console.log(`Data transferred: ${(report.summary.totalDataTransferred / 1024).toFixed(2)} KB`);

  // Analyze most frequent endpoints
  report.urlAnalysis.mostFrequentUrls.forEach((url, index) => {
    console.log(`${index + 1}. ${url.url} (${url.count} calls)`);
  });

  return report;
}

/**
 * Example 4: Error Detection and Analysis
 * Focus on network failures and error responses
 */
export async function networkErrorAnalysis(page: Page) {
  const monitor = createNetworkMonitor(page, {
    captureResponseBodies: true,
  });

  await monitor.start();

  // Navigate to page that might have network issues
  await page.goto("/problematic-page");

  // Wait for page to fully load and potentially fail some requests
  await page.waitForTimeout(5000);

  await monitor.stop();

  const report = monitor.getReport();

  console.log("Network Error Analysis:");
  console.log(`- Total requests: ${report.summary.totalRequests}`);
  console.log(`- Failed requests: ${report.summary.failedRequests}`);
  console.log(
    `- Success rate: ${(((report.summary.totalResponses - report.summary.failedRequests) / report.summary.totalRequests) * 100).toFixed(2)}%`,
  );

  // Log failed requests
  if (report.failedRequests.length > 0) {
    console.log("\nFailed Requests:");
    report.failedRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.request?.url} - ${req.error}`);
    });
  }

  // Log slow requests
  if (report.slowRequests.length > 0) {
    console.log("\nSlow Requests:");
    report.slowRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.response?.url} - ${req.response?.timing.duration}ms`);
    });
  }

  return report;
}

/**
 * Example 5: Real-time Network Monitoring
 * Monitor network activity in real-time during test execution
 */
export async function realTimeNetworkMonitoring(page: Page) {
  const monitor = createNetworkMonitor(page, {
    trackPerformance: true,
  });

  // Set up real-time logging
  const logInterval = setInterval(() => {
    if (monitor.isActive()) {
      const events = monitor.getEvents();
      const requests = events.filter((e) => e.type === "request").length;
      const responses = events.filter((e) => e.type === "response").length;
      const failed = events.filter((e) => e.type === "requestfailed").length;

      console.log(`[${new Date().toISOString()}] Requests: ${requests}, Responses: ${responses}, Failed: ${failed}`);
    }
  }, 1000);

  await monitor.start();

  // Perform test operations
  await page.goto("/spa-application");
  await page.click("#dynamic-content-button");
  await page.waitForSelector(".dynamic-content");

  // Continue monitoring for a bit
  await page.waitForTimeout(3000);

  await monitor.stop();
  clearInterval(logInterval);

  const finalReport = monitor.getReport();
  console.log("\nFinal Network Summary:");
  console.log(`Duration: ${finalReport.summary.monitoringDuration}ms`);
  console.log(`Total network activity: ${finalReport.summary.totalRequests} requests`);

  return finalReport;
}

/**
 * Example 6: Network Performance Regression Testing
 * Compare network performance against baseline metrics
 */
export async function performanceRegressionTest(page: Page, baselineMetrics?: any) {
  const { result, report } = await monitorNetworkDuring(
    page,
    async () => {
      await page.goto("/performance-critical-page");
      await page.waitForLoadState("networkidle");
      return "Performance test completed";
    },
    {
      trackPerformance: true,
      slowRequestThreshold: 1000,
    },
  );

  const currentMetrics = {
    totalRequests: report.summary.totalRequests,
    averageResponseTime: report.summary.averageResponseTime,
    slowRequestCount: report.slowRequests.length,
    failureRate: report.summary.failedRequests / report.summary.totalRequests,
    dataTransferred: report.summary.totalDataTransferred,
  };

  console.log("Current Performance Metrics:", currentMetrics);

  if (baselineMetrics) {
    console.log("\nPerformance Comparison:");

    const responseTimeDiff = currentMetrics.averageResponseTime - baselineMetrics.averageResponseTime;
    const responseTimeChange = ((responseTimeDiff / baselineMetrics.averageResponseTime) * 100).toFixed(2);

    console.log(
      `Response time: ${currentMetrics.averageResponseTime}ms (${responseTimeChange > 0 ? "+" : ""}${responseTimeChange}%)`,
    );

    const requestCountDiff = currentMetrics.totalRequests - baselineMetrics.totalRequests;
    console.log(
      `Request count: ${currentMetrics.totalRequests} (${requestCountDiff > 0 ? "+" : ""}${requestCountDiff})`,
    );

    // Flag potential regressions
    if (Math.abs(responseTimeDiff) > 100) {
      console.warn(`⚠️  Significant response time change detected: ${responseTimeDiff}ms`);
    }

    if (currentMetrics.slowRequestCount > baselineMetrics.slowRequestCount) {
      console.warn(
        `⚠️  Increased slow requests: ${currentMetrics.slowRequestCount} vs ${baselineMetrics.slowRequestCount}`,
      );
    }
  }

  return { currentMetrics, report };
}

/**
 * Example 7: Export and Save Network Data
 * Demonstrate different export formats and data persistence
 */
export async function exportNetworkData(page: Page, testName: string) {
  const monitor = createNetworkMonitor(page, {
    captureRequestBodies: true,
    captureResponseBodies: true,
    trackPerformance: true,
  });

  await monitor.start();
  await page.goto("/data-heavy-page");
  await monitor.stop();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  // Export as JSON
  const jsonData = monitor.exportToJson();
  console.log(`JSON report size: ${jsonData.length} characters`);

  // Export as CSV
  const csvData = monitor.exportToCsv();
  console.log(`CSV report size: ${csvData.split("\n").length} lines`);

  // You could save these to files:
  // await fs.writeFile(`network-${testName}-${timestamp}.json`, jsonData);
  // await fs.writeFile(`network-${testName}-${timestamp}.csv`, csvData);

  return { jsonData, csvData };
}
