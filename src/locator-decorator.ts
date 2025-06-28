import { Locator, Page } from "@playwright/test";
import { 
  safeClick, 
  safeFill, 
  fillForm 
} from "./interactions";
import { 
  SafeInteractionOptions, 
  ElementDataOptions, 
  AccessibilityOptions,
  ElementData,
  AccessibilityData 
} from "./types";
import {
  extractElementData,
  isElementEnabled,
  waitForVisibleWithRetry,
  scrollToElement
} from "./element-queries";
import {
  checkAccessibility
} from "./accessibility";
import {
  handleFileUpload
} from "./advanced-interactions";
import {
  pressKeyCombo
} from "./advanced-interactions";
import {
  dragAndDrop
} from "./advanced-interactions";

// Type for custom method extensions
export type CustomLocatorMethod = (this: EnhancedLocator, ...args: any[]) => any;

// Interface for the enhanced locator
export interface EnhancedLocator extends Locator {
  // Enhanced interaction methods
  safeClick(options?: SafeInteractionOptions): Promise<boolean>;
  safeFill(text: string, options?: SafeInteractionOptions): Promise<boolean>;
  
  // Enhanced query methods
  isEnabled(): Promise<boolean>;
  waitForVisibleWithRetry(options?: { retries?: number; timeout?: number }): Promise<void>;
  extractData(options?: ElementDataOptions): Promise<ElementData>;
  checkAccessibility(options?: AccessibilityOptions): Promise<AccessibilityData>;
  
  // Enhanced action methods
  scrollTo(options?: { behavior?: "instant" | "smooth"; block?: "start" | "center" | "end" | "nearest"; inline?: "start" | "center" | "end" | "nearest"; offset?: { x?: number; y?: number } }): Promise<void>;
  pressKeys(combo: string, options?: { element?: Locator; delay?: number }): Promise<void>;
  dragTo(target: Locator, options?: { steps?: number; delay?: number; sourcePosition?: { x: number; y: number }; targetPosition?: { x: number; y: number } }): Promise<void>;
  uploadFiles(filePaths: string | string[], options?: { waitForUpload?: boolean; validateFileTypes?: boolean; allowedTypes?: string[]; maxFileSize?: number }): Promise<void>;
  
  // Utility methods
  getDescription(): Promise<string>;
  waitForEnabled(timeout?: number): Promise<void>;
  waitForDisabled(timeout?: number): Promise<void>;
  
  // Custom method support
  [key: string]: any;
}

// Configuration for the locator decorator
export interface LocatorDecoratorConfig {
  // Whether to add enhanced methods from interactions module
  enableEnhancedMethods?: boolean;
  // Whether to allow method overrides
  allowOverrides?: boolean;
  // Custom methods to add
  customMethods?: Record<string, CustomLocatorMethod>;
  // Methods to override (original methods will be preserved with 'original' prefix)
  overrideMethods?: string[];
  // Default options for enhanced methods
  defaultOptions?: {
    safeClick?: SafeInteractionOptions;
    safeFill?: SafeInteractionOptions;
    extractData?: ElementDataOptions;
    checkAccessibility?: AccessibilityOptions;
  };
}

// Default configuration
const DEFAULT_CONFIG: Required<LocatorDecoratorConfig> = {
  enableEnhancedMethods: true,
  allowOverrides: true,
  customMethods: {},
  overrideMethods: [],
  defaultOptions: {
    safeClick: {},
    safeFill: {},
    extractData: {},
    checkAccessibility: {}
  }
};

/**
 * Creates an enhanced locator with additional functionality
 * 
 * @param locator - The original Playwright locator
 * @param config - Configuration for the enhanced locator
 * @returns Enhanced locator with additional methods
 * 
 * @example
 * ```typescript
 * // Basic usage with default enhancements
 * const enhancedButton = createEnhancedLocator(page.getByRole('button'));
 * await enhancedButton.safeClick();
 * 
 * // With custom configuration
 * const enhancedInput = createEnhancedLocator(page.getByLabel('Username'), {
 *   enableEnhancedMethods: true,
 *   allowOverrides: false,
 *   customMethods: {
 *     async typeSlowly(text: string, delay: number = 100) {
 *       for (const char of text) {
 *         await this.fill(char);
 *         await this.page().waitForTimeout(delay);
 *       }
 *     }
 *   }
 * });
 * 
 * // With method overrides
 * const enhancedForm = createEnhancedLocator(page.locator('form'), {
 *   overrideMethods: ['click', 'fill'],
 *   customMethods: {
 *     async click() {
 *       console.log('Custom click behavior');
 *       return this.originalClick();
 *     }
 *   }
 * });
 * ```
 */
