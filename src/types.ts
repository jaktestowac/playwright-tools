import { Page, Locator, Request, Response } from "@playwright/test";

// Common option interfaces
export interface TimeoutOptions {
  timeout?: number;
}

export interface WaitOptions extends TimeoutOptions {
  state?: "visible" | "hidden" | "attached" | "detached";
}

// Element interaction options
export interface ElementInteractionOptions extends TimeoutOptions {
  force?: boolean;
  noWaitAfter?: boolean;
  trial?: boolean;
}

// Safe interaction options with error handling
export interface SafeInteractionOptions extends ElementInteractionOptions {
  catchErrors?: boolean;
  onError?: (error: Error, context: string) => void;
}

// Form data interface
export interface FormField {
  locator: Locator;
  value: string;
}

// Screenshot options
export interface ScreenshotOptions {
  path?: string;
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  omitBackground?: boolean;
  type?: "png" | "jpeg";
  quality?: number;
}

// Navigation options
export interface NavigationOptions extends TimeoutOptions {
  expectedUrlPattern?: RegExp | string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
}

// Retry options
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

// Network monitoring options
export interface NetworkMonitoringOptions {
  captureRequestBodies?: boolean;
  captureResponseBodies?: boolean;
  maxBodySize?: number;
  urlFilter?: RegExp | string;
  methodFilter?: string[];
  resourceTypeFilter?: string[];
  trackPerformance?: boolean;
  analyzeSlowRequests?: boolean;
  slowRequestThreshold?: number;
  maxEvents?: number;
  onError?: (error: Error, context: string) => void;
}

// Accessibility check options
export interface AccessibilityOptions {
  checkRole?: boolean;
  checkLabel?: boolean;
  checkDescription?: boolean;
  checkFocusable?: boolean;
  checkExpanded?: boolean;
  checkPressed?: boolean;
  checkChecked?: boolean;
  checkSelected?: boolean;
}

// Storage options
export interface StorageOptions {
  type?: "localStorage" | "sessionStorage";
}

// File upload options
export interface FileUploadOptions {
  waitForUpload?: boolean;
  validateFileTypes?: boolean;
  allowedTypes?: string[];
  maxFileSize?: number;
}

// Scroll options
export interface ScrollOptions {
  behavior?: "auto" | "smooth";
  block?: "start" | "center" | "end" | "nearest";
  inline?: "start" | "center" | "end" | "nearest";
  offset?: { x?: number; y?: number };
}

// Page idle options
export interface PageIdleOptions extends TimeoutOptions {
  networkIdle?: boolean;
  noAnimations?: boolean;
  noTimers?: boolean;
  noMutations?: boolean;
}

// Table extraction options
export interface TableExtractionOptions {
  includeHeaders?: boolean;
  includeRowNumbers?: boolean;
  filterEmptyRows?: boolean;
  customHeaders?: string[];
}

// Test data factory options
export interface TestDataOptions {
  unique?: boolean;
  length?: number;
  format?: string;
  locale?: string;
}

// Page object options
export interface PageObjectOptions {
  baseUrl?: string;
  defaultTimeout?: number;
  selectors?: Record<string, string>;
  enablePerformanceMonitoring?: boolean;
  enableAccessibilityChecks?: boolean;
}

// Assertion options
export interface AssertionOptions extends TimeoutOptions {
  message?: string;
  soft?: boolean;
}

// Dialog handling options
export interface DialogOptions {
  accept?: boolean;
  promptText?: string;
  expectedMessage?: string | RegExp;
}

// Keyboard combo options
export interface KeyboardComboOptions {
  element?: Locator;
  delay?: number;
}

// Drag and drop options
export interface DragDropOptions {
  steps?: number;
  delay?: number;
  sourcePosition?: { x: number; y: number };
  targetPosition?: { x: number; y: number };
}

// Network request options
export interface NetworkRequestOptions extends TimeoutOptions {
  method?: string;
  status?: number;
  urlPattern?: RegExp | string;
}

// Element data extraction options
export interface ElementDataOptions {
  attributes?: string[];
  includeText?: boolean;
  includeStyles?: string[];
  includeComputedStyles?: boolean;
}

// Utility function result types
export interface ElementData {
  text?: string;
  attributes?: Record<string, string>;
  styles?: Record<string, string>;
  computedStyles?: Record<string, string>;
}

export interface AccessibilityData {
  role?: string;
  label?: string;
  description?: string;
  focusable?: boolean;
  expanded?: boolean;
  pressed?: boolean;
  checked?: boolean;
  selected?: boolean;
}

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

// Test utility types
export interface TestConfig {
  skip?: boolean;
  runOnly?: boolean;
  [key: string]: any;
}

export interface TestDispatcherOptions<T = any> {
  shouldThrow?: boolean;
  customFilter?: (test: T) => boolean;
}

// Performance measurement types
export interface PerformanceMetrics {
  duration: number;
  startTime: number;
  endTime: number;
  memoryUsage?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  context?: Record<string, any>;
}

// Generic result types
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: Error;
  duration?: number;
}

export interface BulkResult<T> {
  results: Array<Result<T>>;
  successful: number;
  failed: number;
  total: number;
} 