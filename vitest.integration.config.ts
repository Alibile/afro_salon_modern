import { defineConfig } from "vitest/config";
import path from "node:path";
import { config } from "dotenv";

config({ path: ".env.test", override: true });

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    setupFiles: ["tests/integration/setup.ts"],
    fileParallelism: false,
    testTimeout: 20000,
    server: {
      deps: {
        // next-auth statically imports "next/server" without an extension.
        // "next" has no package.json "exports" map, so Vitest's default
        // externalization uses Node's strict ESM resolver, which requires an
        // exact file match and fails on the extensionless specifier. Inlining
        // these packages routes them through Vite's resolver instead, which
        // handles this correctly.
        inline: [/next-auth/, /^next$/, /@auth\/core/],
      },
    },
  },
});
