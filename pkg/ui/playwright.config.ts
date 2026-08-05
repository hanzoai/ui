import { defineConfig, devices } from '@playwright/test'

/**
 * The browser half of the suite. It never starts a dev server of its own: the
 * app under test is built and served by `scripts/consumer-test.mjs`, from a
 * directory outside this repo that installed the packed tarball.
 *
 * Screenshot baselines are only worth having if they are reproducible, so
 * everything that moves on its own is stopped here rather than per test:
 * animations and transitions are frozen by playwright's `animations: 'disabled'`,
 * the caret is hidden, and the device pixel ratio is pinned so a different
 * display cannot rewrite every baseline. `load()` in the spec awaits
 * `document.fonts.ready` — text metrics shift when a face swaps in, and that is
 * the one source of flake the config cannot cover.
 */
export default defineConfig({
  testDir: './test',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: process.env.CONSUMER_URL ?? 'http://localhost:4390',
    deviceScaleFactor: 1,
  },
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      // Anti-aliasing differs by a hair between runs of the same renderer. Zero
      // tolerance produces a suite that fails on its own output, and a suite
      // that fails on its own output gets ignored and then deleted.
      maxDiffPixelRatio: 0.002,
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
