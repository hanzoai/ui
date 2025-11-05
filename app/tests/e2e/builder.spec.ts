import { expect, test, type Page } from "@playwright/test"

test.describe("Page Builder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3333/builder/")
    await page.waitForLoadState("networkidle")
  })

  test("should load builder interface with all sections", async ({ page }) => {
    // Check main sections are visible
    await expect(page.getByText("Component Library")).toBeVisible()
    await expect(page.getByText("Page Builder")).toBeVisible()

    // Check tabs
    await expect(page.getByRole("tab", { name: "Blocks" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Components" })).toBeVisible()

    // Check viewport controls
    await expect(page.getByRole("button", { name: "Mobile" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Tablet" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Desktop" })).toBeVisible()

    // Check action buttons
    await expect(page.getByRole("button", { name: "Copy Code" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Download" })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Deploy with Hanzo" })
    ).toBeVisible()
  })

  test("should display blocks with visual previews", async ({ page }) => {
    // Switch to Blocks tab (should be default)
    await page.getByRole("tab", { name: "Blocks" }).click()

    // Wait for blocks to load
    await page.waitForSelector("text=newsletter-01", { timeout: 10000 })

    // Check that blocks are visible
    const blocks = ["newsletter-01", "dashboard-01", "sidebar-01"]
    for (const block of blocks) {
      const blockCard = page.locator(`text=${block}`).first()
      await expect(blockCard).toBeVisible()
    }

    // Take screenshot of blocks library
    await page.screenshot({
      path: "tests/screenshots/builder-blocks-library.png",
      fullPage: true,
    })
  })

  test("should display components with categories", async ({ page }) => {
    // Switch to Components tab
    await page.getByRole("tab", { name: "Components" }).click()
    await page.waitForTimeout(500)

    // Check that components are visible
    await expect(page.getByText("button")).toBeVisible()
    await expect(page.getByText("card")).toBeVisible()

    // Take screenshot
    await page.screenshot({
      path: "tests/screenshots/builder-components-library.png",
      fullPage: true,
    })
  })

  test("should filter blocks by search", async ({ page }) => {
    await page.getByRole("tab", { name: "Blocks" }).click()

    // Type in filter
    const filterInput = page.getByPlaceholder("Filter blocks...")
    await filterInput.fill("newsletter")
    await page.waitForTimeout(300)

    // Should show newsletter blocks
    await expect(page.getByText("newsletter-01")).toBeVisible()
    await expect(page.getByText("newsletter-02")).toBeVisible()

    // Should NOT show dashboard blocks
    await expect(page.getByText("dashboard-01")).not.toBeVisible()
  })

  test("should add blocks to canvas", async ({ page }) => {
    await page.getByRole("tab", { name: "Blocks" }).click()
    await page.waitForTimeout(500)

    // Click on a block to add it
    const newsletterBlock = page.locator("text=newsletter-01").first()
    await newsletterBlock.click()
    await page.waitForTimeout(1000)

    // Check that it appears in the canvas
    await expect(page.getByText("3 items in page")).toBeVisible()

    // Take screenshot
    await page.screenshot({
      path: "tests/screenshots/builder-with-block.png",
      fullPage: true,
    })
  })

  test("should add container and customize it", async ({ page }) => {
    // Click Add Container button
    await page.getByRole("button", { name: "Add Container" }).click()
    await page.waitForTimeout(500)

    // Check container appeared
    await expect(page.getByText("Container (div) - flex")).toBeVisible()

    // Click on container to select it
    await page.getByText("Container (div) - flex").click()
    await page.waitForTimeout(500)

    // Property editor should appear
    await expect(page.getByText("Properties")).toBeVisible()
    await expect(page.getByText("Container Settings")).toBeVisible()

    // Take screenshot
    await page.screenshot({
      path: "tests/screenshots/builder-container-properties.png",
      fullPage: true,
    })
  })

  test("should switch viewport sizes", async ({ page }) => {
    // Add a block first
    await page.getByRole("tab", { name: "Blocks" }).click()
    await page.locator("text=newsletter-01").first().click()
    await page.waitForTimeout(1000)

    // Test Desktop (default)
    const canvas = page.locator(".min-h-\\[600px\\]").first()
    await expect(canvas).toBeVisible()
    await page.screenshot({
      path: "tests/screenshots/builder-viewport-desktop.png",
      fullPage: false,
      clip: { x: 280, y: 100, width: 1000, height: 600 },
    })

    // Switch to Tablet
    await page.getByRole("button", { name: "Tablet" }).click()
    await page.waitForTimeout(500)
    await page.screenshot({
      path: "tests/screenshots/builder-viewport-tablet.png",
      fullPage: false,
      clip: { x: 280, y: 100, width: 800, height: 600 },
    })

    // Switch to Mobile
    await page.getByRole("button", { name: "Mobile" }).click()
    await page.waitForTimeout(500)
    await page.screenshot({
      path: "tests/screenshots/builder-viewport-mobile.png",
      fullPage: false,
      clip: { x: 280, y: 100, width: 600, height: 600 },
    })
  })

  test("should generate and copy code", async ({ page }) => {
    // Add some blocks
    await page.getByRole("tab", { name: "Blocks" }).click()
    await page.locator("text=newsletter-01").first().click()
    await page.waitForTimeout(500)
    await page.locator("text=dashboard-01").first().click()
    await page.waitForTimeout(500)

    // Grant clipboard permissions
    await page.context().grantPermissions(["clipboard-write", "clipboard-read"])

    // Click Copy Code
    await page.getByRole("button", { name: "Copy Code" }).click()
    await page.waitForTimeout(500)

    // Verify clipboard has code (basic check)
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    )
    expect(clipboardText).toContain("use client")
    expect(clipboardText).toContain("export default function CustomPage")
    expect(clipboardText).toContain("Newsletter01")
    expect(clipboardText).toContain("Dashboard01")
  })

  test("should drag and reorder items in canvas", async ({ page }) => {
    // Add multiple blocks
    await page.getByRole("tab", { name: "Blocks" }).click()
    await page.locator("text=newsletter-01").first().click()
    await page.waitForTimeout(500)
    await page.locator("text=newsletter-02").first().click()
    await page.waitForTimeout(500)
    await page.locator("text=newsletter-03").first().click()
    await page.waitForTimeout(1000)

    // Find drag handles (GripVertical icons)
    const dragHandles = page
      .locator("button")
      .filter({ has: page.locator("svg") })
    const firstHandle = dragHandles.first()
    const secondHandle = dragHandles.nth(1)

    // Get positions
    const firstBox = await firstHandle.boundingBox()
    const secondBox = await secondHandle.boundingBox()

    if (firstBox && secondBox) {
      // Drag first item down
      await page.mouse.move(firstBox.x + 10, firstBox.y + 10)
      await page.mouse.down()
      await page.mouse.move(secondBox.x + 10, secondBox.y + 10, { steps: 10 })
      await page.mouse.up()
      await page.waitForTimeout(500)

      // Take screenshot
      await page.screenshot({
        path: "tests/screenshots/builder-after-reorder.png",
        fullPage: true,
      })
    }
  })

  test("should work on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("http://localhost:3333/builder/")
    await page.waitForLoadState("networkidle")

    // Mobile should still be functional
    await expect(page.getByText("Component Library")).toBeVisible()

    // Take mobile screenshot
    await page.screenshot({
      path: "tests/screenshots/builder-mobile-view.png",
      fullPage: true,
    })
  })

  test("should work on tablet viewport", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto("http://localhost:3333/builder/")
    await page.waitForLoadState("networkidle")

    // Tablet should be functional
    await expect(page.getByText("Component Library")).toBeVisible()

    // Take tablet screenshot
    await page.screenshot({
      path: "tests/screenshots/builder-tablet-view.png",
      fullPage: true,
    })
  })

  test("should build complete landing page", async ({ page }) => {
    // Build a full landing page with multiple sections
    await page.getByRole("tab", { name: "Blocks" }).click()

    // Add header/navigation
    await page.locator("text=sidebar-01").first().click()
    await page.waitForTimeout(500)

    // Add hero section
    await page.locator("text=dashboard-01").first().click()
    await page.waitForTimeout(500)

    // Add features section
    await page.getByRole("button", { name: "Add Container" }).click()
    await page.waitForTimeout(500)

    // Add newsletter signup
    await page.locator("text=newsletter-01").first().click()
    await page.waitForTimeout(500)

    // Add authentication
    await page.locator("text=login-01").first().click()
    await page.waitForTimeout(1000)

    // Verify page has multiple items
    await expect(page.getByText("items in page")).toBeVisible()

    // Take final screenshot
    await page.screenshot({
      path: "tests/screenshots/builder-complete-landing-page.png",
      fullPage: true,
    })

    // Generate code and verify completeness
    await page.context().grantPermissions(["clipboard-write", "clipboard-read"])
    await page.getByRole("button", { name: "Copy Code" }).click()
    await page.waitForTimeout(500)

    const code = await page.evaluate(() => navigator.clipboard.readText())

    // Verify all sections are in the code
    expect(code).toContain("Sidebar01")
    expect(code).toContain("Dashboard01")
    expect(code).toContain("Newsletter01")
    expect(code).toContain("Login01")
    expect(code).toContain("<div") // Container
  })

  test("should customize component properties", async ({ page }) => {
    // Add a component
    await page.getByRole("tab", { name: "Components" }).click()
    await page.locator("text=button").first().click()
    await page.waitForTimeout(500)

    // Click on the component in canvas to select
    await page.locator(".group.relative").first().click()
    await page.waitForTimeout(500)

    // Property editor should show
    await expect(page.getByText("Component Properties")).toBeVisible()

    // Change variant
    const variantInput = page.getByPlaceholder("e.g. default, outline")
    await variantInput.fill("outline")
    await page.waitForTimeout(300)

    // Change size
    const sizeInput = page.getByPlaceholder("e.g. sm, md, lg")
    await sizeInput.fill("lg")
    await page.waitForTimeout(300)

    // Add custom classes
    const classInput = page.getByPlaceholder("e.g. bg-muted p-8")
    await classInput.fill("bg-primary text-white")
    await page.waitForTimeout(300)

    // Take screenshot
    await page.screenshot({
      path: "tests/screenshots/builder-custom-properties.png",
      fullPage: true,
    })

    // Verify code includes customizations
    await page.context().grantPermissions(["clipboard-write", "clipboard-read"])
    await page.getByRole("button", { name: "Copy Code" }).click()
    await page.waitForTimeout(500)

    const code = await page.evaluate(() => navigator.clipboard.readText())
    expect(code).toContain('variant="outline"')
    expect(code).toContain('size="lg"')
    expect(code).toContain("bg-primary text-white")
  })
})

test.describe("Page Builder - Cross-Device Visual Testing", () => {
  const devices = [
    { name: "Desktop", width: 1920, height: 1080 },
    { name: "Laptop", width: 1366, height: 768 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Mobile", width: 375, height: 667 },
  ]

  for (const device of devices) {
    test(`should render correctly on ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height })
      await page.goto("http://localhost:3333/builder/")
      await page.waitForLoadState("networkidle")

      // Add some content
      await page.getByRole("tab", { name: "Blocks" }).click()
      await page.waitForTimeout(500)
      await page.locator("text=newsletter-01").first().click()
      await page.waitForTimeout(1000)

      // Take screenshot
      await page.screenshot({
        path: `tests/screenshots/builder-${device.name.toLowerCase()}-${device.width}x${device.height}.png`,
        fullPage: true,
      })

      // Verify essential elements are visible
      await expect(page.getByText("Enhanced Page Builder")).toBeVisible()
    })
  }
})
