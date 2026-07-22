import { defineConfig } from '@playwright/test';

// `*.e2e.ts` suffix keeps these specs out of the repo's `bun test` discovery.
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.e2e.ts',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  // Sequential, single browser session — no parallel windows / tab flicker.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    headless: false,
    // Staging's `load` event can be slow; absorb spikes without failing.
    navigationTimeout: 60_000,
    actionTimeout: 20_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },
});
