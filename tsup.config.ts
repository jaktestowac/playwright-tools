import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/interactions.ts",
    "src/element-queries.ts",
    "src/navigation.ts",
    "src/advanced-interactions.ts",
    "src/screenshots.ts",
    "src/assertions.ts",
    "src/waiting.ts",
    "src/retry.ts",
    "src/test-utils.ts",
    "src/accessibility.ts",
    "src/storage.ts",
    "src/network.ts",
    "src/dialogs.ts",
    "src/tables.ts",
    "src/page-objects.ts",
    "src/test-data.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
});
