import { Page, Request, Response } from "@playwright/test";

export interface NetworkRequestData {
  id: string;
  timestamp: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  resourceType: string;
  timing: {
    startTime: number;
    endTime?: number;
    duration?: number;
  };
}

export interface NetworkResponseData {
  id: string;
  timestamp: number;
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string;
  timing: {
    responseTime: number;
    duration: number;
  };
}

export interface NetworkEvent {
  id: string;
  type: "request" | "response" | "requestfailed";
  timestamp: number;
  request?: NetworkRequestData;
  response?: NetworkResponseData;
  error?: string;
}

export interface NetworkMonitoringOptions {
  /** Whether to capture request bodies */
  captureRequestBodies?: boolean;
  /** Whether to capture response bodies */
  captureResponseBodies?: boolean;
  /** Maximum size of bodies to capture (in bytes) */
  maxBodySize?: number;
  /** Filter URLs by pattern */
  urlFilter?: RegExp | string;
  /** Filter by HTTP methods */
  methodFilter?: string[];
  /** Filter by resource types */
  resourceTypeFilter?: string[];
  /** Whether to track performance metrics */
  trackPerformance?: boolean;
  /** Whether to automatically analyze slow requests */
  analyzeSlowRequests?: boolean;
  /** Threshold for slow requests in milliseconds */
  slowRequestThreshold?: number;
  /** Maximum number of events to store (prevents memory leaks) */
  maxEvents?: number;
  /** Error callback for handling monitoring errors */
  onError?: (error: Error, context: string) => void;
}

export interface NetworkMonitoringReport {
  summary: {
    totalRequests: number;
    totalResponses: number;
    failedRequests: number;
    averageResponseTime: number;
    slowestRequest?: NetworkEvent;
    fastestRequest?: NetworkEvent;
    totalDataTransferred: number;
    monitoringDuration: number;
  };
  requests: NetworkEvent[];
  slowRequests: NetworkEvent[];
  failedRequests: NetworkEvent[];
  performanceMetrics: {
    requestsPerSecond: number;
    averageRequestSize: number;
    averageResponseSize: number;
    cacheHitRate?: number;
  };
  urlAnalysis: {
    mostFrequentUrls: Array<{ url: string; count: number }>;
    largestResponses: Array<{ url: string; size: number }>;
    slowestEndpoints: Array<{ url: string; averageTime: number }>;
  };
}

/**
 * Advanced Network Monitoring utility for comprehensive network analysis.
 * Monitors all network requests and responses between specified moments.
 *
 * @example
 * ```typescript
 * const monitor = createNetworkMonitor(page, {
 *   captureResponseBodies: true,
 *   trackPerformance: true,
 *   slowRequestThreshold: 1000
 * });
 *
 * await monitor.start();
 * // Perform actions that generate network traffic
 * await page.goto('/api-heavy-page');
 * await monitor.stop();
 *
 * const report = monitor.getReport();
 * console.log(`Monitored ${report.summary.totalRequests} requests`);
 * ```
 */
