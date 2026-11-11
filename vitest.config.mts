import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@/": root,
      // `server-only` throws outside a React Server Components build; tests run
      // the server modules directly, so replace it with an empty module.
      "server-only": `${root}tests/stubs/server-only.ts`,
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
