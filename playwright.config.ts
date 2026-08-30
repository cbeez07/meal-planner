import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev --hostname localhost --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_PATH: "./data/e2e.db",
      UPLOAD_DIR: "./data/e2e-uploads",
      AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-12",
      NEXTAUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-12",
      AUTH_URL: "http://localhost:3000",
      NEXTAUTH_URL: "http://localhost:3000",
      PLANNER_USERNAME: "planner",
      PLANNER_PASSWORD: "planner",
      SHOPPER_USERNAME: "shopper",
      SHOPPER_PASSWORD: "shopper",
    },
  },
});
