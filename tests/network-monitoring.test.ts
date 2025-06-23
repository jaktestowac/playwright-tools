import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { createNetworkMonitor, monitorNetworkDuring } from "../src/network-monitoring";

describe("Network Monitoring", () => {
  let mockPage: any;
  let mockRequest: any;
  let mockResponse: any;
  let requestHandler: any;
  let responseHandler: any;
  let requestFailedHandler: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      url: vi.fn().mockReturnValue("https://api.example.com/users"),
      method: vi.fn().mockReturnValue("GET"),
      resourceType: vi.fn().mockReturnValue("xhr"),
      allHeaders: vi.fn().mockResolvedValue({ "Content-Type": "application/json" }),
      postData: vi.fn().mockReturnValue('{"key":"value"}'),
      failure: vi.fn().mockReturnValue({ errorText: "Network error" }),
    };

    mockResponse = {
      url: vi.fn().mockReturnValue("https://api.example.com/users"),
      status: vi.fn().mockReturnValue(200),
      statusText: vi.fn().mockReturnValue("OK"),
      allHeaders: vi.fn().mockResolvedValue({ "Content-Type": "application/json" }),
      body: vi.fn().mockResolvedValue(Buffer.from('{"users": []}')),
      request: vi.fn().mockReturnValue(mockRequest),
    };

    mockPage = {
      on: vi.fn().mockImplementation((event, handler) => {
        if (event === "request") requestHandler = handler;
        if (event === "response") responseHandler = handler;
        if (event === "requestfailed") requestFailedHandler = handler;
      }),
      off: vi.fn(),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createNetworkMonitor", () => {
    test("should create monitor with default options", () => {
      const monitor = createNetworkMonitor(mockPage);

      expect(monitor.isActive()).toBe(false);
      expect(monitor.getEvents()).toEqual([]);
    });

    test("should start and stop monitoring", async () => {
      const monitor = createNetworkMonitor(mockPage);

      expect(monitor.isActive()).toBe(false);

      await monitor.start();
      expect(monitor.isActive()).toBe(true);
      expect(mockPage.on).toHaveBeenCalledTimes(3);

      await monitor.stop();
      expect(monitor.isActive()).toBe(false);
      expect(mockPage.off).toHaveBeenCalledTimes(3);
    });

    test("should throw error when starting already active monitoring", async () => {
      const monitor = createNetworkMonitor(mockPage);

      await monitor.start();
      await expect(monitor.start()).rejects.toThrow("Network monitoring is already active");
    });

    test("should throw error when stopping inactive monitoring", async () => {
      const monitor = createNetworkMonitor(mockPage);

      await expect(monitor.stop()).rejects.toThrow("Network monitoring is not active");
    });

    test("should capture network requests", async () => {
      const monitor = createNetworkMonitor(mockPage, {
        captureRequestBodies: true,
      });

      await monitor.start();

      // Simulate a request
      await requestHandler(mockRequest);

      const events = monitor.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("request");
      expect(events[0].request?.url).toBe("https://api.example.com/users");
      expect(events[0].request?.method).toBe("GET");
      expect(events[0].request?.postData).toBe('{"key":"value"}');
    });

    test("should capture network responses", async () => {
      const monitor = createNetworkMonitor(mockPage, {
        captureResponseBodies: true,
      });

      await monitor.start();

      // Simulate request first, then response
      await requestHandler(mockRequest);
      await responseHandler(mockResponse);

      const events = monitor.getEvents();
      expect(events).toHaveLength(2);

      const responseEvent = events.find((e) => e.type === "response");
      expect(responseEvent).toBeDefined();
      expect(responseEvent?.response?.status).toBe(200);
      expect(responseEvent?.response?.body).toBe('{"users": []}');
    });

    test("should capture failed requests", async () => {
      const monitor = createNetworkMonitor(mockPage);

      await monitor.start();

      // Simulate request and failure
      await requestHandler(mockRequest);
      await requestFailedHandler(mockRequest);

      const events = monitor.getEvents();
      expect(events).toHaveLength(2);

      const failedEvent = events.find((e) => e.type === "requestfailed");
      expect(failedEvent).toBeDefined();
      expect(failedEvent?.error).toContain("Network error");
    });

    test("should filter requests by URL pattern", async () => {
      const monitor = createNetworkMonitor(mockPage, {
        urlFilter: /api\.example\.com/,
      });

      await monitor.start();

      // This should be captured
      await requestHandler(mockRequest);

      // This should be filtered out
      const otherRequest = {
        ...mockRequest,
        url: vi.fn().mockReturnValue("https://other.com/data"),
      };
      await requestHandler(otherRequest);

      const events = monitor.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].request?.url).toBe("https://api.example.com/users");
    });

    test("should filter requests by HTTP method", async () => {
      const monitor = createNetworkMonitor(mockPage, {
        methodFilter: ["POST", "PUT"],
      });

      await monitor.start();

      // This should be filtered out (GET)
      await requestHandler(mockRequest);

      // This should be captured (POST)
      const postRequest = {
        ...mockRequest,
        method: vi.fn().mockReturnValue("POST"),
      };
      await requestHandler(postRequest);

      const events = monitor.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].request?.method).toBe("POST");
    });

    test("should respect maxBodySize limit", async () => {
      const monitor = createNetworkMonitor(mockPage, {
        captureRequestBodies: true,
        maxBodySize: 5, // Very small limit
      });

      await monitor.start();

      const largeBodyRequest = {
        ...mockRequest,
        postData: vi.fn().mockReturnValue("this is a very long request body"),
      };
      await requestHandler(largeBodyRequest);

      const events = monitor.getEvents();
      expect(events[0].request?.postData).toBeUndefined();
    });

    test("should get events by type", async () => {
      const monitor = createNetworkMonitor(mockPage);

      await monitor.start();

      await requestHandler(mockRequest);
      await responseHandler(mockResponse);
      await requestFailedHandler(mockRequest);

      expect(monitor.getEventsByType("request")).toHaveLength(1);
      expect(monitor.getEventsByType("response")).toHaveLength(1);
      expect(monitor.getEventsByType("requestfailed")).toHaveLength(1);
    });

    test("should get events by URL pattern", async () => {
      const monitor = createNetworkMonitor(mockPage);

      await monitor.start();

      await requestHandler(mockRequest);

      const otherRequest = {
        ...mockRequest,
        url: vi.fn().mockReturnValue("https://other.com/data"),
      };
      await requestHandler(otherRequest);

      const apiEvents = monitor.getEventsByUrl(/api\.example\.com/);
      expect(apiEvents).toHaveLength(1);

      const otherEvents = monitor.getEventsByUrl("other.com");
      expect(otherEvents).toHaveLength(1);
    });

    test("should clear events", async () => {
      const monitor = createNetworkMonitor(mockPage);

      await monitor.start();
      await requestHandler(mockRequest);

      expect(monitor.getEvents()).toHaveLength(1);

      monitor.clear();
      expect(monitor.getEvents()).toHaveLength(0);
    });

    test("should generate comprehensive report", async () => {
      vi.useFakeTimers();
      const startTime = Date.now();

      const monitor = createNetworkMonitor(mockPage, {
        captureResponseBodies: true,
        slowRequestThreshold: 100,
      });

      await monitor.start();

      // Simulate multiple requests with different timings
      await requestHandler(mockRequest);

      vi.advanceTimersByTime(50);
      await responseHandler(mockResponse);

      // Simulate a slow request
      const slowRequest = {
        ...mockRequest,
        url: vi.fn().mockReturnValue("https://api.example.com/slow"),
      };
      await requestHandler(slowRequest);

      vi.advanceTimersByTime(200);
      const slowResponse = {
        ...mockResponse,
        url: vi.fn().mockReturnValue("https://api.example.com/slow"),
        request: vi.fn().mockReturnValue(slowRequest),
      };
      await responseHandler(slowResponse);

      // Simulate a failed request
      await requestHandler(mockRequest);
      await requestFailedHandler(mockRequest);

      await monitor.stop();

      const report = monitor.getReport();

      expect(report.summary.totalRequests).toBe(3);
      expect(report.summary.totalResponses).toBe(2);
      expect(report.summary.failedRequests).toBe(1);
      expect(report.slowRequests).toHaveLength(1);
      expect(report.failedRequests).toHaveLength(1);
      expect(report.performanceMetrics.requestsPerSecond).toBeGreaterThan(0);
      expect(report.urlAnalysis.mostFrequentUrls).toBeDefined();
    });

    test("should export to JSON format", async () => {
      const monitor = createNetworkMonitor(mockPage);

      await monitor.start();
      await requestHandler(mockRequest);
      await monitor.stop();

      const json = monitor.exportToJson();
      const parsed = JSON.parse(json);

      expect(parsed.summary).toBeDefined();
      expect(parsed.requests).toBeDefined();
      expect(parsed.summary.totalRequests).toBe(1);
    });

    test("should export to CSV format", async () => {
      const monitor = createNetworkMonitor(mockPage);

      await monitor.start();
      await requestHandler(mockRequest);
      await responseHandler(mockResponse);
      await monitor.stop();

      const csv = monitor.exportToCsv();
      const lines = csv.split("\n");

      expect(lines[0]).toContain("Timestamp,Type,Method,URL");
      expect(lines).toHaveLength(3); // Header + 2 events
      expect(lines[1]).toContain("request");
      expect(lines[2]).toContain("response");
    });
  });

  describe("monitorNetworkDuring", () => {
    test("should monitor network during operation execution", async () => {
      const operation = vi.fn().mockResolvedValue("operation result");

      const { result, report } = await monitorNetworkDuring(mockPage, operation, { captureResponseBodies: true });

      expect(result).toBe("operation result");
      expect(operation).toHaveBeenCalledTimes(1);
      expect(report.summary).toBeDefined();
      expect(mockPage.on).toHaveBeenCalledTimes(3);
      expect(mockPage.off).toHaveBeenCalledTimes(3);
    });

    test("should stop monitoring even if operation throws", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Operation failed"));

      await expect(monitorNetworkDuring(mockPage, operation)).rejects.toThrow("Operation failed");

      expect(mockPage.on).toHaveBeenCalledTimes(3);
      expect(mockPage.off).toHaveBeenCalledTimes(3);
    });

    test("should capture network activity during operation", async () => {
      const operation = vi.fn().mockImplementation(async () => {
        // Simulate network activity during operation
        await requestHandler(mockRequest);
        await responseHandler(mockResponse);
        return "done";
      });

      const { result, report } = await monitorNetworkDuring(mockPage, operation);

      expect(result).toBe("done");
      expect(report.summary.totalRequests).toBe(1);
      expect(report.summary.totalResponses).toBe(1);
    });
  });

  describe("Edge cases and error handling", () => {
    test("should handle request without postData", async () => {
      const monitor = createNetworkMonitor(mockPage, {
        captureRequestBodies: true,
      });

      const requestWithoutBody = {
        ...mockRequest,
        postData: vi.fn().mockReturnValue(null),
      };

      await monitor.start();
      await requestHandler(requestWithoutBody);

      const events = monitor.getEvents();
      expect(events[0].request?.postData).toBeUndefined();
    });

    test("should handle response body reading errors", async () => {
      const monitor = createNetworkMonitor(mockPage, {
        captureResponseBodies: true,
      });

      const responseWithError = {
        ...mockResponse,
        body: vi.fn().mockRejectedValue(new Error("Cannot read body")),
      };

      await monitor.start();
      await requestHandler(mockRequest);
      await responseHandler(responseWithError);

      const events = monitor.getEvents();
      const responseEvent = events.find((e) => e.type === "response");
      expect(responseEvent?.response?.body).toBeUndefined();
    });

    test("should handle header reading errors", async () => {
      const monitor = createNetworkMonitor(mockPage);

      const requestWithHeaderError = {
        ...mockRequest,
        allHeaders: vi.fn().mockRejectedValue(new Error("Cannot read headers")),
      };

      await monitor.start();

      // Should not throw, but handle gracefully
      await expect(requestHandler(requestWithHeaderError)).resolves.toBeUndefined();
    });

    test("should handle empty events for report generation", () => {
      const monitor = createNetworkMonitor(mockPage);

      const report = monitor.getReport();

      expect(report.summary.totalRequests).toBe(0);
      expect(report.summary.totalResponses).toBe(0);
      expect(report.summary.averageResponseTime).toBe(0);
      expect(report.slowRequests).toEqual([]);
      expect(report.failedRequests).toEqual([]);
    });

    test("should handle URL filtering with string patterns", async () => {
      const monitor = createNetworkMonitor(mockPage, {
        urlFilter: "api.example.com",
      });

      await monitor.start();

      await requestHandler(mockRequest);

      const events = monitor.getEvents();
      expect(events).toHaveLength(1);
    });

    test("should handle resource type filtering", async () => {
      const monitor = createNetworkMonitor(mockPage, {
        resourceTypeFilter: ["xhr"],
      });

      await monitor.start();

      // This should be captured (xhr)
      await requestHandler(mockRequest);

      // This should be filtered out
      const imageRequest = {
        ...mockRequest,
        resourceType: vi.fn().mockReturnValue("image"),
      };
      await requestHandler(imageRequest);

      const events = monitor.getEvents();
      expect(events).toHaveLength(1);
    });
  });
});