export function createEnhancedLocator(
  locator: Locator, 
  config: LocatorDecoratorConfig = {}
): EnhancedLocator {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Create enhanced locator by extending the original
  const enhancedLocator = Object.create(locator) as EnhancedLocator;
  
  // Helper function to get page from locator
  const getPage = () => {
    // Try to get page from locator context
    try {
      return (locator as any).page?.() || (locator as any)._page;
    } catch {
      return null;
    }
  };
  
  // Helper function to get locator description
  const getLocatorDescription = async (): Promise<string> => {
    try {
      const selector = await locator.evaluate(el => {
        if (el.id) return `#${el.id}`;
        if (el.className) return `.${el.className.split(' ')[0]}`;
        return el.tagName.toLowerCase();
      });
      return selector;
    } catch {
      return "element";
    }
  };
  
  // Add enhanced interaction methods if enabled
  if (finalConfig.enableEnhancedMethods) {
    // Safe interaction methods
    enhancedLocator.safeClick = async (options?: SafeInteractionOptions): Promise<boolean> => {
      const mergedOptions = { ...finalConfig.defaultOptions.safeClick, ...options };
      return safeClick(locator, mergedOptions);
    };
    
    enhancedLocator.safeFill = async (text: string, options?: SafeInteractionOptions): Promise<boolean> => {
      const mergedOptions = { ...finalConfig.defaultOptions.safeFill, ...options };
      return safeFill(locator, text, mergedOptions);
    };
    
    // Enhanced query methods
    enhancedLocator.isEnabled = async (): Promise<boolean> => {
      return isElementEnabled(locator);
    };
    
    enhancedLocator.waitForVisibleWithRetry = async (options?: { retries?: number; timeout?: number }): Promise<void> => {
      return waitForVisibleWithRetry(locator, options);
    };
    
    enhancedLocator.extractData = async (options?: ElementDataOptions): Promise<ElementData> => {
      const mergedOptions = { ...finalConfig.defaultOptions.extractData, ...options };
      return extractElementData(locator, mergedOptions);
    };
    
    enhancedLocator.checkAccessibility = async (options?: AccessibilityOptions): Promise<AccessibilityData> => {
      const mergedOptions = { ...finalConfig.defaultOptions.checkAccessibility, ...options };
      return checkAccessibility(locator, mergedOptions);
    };
    
    // Enhanced action methods
    enhancedLocator.scrollTo = async (options?: { behavior?: "instant" | "smooth"; block?: "start" | "center" | "end" | "nearest"; inline?: "start" | "center" | "end" | "nearest"; offset?: { x?: number; y?: number } }): Promise<void> => {
      return scrollToElement(locator, options);
    };
    
    enhancedLocator.pressKeys = async (combo: string, options?: { element?: Locator; delay?: number }): Promise<void> => {
      const page = getPage();
      if (!page) {
        throw new Error("Cannot access page from locator for keyboard operations");
      }
      return pressKeyCombo(page, combo, options);
    };
    
    enhancedLocator.dragTo = async (target: Locator, options?: { steps?: number; delay?: number; sourcePosition?: { x: number; y: number }; targetPosition?: { x: number; y: number } }): Promise<void> => {
      return dragAndDrop(locator, target, options);
    };
    
    enhancedLocator.uploadFiles = async (filePaths: string | string[], options?: { waitForUpload?: boolean; validateFileTypes?: boolean; allowedTypes?: string[]; maxFileSize?: number }): Promise<void> => {
      return handleFileUpload(locator, Array.isArray(filePaths) ? filePaths : [filePaths], options);
    };
    
    // Utility methods
    enhancedLocator.getDescription = getLocatorDescription;
    
    enhancedLocator.waitForEnabled = async (timeout?: number): Promise<void> => {
      await locator.waitFor({ state: "visible", timeout });
      await locator.evaluate((el: any) => !el.disabled, undefined, { timeout });
    };
    
    enhancedLocator.waitForDisabled = async (timeout?: number): Promise<void> => {
      await locator.waitFor({ state: "visible", timeout });
      await locator.evaluate((el: any) => el.disabled, undefined, { timeout });
    };
  }
  
  // Handle method overrides if allowed
  if (finalConfig.allowOverrides) {
    for (const methodName of finalConfig.overrideMethods) {
      if (typeof locator[methodName as keyof Locator] === 'function') {
        // Store original method with 'original' prefix
        (enhancedLocator as any)[`original${methodName.charAt(0).toUpperCase() + methodName.slice(1)}`] = 
          locator[methodName as keyof Locator];
      }
    }
  }
  
  // Add custom methods
  for (const [methodName, method] of Object.entries(finalConfig.customMethods)) {
    if (finalConfig.allowOverrides || !(methodName in locator)) {
      enhancedLocator[methodName] = method.bind(enhancedLocator);
    } else {
      console.warn(`Custom method "${methodName}" conflicts with existing locator method and overrides are disabled.`);
    }
  }
  
  return enhancedLocator;
}

