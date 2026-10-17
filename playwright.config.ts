import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:8080";
const isRemote = !!process.env.BASE_URL;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI || isRemote ? 1 : 0,
  workers: isRemote ? 4 : undefined,
  timeout: isRemote ? 120_000 : 30_000,
  expect: { timeout: isRemote ? 15_000 : 5_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    // Replaces the Cypress disableSmoothScroll() hack and makes dialog transitions instant.
    reducedMotion: "reduce",
    serviceWorkers: "block",
    navigationTimeout: isRemote ? 90_000 : 15_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chrome",
      testIgnore: /visual\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "edge",
      testIgnore: /visual\.spec\.ts/,
      use: { ...devices["Desktop Edge"], channel: "msedge" },
    },
    {
      name: "firefox",
      testIgnore: /visual\.spec\.ts/,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      // Local only: `npm run test:visual`. Baselines are git-ignored.
      name: "visual",
      testMatch: /visual\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: isRemote
    ? undefined
    : {
        command: "npm start",
        url: "http://localhost:8080",
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
});
