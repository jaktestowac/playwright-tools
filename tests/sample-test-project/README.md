# Sample Test Project

This is a minimal Playwright sample project for testing the local `playwright-tools` package.

## How to Use `npm link` for Local Development

When developing `playwright-tools` locally, you may want to test your changes in this sample project before publishing. `npm link` allows you to use your local version of the package instead of the one from the npm registry.

### Steps to Link the Local Package

1. **In the root of your `playwright-tools` repo:**
   Register your local package globally:
   ```sh
   npm link
   ```

2. **In this sample-test-project directory:**
   Link the globally registered package here:
   ```sh
   npm link playwright-tools
   ```
   This will create a symlink in `node_modules` pointing to your local development version.

3. **Install dependencies (if not already done):**
   ```sh
   npm install
   ```

4. **Build the main package:**
   In the root of your monorepo, run:
   ```sh
   npm run build
   ```
   This ensures the latest code is available to the sample project.

5. **Run the tests:**
   ```sh
   npx playwright test
   ```

---

**Note:**
- If you make changes to the `playwright-tools` source, rebuild it and re-run your tests here.
- `npm link` is for local development only. Remove the link with `npm unlink playwright-tools` when done.

---

This project is for local development and testing only. 