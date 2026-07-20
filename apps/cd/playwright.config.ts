import { defineConfig, devices } from "@playwright/test"

/**
 * Hanzo CD render + responsive proof. Builds the static SPA and serves it (vite
 * preview), then the spec mocks `/v1/deploy/*` + a session cookie and asserts the
 * fleet renders, a row opens the ArgoCD-grade detail (sync panel + resource tree),
 * and the body never scrolls horizontally at 390px. Screenshots per width.
 *
 *   pnpm --filter cd exec playwright test        # builds + serves + runs
 *   BASE_URL=https://cd.hanzo.ai pnpm … test     # against a live deploy
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 1,
  workers: 1,
  reporter: "list",
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:4173", headless: true },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npx vite build && npx vite preview --port 4173 --strictPort",
        url: "http://localhost:4173",
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
