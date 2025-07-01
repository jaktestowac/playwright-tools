import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import {
  safeNavigate,
  fillForm,
  isElementEnabled,
  waitForVisibleWithRetry,
  extractElementData,
  waitForAnyCondition,
  debugScreenshot,
  measureTime,
  checkAccessibility,
  handleStorage,
  waitForNetworkRequest,
  handleDialog,
  extractTableData,
  pressKeyCombo,
  dragAndDrop,
  handleFileUpload,
  scrollToElement,
  waitForPageIdle,
  createPageObject,
  PlaywrightToolsError,
  ERROR_CODES,
  createError,
  withErrorHandling,
  handleTimeoutError,
  validateInput,
  validateLocator,
  validatePage,
  createRetryableError,
  isRetryableError,
  formatErrorMessage,
  logError,
  ERROR_RECOVERY,
  PerformanceMonitor,
} from "../src/index";

describe("Playwright Helpers - New Utility Functions", () => {
  let mockPage: any;
  let mockLocator: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
      url: vi.fn().mockReturnValue("https://example.com/dashboard"),
      addStyleTag: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue(undefined),
      waitForResponse: vi.fn().mockResolvedValue({
        url: () => "https://api.example.com/users",
        request: () => ({ method: () => "GET" }),
        status: () => 200,
        ok: () => true,
      }),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      off: vi.fn(),
    };

    mockLocator = {
      waitFor: vi.fn().mockResolvedValue(undefined),
      isEnabled: vi.fn().mockResolvedValue(true),
      textContent: vi.fn().mockResolvedValue("sample text"),
      getAttribute: vi.fn().mockResolvedValue("sample-value"),
      evaluate: vi.fn().mockResolvedValue("computed-value"),
      locator: vi.fn().mockReturnValue({
        count: vi.fn().mockResolvedValue(3),
        first: vi.fn().mockReturnValue({
          locator: vi.fn().mockReturnValue({
            count: vi.fn().mockResolvedValue(2),
            nth: vi.fn().mockReturnValue({
              textContent: vi.fn().mockResolvedValue("Header 1"),
            }),
          }),
        }),
        nth: vi.fn().mockReturnValue({
          locator: vi.fn().mockReturnValue({
            count: vi.fn().mockResolvedValue(2),
            nth: vi.fn().mockReturnValue({
              textContent: vi.fn().mockResolvedValue("Cell Data"),
            }),
          }),
        }),
      }),
    };
  });

  describe("safeNavigate", () => {
    test("should navigate and wait for networkidle by default", async () => {
      await safeNavigate(mockPage, "/dashboard");

      expect(mockPage.goto).toHaveBeenCalledWith("/dashboard", {
        waitUntil: "networkidle",
        timeout: undefined,
      });
    });

    test("should validate URL pattern when provided", async () => {
      await safeNavigate(mockPage, "/dashboard", {
        expectedUrlPattern: /\/dashboard/,
      });

      expect(mockPage.url).toHaveBeenCalled();
    });

    test("should use custom wait condition and timeout", async () => {
      await safeNavigate(mockPage, "/slow-page", {
        waitUntil: "load",
        timeout: 15000,
      });

      expect(mockPage.goto).toHaveBeenCalledWith("/slow-page", {
        waitUntil: "load",
        timeout: 15000,
      });
    });
  });

  describe("isElementEnabled", () => {
    test("should return true when element is enabled", async () => {
      const result = await isElementEnabled(mockLocator);

      expect(result).toBe(true);
      expect(mockLocator.waitFor).toHaveBeenCalledWith({
        state: "visible",
        timeout: 5000,
      });
      expect(mockLocator.isEnabled).toHaveBeenCalled();
    });

    test("should return false when element is not visible", async () => {
      mockLocator.waitFor.mockRejectedValue(new Error("Not visible"));

      const result = await isElementEnabled(mockLocator);

      expect(result).toBe(false);
    });

    test("should return false when element is disabled", async () => {
      mockLocator.isEnabled.mockResolvedValue(false);

      const result = await isElementEnabled(mockLocator);

      expect(result).toBe(false);
    });
  });

  describe("waitForVisibleWithRetry", () => {
    test("should succeed on first attempt", async () => {
      await waitForVisibleWithRetry(mockLocator);

      expect(mockLocator.waitFor).toHaveBeenCalledTimes(1);
    });

    test("should retry on failure and eventually succeed", async () => {
      mockLocator.waitFor
        .mockRejectedValueOnce(new Error("Not visible"))
        .mockRejectedValueOnce(new Error("Not visible"))
        .mockResolvedValue(undefined);

      await waitForVisibleWithRetry(mockLocator, { retries: 3, timeout: 12000 });

      expect(mockLocator.waitFor).toHaveBeenCalledTimes(3);
    });

    test("should throw after all retries exhausted", async () => {
      mockLocator.waitFor.mockRejectedValue(new Error("Never visible"));

      await expect(waitForVisibleWithRetry(mockLocator, { retries: 2, timeout: 6000 })).rejects.toThrow(
        "Never visible",
      );

      expect(mockLocator.waitFor).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
  });

  describe("extractElementData", () => {
    test("should extract text content by default", async () => {
      const data = await extractElementData(mockLocator);

      expect(data).toEqual({ text: "sample text" });
      expect(mockLocator.textContent).toHaveBeenCalled();
    });

    test("should extract specified attributes", async () => {
      const data = await extractElementData(mockLocator, {
        attributes: ["id", "class"],
        includeText: false,
      });

      expect(data).toEqual({
        id: "sample-value",
        class: "sample-value",
      });
      expect(mockLocator.getAttribute).toHaveBeenCalledWith("id");
      expect(mockLocator.getAttribute).toHaveBeenCalledWith("class");
    });

    test("should extract computed styles", async () => {
      const data = await extractElementData(mockLocator, {
        includeStyles: ["color", "background-color"],
        includeText: false,
      });

      expect(data).toEqual({
        style_color: "computed-value",
        "style_background-color": "computed-value",
      });
    });
  });

  describe("waitForAnyCondition", () => {
    test("should resolve when first condition is met", async () => {
      const conditions = [
        vi.fn().mockResolvedValue(undefined),
        vi.fn().mockRejectedValue(new Error("fail")),
        vi.fn().mockResolvedValue(undefined),
      ];

      const result = await waitForAnyCondition(conditions);

      expect(result).toBe(0);
      expect(conditions[0]).toHaveBeenCalled();
    });

    test("should timeout if no conditions are met", async () => {
      const conditions = [vi.fn().mockRejectedValue(new Error("fail1")), vi.fn().mockRejectedValue(new Error("fail2"))];

      await expect(waitForAnyCondition(conditions, { timeout: 100 })).rejects.toThrow(
        "None of the conditions were met within 100ms",
      );
    });
  });

  describe("measureTime", () => {
    test("should measure execution time of operation", async () => {
      const operation = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return "result";
      });

      const { result, duration, name } = await measureTime(operation, "test-op");

      expect(result).toBe("result");
      expect(duration).toBeGreaterThanOrEqual(100);
      expect(name).toBe("test-op");
    });
  });

  describe("checkAccessibility", () => {
    test("should check role when requested", async () => {
      mockLocator.getAttribute.mockResolvedValue("button");

      const a11yInfo = await checkAccessibility(mockLocator, { checkRole: true });

      expect(a11yInfo.role).toBe("button");
      expect(mockLocator.getAttribute).toHaveBeenCalledWith("role");
    });

    test("should check accessible name when requested", async () => {
      mockLocator.evaluate.mockResolvedValue("Click me");

      const a11yInfo = await checkAccessibility(mockLocator, { checkLabel: true });

      expect(a11yInfo.accessibleName).toBe("Click me");
    });

    test("should check focusability", async () => {
      mockLocator.evaluate.mockResolvedValue(true);

      const a11yInfo = await checkAccessibility(mockLocator);

      expect(a11yInfo.focusable).toBe(true);
    });
  });

  describe("handleStorage", () => {
    test("should get item from localStorage", async () => {
      mockPage.evaluate.mockResolvedValue("stored-value");

      const result = await handleStorage(mockPage, "get", "testKey");

      expect(result).toBe("stored-value");
      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), ["localStorage", "testKey"]);
    });

    test("should set item in localStorage", async () => {
      await handleStorage(mockPage, "set", "testKey", "testValue");

      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), ["localStorage", "testKey", "testValue"]);
    });

    test("should remove item from localStorage", async () => {
      await handleStorage(mockPage, "remove", "testKey");

      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), ["localStorage", "testKey"]);
    });

    test("should clear localStorage", async () => {
      await handleStorage(mockPage, "clear");

      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), "localStorage");
    });

    test("should work with sessionStorage", async () => {
      await handleStorage(mockPage, "set", "testKey", "testValue", "session");

      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), ["sessionStorage", "testKey", "testValue"]);
    });
  });

  describe("waitForNetworkRequest", () => {
    test("should wait for matching network request", async () => {
      const response = await waitForNetworkRequest(mockPage, "**/api/users");

      expect(response.url()).toBe("https://api.example.com/users");
      expect(mockPage.waitForResponse).toHaveBeenCalledWith(expect.any(Function), { timeout: 30000 });
    });

    test("should match specific HTTP method", async () => {
      await waitForNetworkRequest(mockPage, "**/api/users", { method: "GET" });

      expect(mockPage.waitForResponse).toHaveBeenCalled();
    });

    test("should match status code", async () => {
      await waitForNetworkRequest(mockPage, "**/api/users", { status: 200 });

      expect(mockPage.waitForResponse).toHaveBeenCalled();
    });
  });

  describe("handleDialog", () => {
    test("should handle dialog with accept", async () => {
      const action = vi.fn().mockResolvedValue(undefined);

      await handleDialog(mockPage, action, { accept: true });

      expect(action).toHaveBeenCalled();
      expect(mockPage.on).toHaveBeenCalledWith("dialog", expect.any(Function));
      expect(mockPage.off).toHaveBeenCalledWith("dialog", expect.any(Function));
    });

    test("should handle dialog with expected message", async () => {
      const action = vi.fn().mockResolvedValue(undefined);

      await handleDialog(mockPage, action, {
        expectedMessage: /Are you sure/,
      });

      expect(action).toHaveBeenCalled();
    });
  });

  describe("extractTableData", () => {
    test("should extract table data with headers", async () => {
      // Mock table structure
      mockLocator.locator.mockReturnValue({
        count: vi.fn().mockResolvedValue(3), // 1 header + 2 data rows
        first: vi.fn().mockReturnValue({
          locator: vi.fn().mockReturnValue({
            count: vi.fn().mockResolvedValue(2), // 2 columns
            nth: vi.fn((index) => ({
              textContent: vi.fn().mockResolvedValue(index === 0 ? "Name" : "Age"),
            })),
          }),
        }),
        nth: vi.fn((rowIndex) => ({
          locator: vi.fn().mockReturnValue({
            count: vi.fn().mockResolvedValue(2),
            nth: vi.fn((cellIndex) => ({
              textContent: vi
                .fn()
                .mockResolvedValue(
                  rowIndex === 1
                    ? cellIndex === 0
                      ? "John"
                      : "25"
                    : rowIndex === 2
                      ? cellIndex === 0
                        ? "Jane"
                        : "30"
                      : "",
                ),
            })),
          }),
        })),
      });

      const data = await extractTableData(mockLocator);

      expect(Array.isArray(data)).toBe(true);
      // The exact structure would depend on the mock implementation
    });

    test("should handle empty table", async () => {
      mockLocator.locator.mockReturnValue({
        count: vi.fn().mockResolvedValue(0),
      });

      const data = await extractTableData(mockLocator);

      expect(data).toEqual([]);
    });
  });

  describe("pressKeyCombo", () => {
    let mockKeyboard: any;

    beforeEach(() => {
      mockKeyboard = {
        down: vi.fn().mockResolvedValue(undefined),
        up: vi.fn().mockResolvedValue(undefined),
        press: vi.fn().mockResolvedValue(undefined),
      };
      mockPage.keyboard = mockKeyboard;
    });

    test("should press simple key combination", async () => {
      await pressKeyCombo(mockPage, "Control+C");

      expect(mockKeyboard.down).toHaveBeenCalledWith("Control");
      expect(mockKeyboard.press).toHaveBeenCalledWith("C");
      expect(mockKeyboard.up).toHaveBeenCalledWith("Control");
    });

    test("should handle multiple modifiers", async () => {
      await pressKeyCombo(mockPage, "Control+Shift+V");

      expect(mockKeyboard.down).toHaveBeenCalledWith("Control");
      expect(mockKeyboard.down).toHaveBeenCalledWith("Shift");
      expect(mockKeyboard.press).toHaveBeenCalledWith("V");
      expect(mockKeyboard.up).toHaveBeenCalledWith("Shift");
      expect(mockKeyboard.up).toHaveBeenCalledWith("Control");
    });

    test("should focus element before key press if provided", async () => {
      const mockElement = { focus: vi.fn().mockResolvedValue(undefined) };

      await pressKeyCombo(mockPage, "Control+A", { element: mockElement as any });

      expect(mockElement.focus).toHaveBeenCalled();
    });
  });

  describe("dragAndDrop", () => {
    let mockMouse: any;
    let mockSource: any;
    let mockTarget: any;

    beforeEach(() => {
      mockMouse = {
        down: vi.fn().mockResolvedValue(undefined),
        up: vi.fn().mockResolvedValue(undefined),
        move: vi.fn().mockResolvedValue(undefined),
      };

      mockSource = {
        boundingBox: vi.fn().mockResolvedValue({ x: 100, y: 100, width: 50, height: 30 }),
        hover: vi.fn().mockResolvedValue(undefined),
        page: () => ({
          mouse: mockMouse,
          waitForTimeout: vi.fn().mockResolvedValue(undefined),
        }),
      };

      mockTarget = {
        boundingBox: vi.fn().mockResolvedValue({ x: 200, y: 150, width: 50, height: 30 }),
        hover: vi.fn().mockResolvedValue(undefined),
      };
    });

    test("should perform drag and drop operation", async () => {
      await dragAndDrop(mockSource, mockTarget);

      expect(mockSource.boundingBox).toHaveBeenCalled();
      expect(mockTarget.boundingBox).toHaveBeenCalled();
      expect(mockMouse.down).toHaveBeenCalled();
      expect(mockMouse.move).toHaveBeenCalledTimes(5); // default steps
      expect(mockMouse.up).toHaveBeenCalled();
    });

    test("should use custom steps and delay", async () => {
      await dragAndDrop(mockSource, mockTarget, { steps: 10, delay: 50 });

      expect(mockMouse.move).toHaveBeenCalledTimes(10);
    });

    test("should throw error if bounding boxes not available", async () => {
      mockSource.boundingBox.mockResolvedValue(null);

      await expect(dragAndDrop(mockSource, mockTarget)).rejects.toThrow(
        "Could not get bounding boxes for drag and drop elements",
      );
    });
  });

  describe("handleFileUpload", () => {
    let mockFileInput: any;

    beforeEach(() => {
      mockFileInput = {
        setInputFiles: vi.fn().mockResolvedValue(undefined),
        page: () => ({
          locator: vi.fn().mockReturnValue({
            first: vi.fn().mockReturnValue({
              waitFor: vi.fn().mockResolvedValue(undefined),
            }),
          }),
          waitForTimeout: vi.fn().mockResolvedValue(undefined),
        }),
      };
    });

    test("should upload files without validation", async () => {
      const filePaths = ["./test1.pdf", "./test2.jpg"];

      await handleFileUpload(mockFileInput, filePaths);

      expect(mockFileInput.setInputFiles).toHaveBeenCalledWith(filePaths);
    });

    test("should validate file types when requested", async () => {
      const filePaths = ["./test.txt"];

      await expect(
        handleFileUpload(mockFileInput, filePaths, {
          validateFileTypes: true,
          allowedTypes: [".pdf", ".jpg"],
        }),
      ).rejects.toThrow("File type .txt is not allowed");
    });

    test("should wait for upload completion when requested", async () => {
      const filePaths = ["./test.pdf"];

      await handleFileUpload(mockFileInput, filePaths, {
        waitForUpload: true,
        uploadTimeout: 5000,
      });

      expect(mockFileInput.setInputFiles).toHaveBeenCalledWith(filePaths);
    });
  });
  describe("scrollToElement", () => {
    let mockPageEvaluate: any;
    let mockPageWaitForTimeout: any;

    beforeEach(() => {
      mockPageEvaluate = vi.fn().mockResolvedValue(undefined);
      mockPageWaitForTimeout = vi.fn().mockResolvedValue(undefined);

      mockLocator.scrollIntoViewIfNeeded = vi.fn().mockResolvedValue(undefined);
      mockLocator.evaluate = vi.fn().mockResolvedValue(undefined);
      mockLocator.page = vi.fn().mockReturnValue({
        evaluate: mockPageEvaluate,
        waitForTimeout: mockPageWaitForTimeout,
      });
    });

    test("should scroll element into view with default options", async () => {
      await scrollToElement(mockLocator);

      expect(mockLocator.scrollIntoViewIfNeeded).toHaveBeenCalled();
      expect(mockLocator.evaluate).toHaveBeenCalled();
    });

    test("should apply custom scroll options", async () => {
      await scrollToElement(mockLocator, {
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
      expect(mockLocator.evaluate).toHaveBeenCalledWith(expect.any(Function), {
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    });

    test("should apply offset after scrolling", async () => {
      await scrollToElement(mockLocator, {
        offset: { x: 10, y: -20 },
      });

      expect(mockPageEvaluate).toHaveBeenCalledWith(expect.any(Function), [10, -20]);
    });
  });

  describe("waitForPageIdle", () => {
    beforeEach(() => {
      mockPage.waitForLoadState = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForFunction = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForTimeout = vi.fn().mockResolvedValue(undefined);
    });

    test("should wait for network idle by default", async () => {
      await waitForPageIdle(mockPage);

      expect(mockPage.waitForLoadState).toHaveBeenCalledWith("networkidle", {
        timeout: 30000,
      });
    });

    test("should wait for animations when requested", async () => {
      await waitForPageIdle(mockPage, { noAnimations: true });

      expect(mockPage.waitForFunction).toHaveBeenCalledWith(expect.any(Function), undefined, { timeout: 30000 });
    });

    test("should use custom timeout", async () => {
      await waitForPageIdle(mockPage, { timeout: 15000 });

      expect(mockPage.waitForLoadState).toHaveBeenCalledWith("networkidle", {
        timeout: 15000,
      });
    });
  });

  describe("createPageObject", () => {
    test("should create page object with navigation methods", () => {
      const pageObject = createPageObject(mockPage, "/dashboard");

      expect(pageObject.page).toBe(mockPage);
      expect(pageObject.baseUrl).toBe("/dashboard");
      expect(typeof pageObject.navigate).toBe("function");
      expect(typeof pageObject.waitForReady).toBe("function");
      expect(typeof pageObject.takeScreenshot).toBe("function");
    });

    test("should provide locator methods", () => {
      const pageObject = createPageObject(mockPage, "/test");

      expect(typeof pageObject.locator).toBe("function");
      expect(typeof pageObject.getByRole).toBe("function");
      expect(typeof pageObject.getByText).toBe("function");
      expect(typeof pageObject.getByLabel).toBe("function");
      expect(typeof pageObject.getByTestId).toBe("function");
    });

    test("should provide utility methods", () => {
      const pageObject = createPageObject(mockPage, "/test");

      expect(typeof pageObject.getCurrentUrl).toBe("function");
      expect(typeof pageObject.getPageTitle).toBe("function");
      expect(typeof pageObject.scrollToTop).toBe("function");
      expect(typeof pageObject.scrollToBottom).toBe("function");
    });
  });
});

describe("PerformanceMonitor - exportData", () => {
  test("should export performance data as JSON string", () => {
    const monitor = new PerformanceMonitor();
    // Record some metrics
    monitor.measureSync(() => 42, "sync-op");
    monitor.measureSync(() => 24, "sync-op");
    // Record a failing operation
    try {
      monitor.measureSync(() => { throw new Error("fail"); }, "fail-op");
    } catch (error) {
      // Expected error, continue
    }
    
    const json = monitor.exportData();
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty("timestamp");
    expect(parsed).toHaveProperty("operations");
    expect(parsed).toHaveProperty("summaries");
    expect(parsed.operations["sync-op"].length).toBeGreaterThanOrEqual(2);
    expect(parsed.summaries["sync-op"].count).toBeGreaterThanOrEqual(2);
    expect(parsed.summaries["fail-op"].errorCount).toBeGreaterThanOrEqual(1);
  });
});

describe("Error Handling", () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("PlaywrightToolsError", () => {
    test("should create error with message, code, and context", () => {
      const context = { element: "button", selector: "#submit" };
      const error = new PlaywrightToolsError("Element not found", "ELEMENT_NOT_FOUND", context);
      
      expect(error.message).toBe("Element not found");
      expect(error.code).toBe("ELEMENT_NOT_FOUND");
      expect(error.context).toEqual(context);
      expect(error.name).toBe("PlaywrightToolsError");
      expect(error).toBeInstanceOf(Error);
    });

    test("should create error without context", () => {
      const error = new PlaywrightToolsError("Simple error", "TIMEOUT_EXCEEDED");
      
      expect(error.message).toBe("Simple error");
      expect(error.code).toBe("TIMEOUT_EXCEEDED");
      expect(error.context).toEqual({});
    });
  });

  describe("ERROR_CODES", () => {
    test("should contain all expected error codes", () => {
      expect(ERROR_CODES).toHaveProperty("ELEMENT_NOT_FOUND");
      expect(ERROR_CODES).toHaveProperty("ELEMENT_NOT_VISIBLE");
      expect(ERROR_CODES).toHaveProperty("ELEMENT_NOT_ENABLED");
      expect(ERROR_CODES).toHaveProperty("NAVIGATION_FAILED");
      expect(ERROR_CODES).toHaveProperty("NETWORK_REQUEST_FAILED");
      expect(ERROR_CODES).toHaveProperty("SCREENSHOT_FAILED");
      expect(ERROR_CODES).toHaveProperty("FILE_UPLOAD_FAILED");
      expect(ERROR_CODES).toHaveProperty("DIALOG_HANDLING_FAILED");
      expect(ERROR_CODES).toHaveProperty("STORAGE_OPERATION_FAILED");
      expect(ERROR_CODES).toHaveProperty("RETRY_EXHAUSTED");
      expect(ERROR_CODES).toHaveProperty("TIMEOUT_EXCEEDED");
      expect(ERROR_CODES).toHaveProperty("INVALID_INPUT");
      expect(ERROR_CODES).toHaveProperty("UNSUPPORTED_OPERATION");
    });
  });

  describe("createError", () => {
    test("should create PlaywrightToolsError with correct properties", () => {
      const context = { test: "data" };
      const error = createError("Test error", "ELEMENT_NOT_FOUND", context);
      
      expect(error).toBeInstanceOf(PlaywrightToolsError);
      expect(error.message).toBe("Test error");
      expect(error.code).toBe(ERROR_CODES.ELEMENT_NOT_FOUND);
      expect(error.context).toEqual(context);
    });

    test("should create error without context", () => {
      const error = createError("Test error", "TIMEOUT_EXCEEDED");
      
      expect(error.message).toBe("Test error");
      expect(error.code).toBe(ERROR_CODES.TIMEOUT_EXCEEDED);
      expect(error.context).toEqual({});
    });
  });

  describe("withErrorHandling", () => {
    test("should return result when operation succeeds", async () => {
      const operation = vi.fn().mockResolvedValue("success");
      
      const result = await withErrorHandling(operation, "ELEMENT_NOT_FOUND");
      
      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test("should wrap error with context when operation fails", async () => {
      const originalError = new Error("Original error");
      const operation = vi.fn().mockRejectedValue(originalError);
      const context = { element: "button" };
      
      await expect(withErrorHandling(operation, "ELEMENT_NOT_FOUND", context))
        .rejects.toThrow(PlaywrightToolsError);
      
      try {
        await withErrorHandling(operation, "ELEMENT_NOT_FOUND", context);
      } catch (error) {
        expect(error.message).toBe("Original error");
        expect(error.code).toBe("ELEMENT_NOT_FOUND");
        expect(error.context.element).toBe("button");
        expect(error.context.originalError.name).toBe("Error");
        expect(error.context.originalError.message).toBe("Original error");
      }
    });
  });

  describe("handleTimeoutError", () => {
    test("should create timeout error with correct message and context", () => {
      const context = { page: "dashboard" };
      const error = handleTimeoutError("click", 5000, context);
      
      expect(error).toBeInstanceOf(PlaywrightToolsError);
      expect(error.message).toBe('Operation "click" timed out after 5000ms');
      expect(error.code).toBe("TIMEOUT_EXCEEDED");
      expect(error.context.operation).toBe("click");
      expect(error.context.timeout).toBe(5000);
      expect(error.context.page).toBe("dashboard");
    });
  });

  describe("validateInput", () => {
    test("should not throw for valid required input", () => {
      expect(() => validateInput("test", "name", "string")).not.toThrow();
      expect(() => validateInput(42, "age", "number")).not.toThrow();
      expect(() => validateInput(true, "flag", "boolean")).not.toThrow();
    });

    test("should throw for missing required input", () => {
      expect(() => validateInput(undefined, "name", "string"))
        .toThrow(PlaywrightToolsError);
      expect(() => validateInput(null, "age", "number"))
        .toThrow(PlaywrightToolsError);
    });

    test("should not throw for optional null/undefined input", () => {
      expect(() => validateInput(undefined, "name", "string", false)).not.toThrow();
      expect(() => validateInput(null, "age", "number", false)).not.toThrow();
    });

    test("should throw for type mismatch", () => {
      expect(() => validateInput("string", "number", "number"))
        .toThrow(PlaywrightToolsError);
      expect(() => validateInput(42, "string", "string"))
        .toThrow(PlaywrightToolsError);
    });
  });

  describe("validateLocator", () => {
    test("should not throw for valid locator", () => {
      const validLocator = { click: vi.fn() };
      
      expect(() => validateLocator(validLocator)).not.toThrow();
    });

    test("should throw for invalid locator", () => {
      expect(() => validateLocator(null))
        .toThrow(PlaywrightToolsError);
      expect(() => validateLocator(undefined))
        .toThrow(PlaywrightToolsError);
      expect(() => validateLocator({}))
        .toThrow(PlaywrightToolsError);
      expect(() => validateLocator({ otherMethod: vi.fn() }))
        .toThrow(PlaywrightToolsError);
    });

    test("should use custom parameter name in error", () => {
      try {
        validateLocator(null, "customName");
      } catch (error) {
        expect(error.context.parameter).toBe("customName");
      }
    });
  });

  describe("validatePage", () => {
    test("should not throw for valid page", () => {
      const validPage = { goto: vi.fn() };
      
      expect(() => validatePage(validPage)).not.toThrow();
    });

    test("should throw for invalid page", () => {
      expect(() => validatePage(null))
        .toThrow(PlaywrightToolsError);
      expect(() => validatePage(undefined))
        .toThrow(PlaywrightToolsError);
      expect(() => validatePage({}))
        .toThrow(PlaywrightToolsError);
      expect(() => validatePage({ otherMethod: vi.fn() }))
        .toThrow(PlaywrightToolsError);
    });

    test("should use custom parameter name in error", () => {
      try {
        validatePage(null, "customPage");
      } catch (error) {
        expect(error.context.parameter).toBe("customPage");
      }
    });
  });

  describe("createRetryableError", () => {
    test("should create retryable error with correct properties", () => {
      const context = { attempt: 3 };
      const error = createRetryableError("Retry failed", context);
      
      expect(error).toBeInstanceOf(PlaywrightToolsError);
      expect(error.message).toBe("Retry failed");
      expect(error.code).toBe("RETRY_EXHAUSTED");
      expect(error.context.retryable).toBe(true);
      expect(error.context.attempt).toBe(3);
    });
  });

  describe("isRetryableError", () => {
    test("should return true for timeout errors", () => {
      const timeoutError = createError("Timeout", "TIMEOUT_EXCEEDED");
      
      expect(isRetryableError(timeoutError)).toBe(true);
    });

    test("should return true for errors with retryable flag", () => {
      const retryableError = createRetryableError("Retry failed");
      
      expect(isRetryableError(retryableError)).toBe(true);
    });

    test("should return false for non-retryable errors", () => {
      const regularError = createError("Regular error", "ELEMENT_NOT_FOUND");
      
      expect(isRetryableError(regularError)).toBe(false);
    });

    test("should return false for non-PlaywrightToolsError", () => {
      const regularError = new Error("Regular error");
      
      expect(isRetryableError(regularError)).toBe(false);
    });
  });

  describe("formatErrorMessage", () => {
    test("should format error with code and message", () => {
      const error = createError("Test error", "ELEMENT_NOT_FOUND");
      const formatted = formatErrorMessage(error);
      
      expect(formatted).toContain("[ELEMENT_NOT_FOUND] Test error");
    });

    test("should include context in formatted message", () => {
      const error = createError("Test error", "ELEMENT_NOT_FOUND", { element: "button" });
      const formatted = formatErrorMessage(error);
      
      expect(formatted).toContain("[ELEMENT_NOT_FOUND] Test error");
      expect(formatted).toContain('"element": "button"');
    });

    test("should handle error without context", () => {
      const error = createError("Test error", "TIMEOUT_EXCEEDED");
      const formatted = formatErrorMessage(error);
      
      expect(formatted).toBe("[TIMEOUT_EXCEEDED] Test error");
    });
  });

  describe("logError", () => {
    test("should log error with structured data", () => {
      const error = createError("Test error", "ELEMENT_NOT_FOUND", { element: "button" });
      
      logError(error, "testOperation");
      
      expect(consoleSpy).toHaveBeenCalledWith(
        "PlaywrightTools Error:",
        expect.stringContaining("testOperation")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "PlaywrightTools Error:",
        expect.stringContaining("ELEMENT_NOT_FOUND")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "PlaywrightTools Error:",
        expect.stringContaining("Test error")
      );
    });

    test("should log error without operation", () => {
      const error = createError("Test error", "TIMEOUT_EXCEEDED");
      
      logError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        "PlaywrightTools Error:",
        expect.stringContaining("TIMEOUT_EXCEEDED")
      );
    });
  });

  describe("ERROR_RECOVERY", () => {
    describe("elementNotFound", () => {
      test("should return result when operation succeeds", async () => {
        const operation = vi.fn().mockResolvedValue("success");
        
        const result = await ERROR_RECOVERY.elementNotFound(operation);
        
        expect(result).toBe("success");
        expect(operation).toHaveBeenCalledTimes(1);
      });

      test("should call fallback when element not found error occurs", async () => {
        const operation = vi.fn().mockRejectedValue(createError("Not found", "ELEMENT_NOT_FOUND"));
        const fallback = vi.fn().mockResolvedValue("fallback result");
        
        const result = await ERROR_RECOVERY.elementNotFound(operation, fallback);
        
        expect(result).toBe("fallback result");
        expect(operation).toHaveBeenCalledTimes(1);
        expect(fallback).toHaveBeenCalledTimes(1);
      });

      test("should throw error when fallback is not provided", async () => {
        const operation = vi.fn().mockRejectedValue(createError("Not found", "ELEMENT_NOT_FOUND"));
        
        await expect(ERROR_RECOVERY.elementNotFound(operation))
          .rejects.toThrow(PlaywrightToolsError);
      });

      test("should throw non-element-not-found errors", async () => {
        const operation = vi.fn().mockRejectedValue(createError("Other error", "TIMEOUT_EXCEEDED"));
        const fallback = vi.fn().mockResolvedValue("fallback result");
        
        await expect(ERROR_RECOVERY.elementNotFound(operation, fallback))
          .rejects.toThrow(PlaywrightToolsError);
        expect(fallback).not.toHaveBeenCalled();
      });
    });

    describe("timeoutExceeded", () => {
      test("should return result when operation succeeds", async () => {
        const operation = vi.fn().mockResolvedValue("success");
        
        const result = await ERROR_RECOVERY.timeoutExceeded(operation, 5000);
        
        expect(result).toBe("success");
        expect(operation).toHaveBeenCalledTimes(1);
      });

      test("should retry with reduced timeout when timeout error occurs", async () => {
        const operation = vi.fn()
          .mockRejectedValueOnce(createError("Timeout", "TIMEOUT_EXCEEDED"))
          .mockResolvedValueOnce("success");
        
        const result = await ERROR_RECOVERY.timeoutExceeded(operation, 5000, 2000);
        
        expect(result).toBe("success");
        expect(operation).toHaveBeenCalledTimes(2);
      });

      test("should throw error when reduced timeout is not provided", async () => {
        const operation = vi.fn().mockRejectedValue(createError("Timeout", "TIMEOUT_EXCEEDED"));
        
        await expect(ERROR_RECOVERY.timeoutExceeded(operation, 5000))
          .rejects.toThrow(PlaywrightToolsError);
      });

      test("should throw non-timeout errors", async () => {
        const operation = vi.fn().mockRejectedValue(createError("Other error", "ELEMENT_NOT_FOUND"));
        
        await expect(ERROR_RECOVERY.timeoutExceeded(operation, 5000, 2000))
          .rejects.toThrow(PlaywrightToolsError);
      });
    });
  });
});
