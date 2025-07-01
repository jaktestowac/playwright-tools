import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Exclude sample test project files from vitest since they should be run with Playwright
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/sample-test-project/**',  // Exclude Playwright test files
      '**/sample-test-project/**',
    ],
    environment: 'node',
    globals: true,
    testTimeout: 5000, // Increase timeout to handle tests that need to timeout
  },
});
