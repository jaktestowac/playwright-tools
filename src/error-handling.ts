/**
 * Custom error class for playwright-tools specific errors
 */
export class PlaywrightToolsError extends Error {
  public code: string;
  public context: Record<string, any>;

  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message);
    this.name = "PlaywrightToolsError";
    this.code = code;
    this.context = context || {};
  }
}

/**
 * Error codes for different types of errors
 */
export const ERROR_CODES = {
  ELEMENT_NOT_FOUND: "ELEMENT_NOT_FOUND",
  ELEMENT_NOT_VISIBLE: "ELEMENT_NOT_VISIBLE",
  ELEMENT_NOT_ENABLED: "ELEMENT_NOT_ENABLED",
  NAVIGATION_FAILED: "NAVIGATION_FAILED",
  NETWORK_REQUEST_FAILED: "NETWORK_REQUEST_FAILED",
  SCREENSHOT_FAILED: "SCREENSHOT_FAILED",
  FILE_UPLOAD_FAILED: "FILE_UPLOAD_FAILED",
  DIALOG_HANDLING_FAILED: "DIALOG_HANDLING_FAILED",
  STORAGE_OPERATION_FAILED: "STORAGE_OPERATION_FAILED",
  RETRY_EXHAUSTED: "RETRY_EXHAUSTED",
  TIMEOUT_EXCEEDED: "TIMEOUT_EXCEEDED",
  INVALID_INPUT: "INVALID_INPUT",
  UNSUPPORTED_OPERATION: "UNSUPPORTED_OPERATION",
} as const;

/**
 * Creates a standardized error with context
 */
export function createError(
  message: string,
  code: keyof typeof ERROR_CODES,
  context?: Record<string, any>
): PlaywrightToolsError {
  return new PlaywrightToolsError(message, ERROR_CODES[code], context);
}

/**
 * Wraps an operation with error handling and context
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorCode: keyof typeof ERROR_CODES,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const originalError = error as Error;
    const enhancedError = createError(
      originalError.message,
      errorCode,
      {
        ...context,
        originalError: {
          name: originalError.name,
          message: originalError.message,
          stack: originalError.stack,
        },
      }
    );
    throw enhancedError;
  }
}

/**
 * Handles timeout errors with custom messages
 */
export function handleTimeoutError(
  operation: string,
  timeout: number,
  context?: Record<string, any>
): PlaywrightToolsError {
  return createError(
    `Operation "${operation}" timed out after ${timeout}ms`,
    "TIMEOUT_EXCEEDED",
    {
      operation,
      timeout,
      ...context,
    }
  );
}

/**
 * Validates input parameters and throws descriptive errors
 */
export function validateInput(
  value: any,
  name: string,
  type: string,
  required: boolean = true
): void {
  if (required && (value === undefined || value === null)) {
    throw createError(
      `Parameter "${name}" is required but was ${value}`,
      "INVALID_INPUT",
      { parameter: name, type, value }
    );
  }

  if (value !== undefined && value !== null && typeof value !== type) {
    throw createError(
      `Parameter "${name}" must be of type "${type}" but got "${typeof value}"`,
      "INVALID_INPUT",
      { parameter: name, expectedType: type, actualType: typeof value, value }
    );
  }
}

/**
 * Validates locator objects
 */
export function validateLocator(locator: any, name: string = "locator"): void {
  validateInput(locator, name, "object", true);
  
  if (!locator || typeof locator.click !== "function") {
    throw createError(
      `Parameter "${name}" must be a valid Playwright locator`,
      "INVALID_INPUT",
      { parameter: name, type: typeof locator }
    );
  }
}

/**
 * Validates page objects
 */
export function validatePage(page: any, name: string = "page"): void {
  validateInput(page, name, "object", true);
  
  if (!page || typeof page.goto !== "function") {
    throw createError(
      `Parameter "${name}" must be a valid Playwright page`,
      "INVALID_INPUT",
      { parameter: name, type: typeof page }
    );
  }
}

/**
 * Creates a retryable error that can be caught and retried
 */
export function createRetryableError(
  message: string,
  context?: Record<string, any>
): PlaywrightToolsError {
  return createError(message, "RETRY_EXHAUSTED", {
    retryable: true,
    ...context,
  });
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  return (
    error instanceof PlaywrightToolsError &&
    (error.code === "TIMEOUT_EXCEEDED" || error.context?.retryable === true)
  );
}

/**
 * Formats error messages for better debugging
 */
export function formatErrorMessage(error: PlaywrightToolsError): string {
  const parts = [`[${error.code}] ${error.message}`];
  
  if (error.context && Object.keys(error.context).length > 0) {
    parts.push(`Context: ${JSON.stringify(error.context, null, 2)}`);
  }
  
  return parts.join("\n");
}

/**
 * Logs errors with structured information
 */
export function logError(error: PlaywrightToolsError, operation?: string): void {
  const logData = {
    timestamp: new Date().toISOString(),
    operation,
    errorCode: error.code,
    message: error.message,
    context: error.context,
    stack: error.stack,
  };
  
  console.error("PlaywrightTools Error:", JSON.stringify(logData, null, 2));
}

/**
 * Error recovery strategies
 */
export const ERROR_RECOVERY = {
  /**
   * Attempts to recover from element not found errors
   */
  async elementNotFound<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof PlaywrightToolsError && error.code === "ELEMENT_NOT_FOUND") {
        if (fallback) {
          return await fallback();
        }
      }
      throw error;
    }
  },

  /**
   * Attempts to recover from timeout errors with reduced timeout
   */
  async timeoutExceeded<T>(
    operation: () => Promise<T>,
    originalTimeout: number,
    reducedTimeout?: number
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof PlaywrightToolsError && error.code === "TIMEOUT_EXCEEDED") {
        if (reducedTimeout && reducedTimeout < originalTimeout) {
          // Retry with reduced timeout
          return await withErrorHandling(
            () => operation(),
            "TIMEOUT_EXCEEDED",
            { originalTimeout, reducedTimeout }
          );
        }
      }
      throw error;
    }
  },
}; 