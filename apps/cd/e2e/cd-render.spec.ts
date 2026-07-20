/**
 * e2e: Hanzo CD — mocked-network render + RESPONSIVE proof.
 *
 * Serves the built static SPA; mocks the cloud CD plane (`/v1/deploy/*`) with
 * real-shaped `clients/deploy` rows + a session cookie so the app renders the
 * fleet. Proves: the fleet renders on the shared @hanzo/gitops `GitopsAppList`, a
 * row opens the ArgoCD-grade detail (sync panel + resource topology), and — the
 * CTO requirement — the body never scrolls horizontally at a 390px viewport.
 * Screenshots at desktop (1440) and mobile (390).
 */
import { test, expect, type Route, type Page, type BrowserContext } from "@playwright/test"
import { mkdirSync } from "node:fs"
import { join } from "node:path"

const SHOTS = join(process.cwd(), "e2e-shots")

const FLEET = {
  applications: [
    { name: "cloud", namespace: "hanzo", env: "main", repository: "ghcr.io/hanzoai/cloud", version: "v1.800.1", runningVersion: "v1.800.1", health: "healthy", sync: "synced", phase: "Running" },
    { name: "iam", namespace: "hanzo", env: "main", repository: "ghcr.io/hanzoai/iam", version: "v1.4.11", runningVersion: "v1.4.10", health: "progressing", healthMessage: "rolling update (1/2)", sync: "out-of-sync", phase: "Running", revisions: ["v1.4.10", "v1.4.9"] },
    { name: "gateway", namespace: "hanzo", env: "main", repository: "ghcr.io/hanzoai/gateway", version: "v2.16.4", runningVersion: "v2.16.4", health: "healthy", sync: "synced", phase: "Running" },
    { name: "o11y", namespace: "hanzo", env: "test", repository: "ghcr.io/hanzoai/o11y", version: "v1.5.12", runningVersion: "v1.5.10", health: "degraded", healthMessage: "CrashLoopBackOff", sync: "out-of-sync", phase: "Degraded" },
  ],
  summary: { total: 4, healthy: 2, degraded: 1, outOfSync: 2 },
}
const TREE = {
  application: FLEET.applications[1],
  nodes: [
    { group: "hanzo.ai", version: "v1", kind: "App", namespace: "hanzo", name: "iam", ref: "hanzo.ai:App:hanzo:iam", uid: "u1", health: "progressing", parentRefs: [] },
    { group: "apps", version: "v1", kind: "Deployment", namespace: "hanzo", name: "iam", ref: "apps:Deployment:hanzo:iam", uid: "u2", health: "progressing", parentRefs: [{ ref: "hanzo.ai:App:hanzo:iam" }] },
    { group: "apps", version: "v1", kind: "ReplicaSet", namespace: "hanzo", name: "iam-6d8f", ref: "apps:ReplicaSet:hanzo:iam-6d8f", uid: "u3", health: "healthy", parentRefs: [{ ref: "apps:Deployment:hanzo:iam" }] },
    { group: "", version: "v1", kind: "Pod", namespace: "hanzo", name: "iam-6d8f-abc", ref: ":Pod:hanzo:iam-6d8f-abc", uid: "u4", health: "healthy", parentRefs: [{ ref: "apps:ReplicaSet:hanzo:iam-6d8f" }] },
  ],
}
const RESOURCE = { ref: "apps:Deployment:hanzo:iam", health: "healthy", liveManifest: { apiVersion: "apps/v1", kind: "Deployment", metadata: { name: "iam" }, spec: { replicas: 2 } }, desiredSource: "last-applied", diff: { modified: false } }
const LOGS = { application: "hanzo/iam", pod: "iam-6d8f-abc", logs: "listening on :8080\nready to serve\n" }

async function mock(route: Route) {
  const p = new URL(route.request().url()).pathname
  const json = (b: unknown) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b) })
  if (p === "/v1/deploy/applications") return json(FLEET)
  if (/^\/v1\/deploy\/[^/]+\/tree$/.test(p)) return json(TREE)
  if (/^\/v1\/deploy\/[^/]+\/resource\//.test(p)) return json(RESOURCE)
  if (/^\/v1\/deploy\/[^/]+\/logs$/.test(p)) return json(LOGS)
  if (p.startsWith("/v1/deploy/")) return json({ ok: true })
  return route.continue()
}

async function open(ctx: BrowserContext): Promise<Page> {
  // The PKCE login sets `hanzo_iam_token`; seed it so the SPA renders the dashboard.
  await ctx.addCookies([{ name: "hanzo_iam_token", value: "e.y.j", url: "http://localhost:4173" }])
  const page = await ctx.newPage()
  await page.route("**/*", mock)
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.locator("text=Fleet").first().waitFor({ timeout: 15_000 })
  return page
}

test.beforeAll(() => mkdirSync(SHOTS, { recursive: true }))

test("renders the fleet, opens a row → ArgoCD-grade detail (desktop)", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await open(ctx)

  await expect(page.locator("text=Applications").first()).toBeVisible()
  await expect(page.locator("tr", { hasText: "iam" }).first()).toBeVisible()
  // sync fold: the hyphenated cloud verdict renders OutOfSync (not Unknown).
  await expect(page.locator("text=OutOfSync").first()).toBeVisible()
  await page.screenshot({ path: join(SHOTS, "cd-fleet-desktop.png"), fullPage: true })

  // Tap the app's NAME cell (always visible; the row overflows on narrow tables).
  await page.locator(".hz-gitops-row", { hasText: "iam" }).first().locator("td").first().click()
  await expect(page.getByText("← Fleet").first()).toBeVisible({ timeout: 10_000 }) // detail-only breadcrumb
  await expect(page.locator(".hz-gitops-tree-world").first()).toBeVisible({ timeout: 10_000 })
  await expect(page.locator("text=Deployment").first()).toBeVisible()
  await page.screenshot({ path: join(SHOTS, "cd-detail-desktop.png"), fullPage: true })
  await ctx.close()
})

test("reflows with no horizontal body scroll at a narrow (mobile) viewport", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await open(ctx)

  await expect(page.locator("tr", { hasText: "iam" }).first()).toBeVisible()
  const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
  expect(overflow.sw, "no horizontal body scroll at 390px").toBeLessThanOrEqual(overflow.cw + 1)
  await page.screenshot({ path: join(SHOTS, "cd-fleet-mobile.png"), fullPage: true })

  // Tap-to-open must work on mobile: tap the name cell → the ArgoCD-grade detail.
  await page.locator(".hz-gitops-row", { hasText: "iam" }).first().locator("td").first().click()
  await expect(page.getByText("← Fleet").first()).toBeVisible({ timeout: 10_000 })
  await expect(page.locator(".hz-gitops-tree-world").first()).toBeVisible({ timeout: 10_000 })
  const overflow2 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
  expect(overflow2.sw, "no horizontal body scroll on the detail at 390px").toBeLessThanOrEqual(overflow2.cw + 1)
  await page.screenshot({ path: join(SHOTS, "cd-detail-mobile.png"), fullPage: true })
  await ctx.close()
})
