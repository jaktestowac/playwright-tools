/**
 * Create a test data factory for generating test data.
 * Provides utilities for creating consistent test data across tests.
 *
 * @param options - Configuration options for the factory
 * @returns Object with data generation methods
 *
 * @example
 * ```typescript
 * const dataFactory = createTestDataFactory();
 * const user = dataFactory.user();
 * const email = dataFactory.email();
 * const form = dataFactory.loginForm();
 * ```
 */
export function createTestDataFactory(options?: { seed?: string; locale?: string; baseUrl?: string }) {
  const timestamp = Date.now();
  const seed = options?.seed || "test";

  return {
    timestamp,

    user(overrides?: Partial<{ name: string; email: string; age: number }>) {
      return {
        name: `Test User ${timestamp}`,
        email: `testuser${timestamp}@example.com`,
        age: 25,
        ...overrides,
      };
    },

    email(prefix = "test") {
      return `${prefix}${timestamp}@example.com`;
    },

    phoneNumber(countryCode = "+1") {
      const number = String(timestamp).slice(-10).padStart(10, "0");
      return `${countryCode} ${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
    },

    address(overrides?: Partial<{ street: string; city: string; state: string; zip: string }>) {
      return {
        street: `${(timestamp % 9999) + 1} Test Street`,
        city: "Test City",
        state: "TS",
        zip: String((timestamp % 99999) + 10000),
        ...overrides,
      };
    },

    loginForm(overrides?: Partial<{ username: string; password: string }>) {
      return {
        username: this.email("user"),
        password: `TestPass${timestamp}!`,
        ...overrides,
      };
    },

    creditCard(overrides?: Partial<{ number: string; expiry: string; cvv: string; name: string }>) {
      return {
        number: "4111 1111 1111 1111", // Test Visa number
        expiry: "12/25",
        cvv: "123",
        name: `Test User ${timestamp}`,
        ...overrides,
      };
    },

    url(path = "") {
      const base = options?.baseUrl || "https://example.com";
      return `${base}${path}?t=${timestamp}`;
    },

    randomString(length = 8) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      for (let i = 0; i < length; i++) {
        result += chars.charAt((timestamp + i) % chars.length);
      }
      return result;
    },

    futureDate(daysFromNow = 30) {
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      return date.toISOString().split("T")[0]; // YYYY-MM-DD format
    },

    pastDate(daysAgo = 30) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().split("T")[0]; // YYYY-MM-DD format
    },
  };
}
