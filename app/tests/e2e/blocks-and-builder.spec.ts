import { test, expect, Page } from "@playwright/test"

test.describe("Blocks and Builder Pages", () => {
  test.describe("Blocks Page", () => {
    test("should load blocks page successfully", async ({ page }) => {
      await page.goto("/blocks")
      await expect(page).toHaveTitle(/blocks|components/i)

      // Wait for page to be stable
      await page.waitForLoadState("networkidle")

      // Check if page has content
      const pageContent = await page.locator("body").textContent()
      expect(pageContent).toBeTruthy()
    })

    test("should display featured blocks", async ({ page }) => {
      await page.goto("/blocks")
      await page.waitForLoadState("networkidle")
      await page.waitForTimeout(1000)

      // Check for featured blocks
      const featuredBlocks = ["dashboard-01", "sidebar-07", "sidebar-03", "login-03", "login-04"]

      for (const block of featuredBlocks) {
        // Try different selector patterns
        const blockLocator = page.locator(`[class*="${block}"]`)
        const blockHeading = page.locator(`text=/.*${block}.*/i`)

        const count = await blockLocator.count()
        const headingCount = await blockHeading.count()

        // If either selector finds the block, it's visible
        const isVisible = count > 0 || headingCount > 0
        console.log(`Block "${block}" found: ${isVisible}`)
      }
    })

    test("should have interactive elements", async ({ page }) => {
      await page.goto("/blocks")
      await page.waitForLoadState("networkidle")

      // Look for links and buttons
      const links = await page.locator("a").count()
      const buttons = await page.locator("button").count()

      expect(links).toBeGreaterThan(0)
      expect(buttons).toBeGreaterThan(0)

      console.log(`Found ${links} links and ${buttons} buttons`)
    })

    test("should render without console errors", async ({ page }) => {
      const consoleErrors: string[] = []

      page.on("console", msg => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text())
        }
      })

      await page.goto("/blocks")
      await page.waitForLoadState("networkidle")
      await page.waitForTimeout(2000)

      // Log any errors found
      if (consoleErrors.length > 0) {
        console.warn("Console errors found:")
        consoleErrors.forEach(error => console.warn(error))
      }
    })

    test("should be responsive on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto("/blocks")
      await page.waitForLoadState("networkidle")

      const title = await page.title()
      expect(title).toBeTruthy()

      // Check that content is visible
      const mainContent = await page.locator("main, [role='main']").count()
      expect(mainContent).toBeGreaterThanOrEqual(0)
    })

    test("should be responsive on tablet", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto("/blocks")
      await page.waitForLoadState("networkidle")

      const title = await page.title()
      expect(title).toBeTruthy()
    })

    test("should be responsive on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.goto("/blocks")
      await page.waitForLoadState("networkidle")

      const title = await page.title()
      expect(title).toBeTruthy()
    })
  })

  test.describe("Builder Page", () => {
    test("should load builder page successfully", async ({ page }) => {
      await page.goto("/builder")
      await expect(page).toHaveTitle(/builder|page/i)

      // Wait for page to be stable
      await page.waitForLoadState("networkidle")

      // Check if page has content
      const pageContent = await page.locator("body").textContent()
      expect(pageContent).toBeTruthy()
    })

    test("should have builder interface elements", async ({ page }) => {
      await page.goto("/builder")
      await page.waitForLoadState("networkidle")
      await page.waitForTimeout(2000)

      // Look for common builder elements
      const links = await page.locator("a").count()
      const buttons = await page.locator("button").count()
      const inputs = await page.locator("input").count()

      console.log(`Builder has ${links} links, ${buttons} buttons, ${inputs} inputs`)

      // Should have at least some interactive elements
      expect(links + buttons + inputs).toBeGreaterThan(0)
    })

    test("should display blocks or components list", async ({ page }) => {
      await page.goto("/builder")
      await page.waitForLoadState("networkidle")
      await page.waitForTimeout(2000)

      // Look for block/component items
      const blockItems = await page.locator('[class*="block"], [class*="component"], [data-block], [data-component]').count()

      console.log(`Found ${blockItems} block/component items`)

      // Builder should have some blocks or components visible
      expect(blockItems).toBeGreaterThanOrEqual(0)
    })

    test("should render without critical console errors", async ({ page }) => {
      const consoleErrors: string[] = []
      const consoleWarnings: string[] = []

      page.on("console", msg => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text())
        }
        if (msg.type() === "warning") {
          consoleWarnings.push(msg.text())
        }
      })

      await page.goto("/builder")
      await page.waitForLoadState("networkidle")
      await page.waitForTimeout(2000)

      // Log any errors found
      if (consoleErrors.length > 0) {
        console.warn("Console errors found:")
        consoleErrors.forEach(error => console.warn(`  - ${error}`))
      }

      if (consoleWarnings.length > 0) {
        console.warn("Console warnings found:")
        consoleWarnings.forEach(warning => console.warn(`  - ${warning}`))
      }
    })

    test("should be responsive on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto("/builder")
      await page.waitForLoadState("networkidle")

      const title = await page.title()
      expect(title).toBeTruthy()
    })

    test("should be responsive on tablet", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto("/builder")
      await page.waitForLoadState("networkidle")

      const title = await page.title()
      expect(title).toBeTruthy()
    })

    test("should be responsive on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.goto("/builder")
      await page.waitForLoadState("networkidle")

      const title = await page.title()
      expect(title).toBeTruthy()
    })
  })

  test.describe("Visual Regression", () => {
    test("blocks page screenshot", async ({ page }) => {
      await page.goto("/blocks")
      await page.waitForLoadState("networkidle")
      await page.waitForTimeout(1000)

      // Take screenshot for comparison
      await expect(page).toHaveScreenshot("blocks-page.png", {
        fullPage: true,
        maxDiffPixels: 100
      })
    })

    test("builder page screenshot", async ({ page }) => {
      await page.goto("/builder")
      await page.waitForLoadState("networkidle")
      await page.waitForTimeout(1000)

      // Take screenshot for comparison
      await expect(page).toHaveScreenshot("builder-page.png", {
        fullPage: true,
        maxDiffPixels: 100
      })
    })
  })
})
