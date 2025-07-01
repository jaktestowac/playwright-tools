import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 5 * 1000, // Default timeout for each test
  reporter: [
    ["html", { open: "never" }], // Generates an HTML report
    ["list"], // Outputs a list of test results in the console
    ["junit", { outputFile: "test-results.xml" }], // Generates a JUnit XML report
  ],
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
