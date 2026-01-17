import type { Page, Locator, Request, Response } from "@playwright/test";

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

/**
 * Options for assertion functions
 */
export interface AssertionOptions extends TimeoutOptions {
  message?: string;
  /** Whether to use soft assertions (continue on failure) */
  soft?: boolean;
  timeout?: number;
  /** Whether to run assertions concurrently for better performance */
  concurrent?: boolean;
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

// Component abstractions
export interface ComponentOptions extends TimeoutOptions {
  selector?: string;
  defaultTimeout?: number;
  /** Whether component exposes accessibility checks by default */
  enableAccessibilityChecks?: boolean;
}

export interface ComponentBase {
  page: Page;
  root: Locator;
  options?: ComponentOptions;
  locator(selector: string): Locator;
  waitForReady(timeout?: number): Promise<void>;
  isVisible(timeout?: number): Promise<boolean>;
  extend<T>(extensions: T): this & T;
}

// Combobox whose dropdown items are a grid
export interface ComboboxWithGridOptions extends ComponentOptions {
  openOnFocus?: boolean;
  /** Selector for click/focus target to open the combobox */
  triggerSelector?: string;
  dropdownSelector?: string; // selector for dropdown panel
  gridSelector?: string; // selector for grid inside dropdown
  rowSelector?: string; // selector for each row inside grid
  cellSelector?: string; // default cell selector within a row
  searchable?: boolean;
  /** Selector for search input within the combobox root */
  searchInputSelector?: string;
}

export interface ComboboxWithGrid extends ComponentBase {
  open(): Promise<void>;
  close(): Promise<void>;
  isOpen(): Promise<boolean>;
  toggle(): Promise<void>;
  search?(query: string): Promise<void>;
  getRows(): Locator;
  getRow(index: number): Locator;
  getCell(rowIndex: number, cellSelector?: string): Locator;
  selectRow(index: number): Promise<void>;
  selectRowByCellText(cellSelector: string, text: string): Promise<void>;
}

// Modal / Dialog
export interface ModalOptions extends ComponentOptions {
  titleSelector?: string;
  contentSelector?: string;
  confirmSelector?: string;
  cancelSelector?: string;
  closeSelector?: string;
}

export interface Modal extends ComponentBase {
  open(): Promise<void>;
  close(): Promise<void>;
  isOpen(): Promise<boolean>;
  getTitle(): Promise<string>;
  getContent(): Promise<string>;
  confirm(): Promise<void>;
  cancel(): Promise<void>;
}

// Dropdown (simple)
export interface DropdownOptions extends ComponentOptions {
  triggerSelector?: string;
  panelSelector?: string;
  optionSelector?: string;
  searchable?: boolean;
}

export interface Dropdown extends ComponentBase {
  open(): Promise<void>;
  close(): Promise<void>;
  isOpen(): Promise<boolean>;
  getOptions(): Locator;
  selectByText(text: string): Promise<void>;
  selectByIndex(index: number): Promise<void>;
  search?(query: string): Promise<void>;
}

// Table component helpers
export interface TableComponentOptions extends ComponentOptions {
  headerSelector?: string;
  rowSelector?: string;
  cellSelector?: string;
  includeHeaders?: boolean;
}

export interface TableComponent extends ComponentBase {
  getHeaders(): Promise<string[]>;
  getRows(): Locator;
  getRow(index: number): Locator;
  getCell(rowIndex: number, colIndex: number): Locator;
  extractRowData(index: number): Promise<string[]>;
  findRowByCellText(text: string): Locator;
  selectRow(index: number): Promise<void>;
}

// DatePicker
export interface DatePickerOptions extends ComponentOptions {
  inputSelector?: string;
  calendarButtonSelector?: string;
  dayCellSelector?: string;
}

export interface DatePicker extends ComponentBase {
  openCalendar(): Promise<void>;
  selectDate(date: string | Date): Promise<void>;
  setDate(value: string): Promise<void>;
  getValue(): Promise<string>;
  clear(): Promise<void>;
}

// Tabs
export interface TabsOptions extends ComponentOptions {
  tabSelector?: string;
  panelSelector?: string;
}

export interface Tabs extends ComponentBase {
  selectTab(index: number): Promise<void>;
  selectTabByText(text: string): Promise<void>;
  getActiveTab(): Locator;
  getTabs(): Locator;
}

// Pagination
export interface PaginationOptions extends ComponentOptions {
  nextSelector?: string;
  prevSelector?: string;
  pageSelector?: string;
  currentSelector?: string;
}

export interface Pagination extends ComponentBase {
  next(): Promise<void>;
  prev(): Promise<void>;
  goTo(pageNumber: number): Promise<void>;
  getCurrentPage(): Promise<number | null>;
  totalPages(): Promise<number | null>;
}

// Text input
export interface TextInputOptions extends ComponentOptions {
  inputSelector?: string;
}

export interface TextInput extends ComponentBase {
  getInput(): Locator;
  fill(value: string): Promise<void>;
  clear(): Promise<void>;
  getValue(): Promise<string>;
  focus(): Promise<void>;
  press(key: string): Promise<void>;
}

// Checkbox
export interface CheckboxOptions extends ComponentOptions {
  checkboxSelector?: string;
}

export interface Checkbox extends ComponentBase {
  getCheckbox(): Locator;
  check(): Promise<void>;
  uncheck(): Promise<void>;
  toggle(): Promise<void>;
  isChecked(): Promise<boolean>;
}

// Radio group
export interface RadioGroupOptions extends ComponentOptions {
  radioSelector?: string;
}

export interface RadioGroup extends ComponentBase {
  getRadios(): Locator;
  selectByValue(value: string): Promise<void>;
  selectByLabelText(text: string): Promise<void>;
}

// Alert / Toast
export interface AlertOptions extends ComponentOptions {
  messageSelector?: string;
  closeSelector?: string;
}

export interface Alert extends ComponentBase {
  getText(): Promise<string>;
  close(): Promise<void>;
}

// Accordion
export interface AccordionOptions extends ComponentOptions {
  headerSelector?: string;
  panelSelector?: string;
}

export interface Accordion extends ComponentBase {
  getHeader(): Locator;
  getPanel(): Locator;
  isExpanded(): Promise<boolean>;
  expand(): Promise<void>;
  collapse(): Promise<void>;
  toggle(): Promise<void>;
}
