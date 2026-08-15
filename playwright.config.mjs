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
import { PHONE_VIEWPORT } from './test/visual/helpers.mjs';

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
    // What it cost once, on the way in: the committed `-linux` baselines turned
    // out to be a FOSSIL. `--update-snapshots` only rewrites a snapshot that
    // fails, so every past recording kept the previous file whenever the drift
    // stayed under 1% — and it always did. Dropping to zero rewrote 27 of 48 on
    // the first recording: real, accumulated, previously-invisible drift, not a
    // mistake. Two independent recordings agree byte-for-byte at the new budget,
    // and so do two independent check runs. The two JS-driven widgets that made
    // the drift inevitable (a clock and a progress counter, both masked, both
    // sized by their own text) are pinned in helpers.mjs — see pinVolatile().
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
  // ── Two projects, on purpose: the point is that they DIFFER. ─────────────
  //
  // `chromium` is a fine pointer with no touch. Its "phone" cases resize the
  // viewport to 390x844, which changes the width and nothing else —
  // `(pointer: coarse)` never matched, so the whole touch layer (the 44px tap
  // promotion, the 16px input font floor, the hover:none fallbacks) was
  // outside coverage. See 20260815-006.
  //
  // `chromium-coarse` supplies hasTouch + isMobile, which is what makes
  // `(pointer: coarse)` and `(hover: none)` match in Chromium. It is an
  // explicit context rather than a `devices[...]` phone descriptor for two
  // reasons: the iPhone descriptors are WebKit-based (defaultBrowserType
  // 'webkit', a second browser to install), and every phone descriptor carries
  // a deviceScaleFactor of 2-3, which would make its baselines 4-9x the bytes
  // and incomparable with the fine-pointer shot at the same viewport. Holding
  // engine, viewport and scale factor fixed leaves pointer type as the only
  // variable between the two projects.
  //
  // testIgnore splits the snapshot-taking specs between them because
  // snapshotPathTemplate keys on {arg}+{platform} only: two projects shooting
  // the same snapshot name would fight over one baseline file. tap-targets
  // .spec.mjs is in neither ignore list — it takes no screenshots and asserts
  // the per-project numbers.
  projects: [
    {
      name: 'chromium',
      testIgnore: /coarse\.spec\.mjs$/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-coarse',
      testIgnore: /showcase\.spec\.mjs$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: PHONE_VIEWPORT,
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: 'npm run showcase',
    url: 'http://localhost:8137/showcase/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
