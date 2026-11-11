import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const MOCK_PORT = 4010;
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Traces only when a test is retried in CI; recording every test is slow.
    trace: CI ? "on-first-retry" : "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node tests/e2e/mock-openai.mjs",
      url: `http://localhost:${MOCK_PORT}`,
      env: { MOCK_OPENAI_PORT: String(MOCK_PORT) },
      reuseExistingServer: !CI,
    },
    {
      // CI builds in an earlier step; locally, build first so tests never run
      // against a stale .next folder.
      command: CI ? `npx next start -p ${PORT}` : `npm run build && npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}/en`,
      timeout: 300_000,
      env: {
        OPENAI_API_KEY: "sk-e2e-server",
        OPENAI_BASE_URL: `http://localhost:${MOCK_PORT}/v1`,
        LLM_MODEL: "e2e-model",
        SCENARIO_RATE_LIMIT: "0",
      },
      reuseExistingServer: !CI,
    },
  ],
});
