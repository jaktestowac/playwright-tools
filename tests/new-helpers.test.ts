import { test, expect, describe, vi, beforeEach } from "vitest";
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
  createTestDataFactory,
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

  describe("createTestDataFactory", () => {
    test("should create data factory with user data", () => {
      const factory = createTestDataFactory();
      const user = factory.user();

      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("age");
      expect(user.email).toMatch(/@example\.com$/);
    });

    test("should generate unique emails", () => {
      const factory = createTestDataFactory();
      const email1 = factory.email();
      const email2 = factory.email("custom");

      expect(email1).toMatch(/^test\d+@example\.com$/);
      expect(email2).toMatch(/^custom\d+@example\.com$/);
    });

    test("should create login form data", () => {
      const factory = createTestDataFactory();
      const loginData = factory.loginForm();

      expect(loginData).toHaveProperty("username");
      expect(loginData).toHaveProperty("password");
      expect(loginData.username).toMatch(/@example\.com$/);
      expect(loginData.password).toMatch(/^TestPass\d+!$/);
    });

    test("should generate addresses", () => {
      const factory = createTestDataFactory();
      const address = factory.address();

      expect(address).toHaveProperty("street");
      expect(address).toHaveProperty("city");
      expect(address).toHaveProperty("state");
      expect(address).toHaveProperty("zip");
    });

    test("should generate credit card data", () => {
      const factory = createTestDataFactory();
      const card = factory.creditCard();

      expect(card).toHaveProperty("number");
      expect(card).toHaveProperty("expiry");
      expect(card).toHaveProperty("cvv");
      expect(card).toHaveProperty("name");
      expect(card.number).toBe("4111 1111 1111 1111");
    });

    test("should generate dates", () => {
      const factory = createTestDataFactory();
      const futureDate = factory.futureDate(7);
      const pastDate = factory.pastDate(7);

      expect(futureDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(pastDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test("should generate random strings", () => {
      const factory = createTestDataFactory();
      const randomStr = factory.randomString(10);

      expect(randomStr).toHaveLength(10);
      expect(randomStr).toMatch(/^[A-Za-z0-9]+$/);
    });

    test("should generate URLs with base URL", () => {
      const factory = createTestDataFactory({ baseUrl: "https://test.com" });
      const url = factory.url("/page");

      expect(url).toMatch(/^https:\/\/test\.com\/page\?t=\d+$/);
    });

    test("should allow data overrides", () => {
      const factory = createTestDataFactory();
      const user = factory.user({ name: "Custom Name", age: 30 });

      expect(user.name).toBe("Custom Name");
      expect(user.age).toBe(30);
      expect(user.email).toMatch(/@example\.com$/); // Should still be generated
    });
  });
});