export function createNetworkMonitor(page: Page, options: NetworkMonitoringOptions = {}) {
  if (!page) {
    throw new Error("Page instance is required for network monitoring");
  }

  const events: NetworkEvent[] = [];
  const requestMap = new Map<Request, NetworkRequestData>();
  let isMonitoring = false;
  let startTime: number;
  let endTime: number;
  const defaultOptions = {
    captureRequestBodies: false,
    captureResponseBodies: false,
    maxBodySize: 1024 * 1024, // 1MB
    urlFilter: /.*/,
    methodFilter: [],
    resourceTypeFilter: [],
    trackPerformance: true,
    analyzeSlowRequests: true,
    slowRequestThreshold: 1000,
    maxEvents: 10000,
    onError: () => {}, // Default no-op error handler
    ...options,
  };
  let requestCounter = 0;

  function generateRequestId(): string {
    return `req_${Date.now()}_${++requestCounter}`;
  }

  function addEvent(event: NetworkEvent): void {
    events.push(event);
    // Prevent memory leaks by limiting the number of stored events
    if (events.length > defaultOptions.maxEvents) {
      events.shift(); // Remove oldest event
    }
  }

  function handleError(error: Error, context: string): void {
    try {
      defaultOptions.onError(error, context);
    } catch (e) {
      // Prevent error handler from breaking the monitoring
      console.warn(`Network monitor error handler failed: ${e}`);
    }
  }

  function shouldCaptureRequest(request: Request): boolean {
    const url = request.url();
    const method = request.method();
    const resourceType = request.resourceType();

    // URL filter
    const urlPattern = defaultOptions.urlFilter;
    if (typeof urlPattern === "string" && !url.includes(urlPattern)) {
      return false;
    }
    if (urlPattern instanceof RegExp && !urlPattern.test(url)) {
      return false;
    }

    // Method filter
    if (defaultOptions.methodFilter.length > 0 && !defaultOptions.methodFilter.includes(method)) {
      return false;
    }

    // Resource type filter
    if (defaultOptions.resourceTypeFilter.length > 0 && !defaultOptions.resourceTypeFilter.includes(resourceType)) {
      return false;
    }

    return true;
  }
  async function handleRequest(request: Request) {
    if (!isMonitoring || !shouldCaptureRequest(request)) return;

    const id = generateRequestId();
    const timestamp = Date.now();
    let postData: string | undefined;
    if (defaultOptions.captureRequestBodies) {
      try {
        const body = request.postData();
        if (body && body.length <= defaultOptions.maxBodySize) {
          postData = body;
        }
      } catch (error) {
        handleError(error as Error, "Failed to capture request body");
      }
    }

    let headers: Record<string, string> = {};
    try {
      headers = await request.allHeaders();
    } catch (error) {
      handleError(error as Error, "Failed to get request headers");
    }

    const requestData: NetworkRequestData = {
      id,
      timestamp,
      url: request.url(),
      method: request.method(),
      headers,
      postData,
      resourceType: request.resourceType(),
      timing: {
        startTime: timestamp,
      },
    };

    requestMap.set(request, requestData);

    const event: NetworkEvent = {
      id,
      type: "request",
      timestamp,
      request: requestData,
    };

    addEvent(event);
  }
  async function handleResponse(response: Response) {
    if (!isMonitoring) return;

    const request = response.request();
    if (!shouldCaptureRequest(request)) return;

    const timestamp = Date.now();
    const requestData = requestMap.get(request);

    if (requestData) {
      requestData.timing.endTime = timestamp;
      requestData.timing.duration = timestamp - requestData.timing.startTime;
    }
    let body: string | undefined;
    if (defaultOptions.captureResponseBodies) {
      try {
        const responseBody = await response.body();
        if (responseBody.length <= defaultOptions.maxBodySize) {
          // Check if content is text-based to avoid corrupting binary data
          const headers = await response.allHeaders();
          // Make content-type lookup case-insensitive
          const contentType = Object.entries(headers).find(([key]) => key.toLowerCase() === "content-type")?.[1] || "";

          const isTextContent =
            contentType.includes("text/") ||
            contentType.includes("application/json") ||
            contentType.includes("application/xml") ||
            contentType.includes("application/javascript") ||
            contentType.includes("application/css");

          if (isTextContent) {
            body = responseBody.toString();
          } else {
            body = `[Binary data: ${responseBody.length} bytes, type: ${contentType}]`;
          }
        }
      } catch (error) {
        handleError(error as Error, "Failed to capture response body");
      }
    }

    let headers: Record<string, string> = {};
    try {
      headers = await response.allHeaders();
    } catch (error) {
      handleError(error as Error, "Failed to get response headers");
    }

    const responseData: NetworkResponseData = {
      id: requestData?.id || generateRequestId(),
      timestamp,
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers,
      body,
      timing: {
        responseTime: timestamp,
        duration: requestData?.timing.duration || 0,
      },
    };

    const event: NetworkEvent = {
      id: responseData.id,
      type: "response",
      timestamp,
      request: requestData,
      response: responseData,
    };

    addEvent(event);
  }
  async function handleRequestFailed(request: Request) {
    if (!isMonitoring || !shouldCaptureRequest(request)) return;

    const timestamp = Date.now();
    const requestData = requestMap.get(request);

    if (requestData) {
      requestData.timing.endTime = timestamp;
      requestData.timing.duration = timestamp - requestData.timing.startTime;
    }

    const event: NetworkEvent = {
      id: requestData?.id || generateRequestId(),
      type: "requestfailed",
      timestamp,
      request: requestData,
      error: `Request failed: ${request.failure()?.errorText}`,
    };

    addEvent(event);
  }

  return {
    /**
     * Start monitoring network activity.
     * @returns Promise that resolves when monitoring is active
     */
    async start(): Promise<void> {
      if (isMonitoring) {
        throw new Error("Network monitoring is already active");
      }

      events.length = 0;
      requestMap.clear();
      requestCounter = 0;
      isMonitoring = true;
      startTime = Date.now();

      page.on("request", handleRequest);
      page.on("response", handleResponse);
      page.on("requestfailed", handleRequestFailed);
    },

    /**
     * Stop monitoring network activity.
     * @returns Promise that resolves when monitoring is stopped
     */
    async stop(): Promise<void> {
      if (!isMonitoring) {
        throw new Error("Network monitoring is not active");
      }

      isMonitoring = false;
      endTime = Date.now();

      page.off("request", handleRequest);
      page.off("response", handleResponse);
      page.off("requestfailed", handleRequestFailed);
    },

    /**
     * Check if monitoring is currently active.
     */
    isActive(): boolean {
      return isMonitoring;
    },

    /**
     * Get all captured network events.
     */
    getEvents(): NetworkEvent[] {
      return [...events];
    },

    /**
     * Get events filtered by type.
     */
    getEventsByType(type: "request" | "response" | "requestfailed"): NetworkEvent[] {
      return events.filter((event) => event.type === type);
    },

    /**
     * Get events for a specific URL pattern.
     */
    getEventsByUrl(urlPattern: string | RegExp): NetworkEvent[] {
      return events.filter((event) => {
        const url = event.request?.url || event.response?.url || "";
        if (typeof urlPattern === "string") {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      });
    },

    /**
     * Clear all captured events.
     */
    clear(): void {
      events.length = 0;
      requestMap.clear();
      requestCounter = 0;
    },

    /**
     * Generate a comprehensive monitoring report.
     */
    getReport(): NetworkMonitoringReport {
      const responses = events.filter((e) => e.type === "response");
      const failedRequests = events.filter((e) => e.type === "requestfailed");
      const requests = events.filter((e) => e.type === "request");

      // Calculate response times
      const responseTimes = responses.map((e) => e.response?.timing.duration || 0).filter((duration) => duration > 0);

      const averageResponseTime =
        responseTimes.length > 0 ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0; // Find slowest and fastest requests
      const slowestRequest =
        responses.length > 0
          ? responses.reduce(
              (slowest, current) => {
                const currentDuration = current.response?.timing.duration || 0;
                const slowestDuration = slowest?.response?.timing.duration || 0;
                return currentDuration > slowestDuration ? current : slowest;
              },
              null as NetworkEvent | null,
            )
          : null;

      const fastestRequest =
        responses.length > 0
          ? responses.reduce(
              (fastest, current) => {
                const currentDuration = current.response?.timing.duration || 0;
                const fastestDuration = fastest?.response?.timing.duration || Infinity;
                return currentDuration < fastestDuration ? current : fastest;
              },
              null as NetworkEvent | null,
            )
          : null;

      // Calculate data transferred
      const totalDataTransferred = responses.reduce((total, event) => {
        const responseSize = event.response?.body?.length || 0;
        return total + responseSize;
      }, 0);

      // Identify slow requests
      const slowRequests = responses.filter(
        (event) => (event.response?.timing.duration || 0) > defaultOptions.slowRequestThreshold,
      );

      // URL analysis
      const urlCounts = new Map<string, number>();
      const urlSizes = new Map<string, number[]>();
      const urlTimes = new Map<string, number[]>();

      responses.forEach((event) => {
        const url = event.response?.url || "";
        const size = event.response?.body?.length || 0;
        const time = event.response?.timing.duration || 0;

        urlCounts.set(url, (urlCounts.get(url) || 0) + 1);

        if (!urlSizes.has(url)) urlSizes.set(url, []);
        urlSizes.get(url)!.push(size);

        if (!urlTimes.has(url)) urlTimes.set(url, []);
        urlTimes.get(url)!.push(time);
      });

      const mostFrequentUrls = Array.from(urlCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([url, count]) => ({ url, count }));
      const largestResponses = Array.from(urlSizes.entries())
        .map(([url, sizes]) => ({
          url,
          size: sizes.length > 0 ? Math.max(...sizes) : 0,
        }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 10);

      const slowestEndpoints = Array.from(urlTimes.entries())
        .map(([url, times]) => ({
          url,
          averageTime: times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0,
        }))
        .sort((a, b) => b.averageTime - a.averageTime)
        .slice(0, 10);

      // Performance metrics
      const monitoringDuration = endTime ? endTime - startTime : Date.now() - startTime;
      const requestsPerSecond = monitoringDuration > 0 ? (requests.length / monitoringDuration) * 1000 : 0;

      const requestSizes = requests.map((e) => e.request?.postData?.length || 0).filter((size) => size > 0);
      const averageRequestSize =
        requestSizes.length > 0 ? requestSizes.reduce((sum, size) => sum + size, 0) / requestSizes.length : 0;

      const responseSizes = responses.map((e) => e.response?.body?.length || 0).filter((size) => size > 0);
      const averageResponseSize =
        responseSizes.length > 0 ? responseSizes.reduce((sum, size) => sum + size, 0) / responseSizes.length : 0;

      return {
        summary: {
          totalRequests: requests.length,
          totalResponses: responses.length,
          failedRequests: failedRequests.length,
          averageResponseTime,
          slowestRequest: slowestRequest || undefined,
          fastestRequest: fastestRequest || undefined,
          totalDataTransferred,
          monitoringDuration,
        },
        requests: [...events],
        slowRequests,
        failedRequests,
        performanceMetrics: {
          requestsPerSecond,
          averageRequestSize,
          averageResponseSize,
        },
        urlAnalysis: {
          mostFrequentUrls,
          largestResponses,
          slowestEndpoints,
        },
      };
    },

    /**
     * Export monitoring data to JSON format.
     */
    exportToJson(): string {
      return JSON.stringify(this.getReport(), null, 2);
    },

    /**
     * Export monitoring data to CSV format.
     */
    exportToCsv(): string {
      const csvRows: string[] = [];
      const headers = [
        "Timestamp",
        "Type",
        "Method",
        "URL",
        "Status",
        "Duration (ms)",
        "Request Size",
        "Response Size",
        "Error",
      ];
      csvRows.push(headers.join(","));

      events.forEach((event) => {
        const row = [
          new Date(event.timestamp).toISOString(),
          event.type,
          event.request?.method || "",
          event.request?.url || event.response?.url || "",
          event.response?.status || "",
          event.response?.timing.duration || event.request?.timing.duration || "",
          event.request?.postData?.length || "",
          event.response?.body?.length || "",
          event.error || "",
        ];
        csvRows.push(row.map((field) => `"${field}"`).join(","));
      });

      return csvRows.join("\n");
    },
  };
}

/**
 * Monitor network activity during execution of an operation.
 * Convenience function that starts monitoring, executes operation, stops monitoring, and returns results.
 *
 * @param page - The Playwright page instance
 * @param operation - The operation to monitor
 * @param options - Monitoring options
 * @returns Promise that resolves to the operation result and monitoring report
 *
 * @example
 * ```typescript
 * const { result, report } = await monitorNetworkDuring(
 *   page,
 *   async () => {
 *     await page.goto('/api-page');
 *     await page.click('#load-data');
 *     return await page.textContent('#result');
 *   },
 *   { trackPerformance: true, captureResponseBodies: true }
 * );
 *
 * console.log(`Operation result: ${result}`);
 * console.log(`Total requests: ${report.summary.totalRequests}`);
 * ```
 */
export async function monitorNetworkDuring<T>(
  page: Page,
  operation: () => Promise<T>,
  options: NetworkMonitoringOptions = {},
): Promise<{ result: T; report: NetworkMonitoringReport }> {
  const monitor = createNetworkMonitor(page, options);

  await monitor.start();

  try {
    const result = await operation();
    await monitor.stop();
    const report = monitor.getReport();

    return { result, report };
  } catch (error) {
    await monitor.stop();
    throw error;
  }
}
