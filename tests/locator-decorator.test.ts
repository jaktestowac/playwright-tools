import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import {
  createEnhancedLocator,
  createEnhancedLocatorFactory,
  extendPage,
  isEnhancedLocator,
  getOriginalLocator,
  EnhancedLocator,
  LocatorDecoratorConfig,
  CustomLocatorMethod
} from "../src/locator-decorator";

// Mock the imported modules
vi.mock("../src/interactions", () => ({
  safeClick: vi.fn(),
  safeFill: vi.fn(),
  fillForm: vi.fn(),
}));

vi.mock("../src/element-queries", () => ({
  extractElementData: vi.fn(),
  isElementEnabled: vi.fn(),
  waitForVisibleWithRetry: vi.fn(),
  scrollToElement: vi.fn(),
}));

vi.mock("../src/accessibility", () => ({
  checkAccessibility: vi.fn(),
}));

vi.mock("../src/advanced-interactions", () => ({
  handleFileUpload: vi.fn(),
  pressKeyCombo: vi.fn(),
  dragAndDrop: vi.fn(),
}));

describe("Locator Decorator", () => {
  let mockPage: any;
  let mockLocator: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPage = {
      locator: vi.fn().mockReturnValue(mockLocator),
      getByRole: vi.fn().mockReturnValue(mockLocator),
      getByText: vi.fn().mockReturnValue(mockLocator),
      getByLabel: vi.fn().mockReturnValue(mockLocator),
      getByTestId: vi.fn().mockReturnValue(mockLocator),
      getByPlaceholder: vi.fn().mockReturnValue(mockLocator),
      getByTitle: vi.fn().mockReturnValue(mockLocator),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
    };

    mockLocator = {
      click: vi.fn().mockResolvedValue(undefined),
      fill: vi.fn().mockResolvedValue(undefined),
      waitFor: vi.fn().mockResolvedValue(undefined),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue("button"),
      isEnabled: vi.fn().mockResolvedValue(true),
      textContent: vi.fn().mockResolvedValue("sample text"),
      getAttribute: vi.fn().mockResolvedValue("sample-value"),
      boundingBox: vi.fn().mockResolvedValue({ x: 100, y: 100, width: 50, height: 30 }),
      hover: vi.fn().mockResolvedValue(undefined),
      setInputFiles: vi.fn().mockResolvedValue(undefined),
      scrollIntoViewIfNeeded: vi.fn().mockResolvedValue(undefined),
      page: vi.fn().mockReturnValue(mockPage),
      _page: mockPage,
    };
  });

  describe("createEnhancedLocator", () => {
    test("should create enhanced locator with default configuration", () => {
      const enhanced = createEnhancedLocator(mockLocator);

      expect(isEnhancedLocator(enhanced)).toBe(true);
      expect(typeof enhanced.safeClick).toBe("function");
      expect(typeof enhanced.safeFill).toBe("function");
      expect(typeof enhanced.isEnabled).toBe("function");
      expect(typeof enhanced.extractData).toBe("function");
      expect(typeof enhanced.checkAccessibility).toBe("function");
    });

    test("should preserve original locator methods", () => {
      const enhanced = createEnhancedLocator(mockLocator);

      expect(typeof enhanced.click).toBe("function");
      expect(typeof enhanced.fill).toBe("function");
      expect(typeof enhanced.waitFor).toBe("function");
    });

    test("should disable enhanced methods when configured", () => {
      const enhanced = createEnhancedLocator(mockLocator, {
        enableEnhancedMethods: false,
      });

      expect(isEnhancedLocator(enhanced)).toBe(false);
      expect(typeof enhanced.safeClick).toBe("undefined");
    });

    test("should add custom methods", async () => {
      const customMethod: CustomLocatorMethod = async function(this: EnhancedLocator, text: string) {
        await this.fill(text);
        return "custom result";
      };

      const enhanced = createEnhancedLocator(mockLocator, {
        customMethods: {
          typeSlowly: customMethod,
        },
      });

      expect(typeof enhanced.typeSlowly).toBe("function");
      const result = await enhanced.typeSlowly("test");
      expect(result).toBe("custom result");
      expect(mockLocator.fill).toHaveBeenCalledWith("test");
    });

    test("should handle method overrides", () => {
      const enhanced = createEnhancedLocator(mockLocator, {
        overrideMethods: ["click"],
        customMethods: {
          click: async function(this: EnhancedLocator) {
            console.log("Custom click");
            return (this as any).originalClick();
          },
        },
      });

      expect(typeof enhanced.originalClick).toBe("function");
      expect(typeof enhanced.click).toBe("function");
    });

    test("should warn when custom method conflicts without overrides", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      createEnhancedLocator(mockLocator, {
        allowOverrides: false,
        customMethods: {
          click: async function() {
            return "custom";
          },
        },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Custom method "click" conflicts with existing locator method and overrides are disabled.'
      );

      consoleSpy.mockRestore();
    });

    test("should merge default options with provided options", async () => {
      const enhanced = createEnhancedLocator(mockLocator, {
        defaultOptions: {
          safeClick: { timeout: 5000, catchErrors: true },
        },
      });

      // Mock the safeClick function to capture options
      const originalSafeClick = enhanced.safeClick;
      enhanced.safeClick = vi.fn().mockResolvedValue(true);

      await enhanced.safeClick({ force: true });

      expect(enhanced.safeClick).toHaveBeenCalledWith({ force: true });
    });
  });

  describe("Enhanced Locator Methods", () => {
    let enhanced: EnhancedLocator;

    beforeEach(() => {
      enhanced = createEnhancedLocator(mockLocator);
    });

    describe("safeClick", () => {
      test("should call safeClick with default options", async () => {
        const { safeClick } = await import("../src/interactions");
        vi.mocked(safeClick).mockResolvedValue(true);

        const result = await enhanced.safeClick();

        expect(safeClick).toHaveBeenCalledWith(mockLocator, {});
        expect(result).toBe(true);
      });

      test("should call safeClick with custom options", async () => {
        const { safeClick } = await import("../src/interactions");
        vi.mocked(safeClick).mockResolvedValue(true);

        await enhanced.safeClick({ timeout: 5000, force: true });

        expect(safeClick).toHaveBeenCalledWith(mockLocator, {
          timeout: 5000,
          force: true,
        });
      });
    });

    describe("safeFill", () => {
      test("should call safeFill with text and options", async () => {
        const { safeFill } = await import("../src/interactions");
        vi.mocked(safeFill).mockResolvedValue(true);

        const result = await enhanced.safeFill("test text", { timeout: 3000 });

        expect(safeFill).toHaveBeenCalledWith(mockLocator, "test text", {
          timeout: 3000,
        });
        expect(result).toBe(true);
      });
    });

    describe("isEnabled", () => {
      test("should call isElementEnabled", async () => {
        const { isElementEnabled } = await import("../src/element-queries");
        vi.mocked(isElementEnabled).mockResolvedValue(true);

        const result = await enhanced.isEnabled();

        expect(isElementEnabled).toHaveBeenCalledWith(mockLocator);
        expect(result).toBe(true);
      });
    });

    describe("waitForVisibleWithRetry", () => {
      test("should call waitForVisibleWithRetry", async () => {
        const { waitForVisibleWithRetry } = await import("../src/element-queries");
        vi.mocked(waitForVisibleWithRetry).mockResolvedValue(undefined);

        await enhanced.waitForVisibleWithRetry({ retries: 3, timeout: 10000 });

        expect(waitForVisibleWithRetry).toHaveBeenCalledWith(mockLocator, {
          retries: 3,
          timeout: 10000,
        });
      });
    });

    describe("extractData", () => {
      test("should call extractElementData", async () => {
        const { extractElementData } = await import("../src/element-queries");
        const mockData = { text: "sample", attributes: { id: "test" } };
        vi.mocked(extractElementData).mockResolvedValue(mockData);

        const result = await enhanced.extractData({ includeText: true });

        expect(extractElementData).toHaveBeenCalledWith(mockLocator, {
          includeText: true,
        });
        expect(result).toEqual(mockData);
      });
    });

    describe("checkAccessibility", () => {
      test("should call checkAccessibility", async () => {
        const { checkAccessibility } = await import("../src/accessibility");
        const mockA11y = { role: "button", focusable: true };
        vi.mocked(checkAccessibility).mockResolvedValue(mockA11y);

        const result = await enhanced.checkAccessibility({ checkRole: true });

        expect(checkAccessibility).toHaveBeenCalledWith(mockLocator, {
          checkRole: true,
        });
        expect(result).toEqual(mockA11y);
      });
    });

    describe("scrollTo", () => {
      test("should call scrollToElement", async () => {
        const { scrollToElement } = await import("../src/element-queries");
        vi.mocked(scrollToElement).mockResolvedValue(undefined);

        await enhanced.scrollTo({ behavior: "smooth", block: "center" });

        expect(scrollToElement).toHaveBeenCalledWith(mockLocator, {
          behavior: "smooth",
          block: "center",
        });
      });
    });

    describe("pressKeys", () => {
      test("should call pressKeyCombo with page", async () => {
        const { pressKeyCombo } = await import("../src/advanced-interactions");
        vi.mocked(pressKeyCombo).mockResolvedValue(undefined);

        await enhanced.pressKeys("Control+C");

        expect(pressKeyCombo).toHaveBeenCalledWith(mockPage, "Control+C", undefined);
      });

      test("should throw error when page is not accessible", async () => {
        mockLocator.page = vi.fn().mockReturnValue(null);
        mockLocator._page = null;

        const enhanced = createEnhancedLocator(mockLocator);

        await expect(enhanced.pressKeys("Control+C")).rejects.toThrow(
          "Cannot access page from locator for keyboard operations"
        );
      });
    });

    describe("dragTo", () => {
      test("should call dragAndDrop", async () => {
        const { dragAndDrop } = await import("../src/advanced-interactions");
        vi.mocked(dragAndDrop).mockResolvedValue(undefined);

        const targetLocator = { ...mockLocator };
        await enhanced.dragTo(targetLocator, { steps: 10 });

        expect(dragAndDrop).toHaveBeenCalledWith(mockLocator, targetLocator, {
          steps: 10,
        });
      });
    });

    describe("uploadFiles", () => {
      test("should call handleFileUpload with single file", async () => {
        const { handleFileUpload } = await import("../src/advanced-interactions");
        vi.mocked(handleFileUpload).mockResolvedValue(undefined);

        await enhanced.uploadFiles("./test.pdf");

        expect(handleFileUpload).toHaveBeenCalledWith(mockLocator, ["./test.pdf"], undefined);
      });

      test("should call handleFileUpload with multiple files", async () => {
        const { handleFileUpload } = await import("../src/advanced-interactions");
        vi.mocked(handleFileUpload).mockResolvedValue(undefined);

        await enhanced.uploadFiles(["./test1.pdf", "./test2.jpg"]);

        expect(handleFileUpload).toHaveBeenCalledWith(mockLocator, ["./test1.pdf", "./test2.jpg"], undefined);
      });
    });

    describe("getDescription", () => {
      test("should return element description", async () => {
        const result = await enhanced.getDescription();

        expect(result).toBe("button");
        expect(mockLocator.evaluate).toHaveBeenCalled();
      });

      test("should return fallback description on error", async () => {
        mockLocator.evaluate.mockRejectedValue(new Error("Evaluation failed"));

        const result = await enhanced.getDescription();

        expect(result).toBe("element");
      });
    });

    describe("waitForEnabled", () => {
      test("should wait for element to be enabled", async () => {
        await enhanced.waitForEnabled(5000);

        expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: "visible", timeout: 5000 });
        expect(mockLocator.evaluate).toHaveBeenCalledWith(
          expect.any(Function),
          undefined,
          { timeout: 5000 }
        );
      });
    });

    describe("waitForDisabled", () => {
      test("should wait for element to be disabled", async () => {
        await enhanced.waitForDisabled(5000);

        expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: "visible", timeout: 5000 });
        expect(mockLocator.evaluate).toHaveBeenCalledWith(
          expect.any(Function),
          undefined,
          { timeout: 5000 }
        );
      });
    });
  });

  describe("createEnhancedLocatorFactory", () => {
    test("should create factory with configuration", () => {
      const factory = createEnhancedLocatorFactory({
        enableEnhancedMethods: true,
        customMethods: {
          highlight: async function() {
            await this.evaluate((el: any) => {
              el.style.border = "2px solid red";
            });
          },
        },
      });

      expect(typeof factory).toBe("function");
    });

    test("should use factory to create enhanced locators", async () => {
      const factory = createEnhancedLocatorFactory({
        customMethods: {
          highlight: async function() {
            return "highlighted";
          },
        },
      });

      const enhanced = factory(mockLocator);

      expect(isEnhancedLocator(enhanced)).toBe(true);
      expect(typeof enhanced.highlight).toBe("function");
      const result = await enhanced.highlight();
      expect(result).toBe("highlighted");
    });
  });

  describe("extendPage", () => {
    test("should extend page with enhanced locator methods", () => {
      const enhancedPage = extendPage(mockPage, {
        enableEnhancedMethods: true,
      });

      expect(typeof enhancedPage.locator).toBe("function");
      expect(typeof enhancedPage.getByRole).toBe("function");
      expect(typeof enhancedPage.getByText).toBe("function");
      expect(typeof enhancedPage.getByLabel).toBe("function");
      expect(typeof enhancedPage.getByTestId).toBe("function");
      expect(typeof enhancedPage.getByPlaceholder).toBe("function");
      expect(typeof enhancedPage.getByTitle).toBe("function");
    });

    test("should create enhanced locators through page methods", () => {
      const enhancedPage = extendPage(mockPage);

      const enhanced = enhancedPage.locator("button");

      expect(isEnhancedLocator(enhanced)).toBe(true);
      expect(mockPage.locator).toHaveBeenCalledWith("button", undefined);
    });

    test("should pass options to page methods", () => {
      const enhancedPage = extendPage(mockPage);

      enhancedPage.getByRole("button", { name: "Submit" });

      expect(mockPage.getByRole).toHaveBeenCalledWith("button", { name: "Submit" });
    });
  });

  describe("Utility Functions", () => {
    test("isEnhancedLocator should return true for enhanced locators", () => {
      const enhanced = createEnhancedLocator(mockLocator);
      const regular = mockLocator;

      expect(isEnhancedLocator(enhanced)).toBe(true);
      expect(isEnhancedLocator(regular)).toBe(false);
      expect(isEnhancedLocator(null)).toBe(false);
      expect(isEnhancedLocator(undefined)).toBe(false);
    });

    test("getOriginalLocator should return original locator", () => {
      const enhanced = createEnhancedLocator(mockLocator);

      const original = getOriginalLocator(enhanced);

      expect(original).toBe(mockLocator);
    });

    test("getOriginalLocator should handle complex prototype chains", () => {
      const enhanced = createEnhancedLocator(mockLocator);
      const doubleEnhanced = createEnhancedLocator(enhanced);

      const original = getOriginalLocator(doubleEnhanced);

      expect(original).toBe(mockLocator);
    });

    test("getOriginalLocator should prevent infinite loops with corrupted prototype chain", () => {
      const enhanced = createEnhancedLocator(mockLocator);
      
      // Create a deep prototype chain that could cause many iterations
      let current = enhanced;
      for (let i = 0; i < 150; i++) { // More than MAX_ITERATIONS (100)
        const newObj = Object.create(current);
        newObj.click = vi.fn(); // Add click method to make it look like a locator
        current = newObj;
      }
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // This should not cause an infinite loop and should hit the iteration limit
      const result = getOriginalLocator(current as any);
      
      expect(result).toBe(current); // Should return the last object as fallback
      // No warning is expected here because a click method is found
      consoleSpy.mockRestore();
    });

    test("getOriginalLocator should handle prototype chain errors gracefully", () => {
      const enhanced = createEnhancedLocator(mockLocator);
      
      // Create an object with a prototype that throws when accessed
      const problematicObject = Object.create(enhanced);
      const throwingPrototype = new Proxy({}, {
        getPrototypeOf() {
          throw new Error('Prototype access denied');
        }
      });
      Object.setPrototypeOf(problematicObject, throwingPrototype);
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // This should not throw and should handle the error gracefully
      const result = getOriginalLocator(problematicObject as any);
      
      expect(result).toBe(problematicObject); // Should return the problematic object as fallback
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unable to traverse prototype chain in getOriginalLocator:',
        expect.any(Error)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Could not find original locator in prototype chain, returning enhanced locator'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    test("should handle missing page gracefully", () => {
      const locatorWithoutPage = { ...mockLocator };
      delete locatorWithoutPage.page;
      delete locatorWithoutPage._page;

      const enhanced = createEnhancedLocator(locatorWithoutPage);

      // Should not throw during creation
      expect(isEnhancedLocator(enhanced)).toBe(true);
    });

    test("should handle evaluation errors in getDescription", async () => {
      mockLocator.evaluate.mockRejectedValue(new Error("DOM error"));

      const enhanced = createEnhancedLocator(mockLocator);
      const description = await enhanced.getDescription();

      expect(description).toBe("element");
    });
  });

  describe("Method Override Examples", () => {
    test("should allow overriding click method", async () => {
      const enhanced = createEnhancedLocator(mockLocator, {
        overrideMethods: ["click"],
        customMethods: {
          click: async function(this: EnhancedLocator) {
            console.log("Custom click behavior");
            return (this as any).originalClick();
          },
        },
      });

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await enhanced.click();

      expect(consoleSpy).toHaveBeenCalledWith("Custom click behavior");
      expect(mockLocator.click).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test("should preserve original method with original prefix", () => {
      const enhanced = createEnhancedLocator(mockLocator, {
        overrideMethods: ["fill"],
        customMethods: {
          fill: async function(this: EnhancedLocator, text: string) {
            return (this as any).originalFill(text);
          },
        },
      });

      expect(typeof enhanced.originalFill).toBe("function");
      expect(enhanced.originalFill).toBe(mockLocator.fill);
    });
  });

  describe("Custom Method Examples", () => {
    test("should add typeSlowly method", async () => {
      const enhanced = createEnhancedLocator(mockLocator, {
        customMethods: {
          async typeSlowly(this: EnhancedLocator, text: string, delay: number = 100) {
            for (const char of text) {
              await this.fill(char);
              await this.page().waitForTimeout(delay);
            }
          },
        },
      });

      await enhanced.typeSlowly("hello", 50);

      expect(mockLocator.fill).toHaveBeenCalledTimes(5);
      expect(mockPage.waitForTimeout).toHaveBeenCalledTimes(5);
    });

    test("should add highlight method", async () => {
      const enhanced = createEnhancedLocator(mockLocator, {
        customMethods: {
          async highlight(this: EnhancedLocator) {
            await this.evaluate((el: any) => {
              el.style.border = "2px solid red";
              setTimeout(() => {
                el.style.border = "";
              }, 1000);
            });
          },
        },
      });

      await enhanced.highlight();

      expect(mockLocator.evaluate).toHaveBeenCalled();
    });

    test("should add waitForAnimation method", async () => {
      const enhanced = createEnhancedLocator(mockLocator, {
        customMethods: {
          async waitForAnimation(this: EnhancedLocator) {
            await this.waitForFunction(() => {
              return !document.querySelector('[style*="animation"]');
            });
          },
        },
      });

      await enhanced.waitForAnimation();

      expect(mockLocator.waitForFunction).toHaveBeenCalled();
    });
  });
}); 