// ════════════════════════════════════════════════════════════════════════
//  junoui — visual-regression config (Playwright)
// ════════════════════════════════════════════════════════════════════════
//  Snapshots every showcase page in dark + light. Catches unintended visual
//  shifts — a token edit can ripple through the whole CSS layer. Kept SEPARATE
//  from the node:test integrity suite (`npm test`); run with:
//
//      npm run test:visual           compare against committed baselines
//      npm run test:visual:update    re-record baselines (after intended change)
//
//  CSS animations are frozen and JS-updated widgets (clock, progress) are masked
//  so snapshots stay deterministic. Baselines are committed under
//  test/visual/__screenshots__.
// ════════════════════════════════════════════════════════════════════════

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/visual',
  // platform-scoped: font rendering differs across OSes, so darwin and linux
  // baselines coexist. Regenerate per-OS with `npm run test:visual:update`.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}-{platform}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'line' : 'list',
  expect: {
    // freeze CSS animations/transitions; allow a tiny AA-rendering tolerance
    toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.01 },
  },
  use: {
    baseURL: 'http://localhost:8137',
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run showcase',
    url: 'http://localhost:8137/showcase/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
