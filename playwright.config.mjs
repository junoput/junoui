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
  // The `-linux` baselines are authored on the CI runner (ubuntu-24.04, pinned
  // in ci.yml / visual-baselines.yml — that pin is what keeps them stable).
  //
  // A LINUX DEV BOX IS NOT A VALID CHECK ENV for these baselines, and since the
  // pixel budget went to zero (below) that is now loud rather than quiet: a
  // devbox with a different freetype diffs 64-3387 px on ~2/3 of the pages, and
  // ±1px of page height on the tallest one, purely from text rendering. Do not
  // "fix" that by re-recording locally — record on the runner
  // (`gh workflow run visual-baselines.yml`) and commit the artifact. See
  // 20260803-001. To iterate locally, record a throwaway local baseline set
  // first and diff against THAT; the committed ones are CI's.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}-{platform}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'line' : 'list',
  expect: {
    // ── Pixel budget: ZERO, absolute. Measured, not chosen by taste. ────────
    //
    // This used to be `maxDiffPixelRatio: 0.01`. A ratio is the wrong shape for
    // this suite: the failure mode is a LOCALIZED change, whose footprint is an
    // absolute area, while a ratio scales the budget with the page. The tallest
    // showcase shot is 1280x2322 = 2.97M px, so 1% bought a ~29,700-px licence
    // to change anything. Measured against locally-recorded baselines on
    // 2026-08-15 (record env == check env, so the only variable is the patch):
    //
    //   - .juno-btn border-radius 4px -> 8px, i.e. every button in the system:
    //     28 snapshots moved, WORST 66 px, median ~14 px. Under 1% by ~450x.
    //   - the shipped bottom sheet (20260802-019: rounded top corners + grab
    //     handle + safe-area move), reconstructed as a patch: 6291 px dark /
    //     6319 px light on a 1280x900 viewport shot = ratio 0.0055. A whole
    //     component restyle, still UNDER a 1% budget.
    //   - 20260815-011's own proposal of `maxDiffPixels: 100` was rejected on
    //     these numbers: it swallows the button-radius case (worst 66 px).
    //
    // What zero costs: nothing measurable. With the record env equal to the
    // check env the suite diffs exactly 0 px — 48/48 locally at this budget,
    // and two independent ubuntu-24.04 recordings (runs 31864534781 /
    // 31864682018) are byte-identical to each other and to the committed
    // baselines. Sub-threshold rendering noise is absorbed BEFORE this budget
    // by Playwright's per-pixel `threshold` (default 0.2), which is untouched.
    // When the envs differ the drift is 64-3387 px on this dev box, i.e. no
    // small cushion would have saved it either — the fix for that is the
    // ubuntu-24.04 pin in ci.yml / visual-baselines.yml (20260803-001), not a
    // looser budget.
    //
    // If CI ever does show a genuine stray pixel, put a budget on THAT case,
    // not back here.
    toHaveScreenshot: { animations: 'disabled', maxDiffPixels: 0, maxDiffPixelRatio: 0 },
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