/**
 * Creates a factory function for enhanced locators with predefined configuration
 * 
 * @param config - Configuration for the enhanced locators
 * @returns Factory function that creates enhanced locators
 * 
 * @example
 * ```typescript
 * // Create a factory with custom configuration
 * const createMyLocator = createEnhancedLocatorFactory({
 *   enableEnhancedMethods: true,
 *   allowOverrides: true,
 *   customMethods: {
 *     async highlight() {
 *       await this.evaluate(el => {
 *         el.style.border = '2px solid red';
 *         setTimeout(() => el.style.border = '', 1000);
 *       });
 *     }
 *   }
 * });
 * 
 * // Use the factory
 * const button = createMyLocator(page.getByRole('button'));
 * await button.highlight();
 * await button.safeClick();
 * ```
 */
export function createEnhancedLocatorFactory(config: LocatorDecoratorConfig) {
  return (locator: Locator) => createEnhancedLocator(locator, config);
}

/**
 * Extends a page object with enhanced locator creation methods
 * 
 * @param page - The Playwright page object
 * @param config - Configuration for enhanced locators
 * @returns Page object with enhanced locator methods
 * 
 * @example
 * ```typescript
 * // Extend page with enhanced locator methods
 * const enhancedPage = extendPage(page, {
 *   enableEnhancedMethods: true,
 *   customMethods: {
 *     async waitForAnimation() {
 *       await this.waitForFunction(() => {
 *         return !document.querySelector('[style*="animation"]');
 *       });
 *     }
 *   }
 * });
 * 
 * // Use enhanced locators
 * const button = enhancedPage.locator('button');
 * await button.waitForAnimation();
 * await button.safeClick();
 * ```
 */
export function extendPage(page: Page, config: LocatorDecoratorConfig = {}) {
  const enhancedPage = Object.create(page);
  
  // Add enhanced locator creation methods
  enhancedPage.locator = (selector: string, options?: any) => {
    return createEnhancedLocator(page.locator(selector, options), config);
  };
  
  enhancedPage.getByRole = (role: string, options?: any) => {
    return createEnhancedLocator(page.getByRole(role as any, options), config);
  };
  
  enhancedPage.getByText = (text: string | RegExp, options?: any) => {
    return createEnhancedLocator(page.getByText(text, options), config);
  };
  
  enhancedPage.getByLabel = (text: string | RegExp, options?: any) => {
    return createEnhancedLocator(page.getByLabel(text, options), config);
  };
  
  enhancedPage.getByTestId = (testId: string) => {
    return createEnhancedLocator(page.getByTestId(testId), config);
  };
  
  enhancedPage.getByPlaceholder = (text: string | RegExp, options?: any) => {
    return createEnhancedLocator(page.getByPlaceholder(text, options), config);
  };
  
  enhancedPage.getByTitle = (text: string | RegExp, options?: any) => {
    return createEnhancedLocator(page.getByTitle(text, options), config);
  };
  
  return enhancedPage;
}

/**
 * Utility function to check if a locator is enhanced
 * 
 * @param locator - The locator to check
 * @returns True if the locator is enhanced
 */
export function isEnhancedLocator(locator: any): locator is EnhancedLocator {
  return locator != null && typeof locator.safeClick === 'function';
}

/**
 * Utility function to get the original locator from an enhanced locator
 * 
 * @param enhancedLocator - The enhanced locator
 * @returns The original Playwright locator
 */
export function getOriginalLocator(enhancedLocator: EnhancedLocator): Locator {
  // Safety check: maximum iterations to prevent infinite loops
  const MAX_ITERATIONS = 100;
  let iterationCount = 0;
  
  // Find the original locator in the prototype chain
  let current = enhancedLocator;
  while (current && current !== Object.prototype && iterationCount < MAX_ITERATIONS) {
    iterationCount++;
    
    // Check if this object has the original locator methods
    if (typeof current.click === 'function' && typeof current.fill === 'function' && typeof current.waitFor === 'function') {
      // If this object doesn't have enhanced methods, it's likely the original
      if (!current.safeClick) {
        return current as Locator;
      }
    }
    
    try {
      current = Object.getPrototypeOf(current);
    } catch (error) {
      // If we can't get the prototype, break to prevent infinite loops
      console.warn('Unable to traverse prototype chain in getOriginalLocator:', error);
      break;
    }
  }
  
  // Reset for fallback search
  iterationCount = 0;
  
  // Fallback: return the first object in the prototype chain that has click method
  current = enhancedLocator;
  while (current && current !== Object.prototype && iterationCount < MAX_ITERATIONS) {
    iterationCount++;
    
    if (typeof current.click === 'function') {
      return current as Locator;
    }
    
    try {
      current = Object.getPrototypeOf(current);
    } catch (error) {
      // If we can't get the prototype, break to prevent infinite loops
      console.warn('Unable to traverse prototype chain in getOriginalLocator fallback:', error);
      break;
    }
  }
  
  // If we can't find the original locator, return the enhanced locator as fallback
  console.warn('Could not find original locator in prototype chain, returning enhanced locator');
  return enhancedLocator as Locator;
} 