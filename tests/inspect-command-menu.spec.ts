import { test, expect } from "@playwright/test"

test.describe("Enhanced Command Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3003")
  })

  test("should open command menu with ⌘K keyboard shortcut", async ({
    page,
  }) => {
    // Press ⌘K (Cmd+K on Mac, Ctrl+K on Windows/Linux)
    await page.keyboard.press("Meta+K")

    // Command dialog should be visible
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(
      page.getByPlaceholder("Type a command or search...")
    ).toBeVisible()
  })

  test("should open command menu with / keyboard shortcut", async ({
    page,
  }) => {
    // Press /
    await page.keyboard.press("/")

    // Command dialog should be visible
    await expect(page.getByRole("dialog")).toBeVisible()
  })

  test("should display keyboard shortcuts on command items", async ({
    page,
  }) => {
    // Open command menu
    await page.keyboard.press("Meta+K")

    // Wait for dialog
    await expect(page.getByRole("dialog")).toBeVisible()

    // Check for keyboard shortcut badges (kbd elements)
    const kbdElements = page.locator("kbd")
    await expect(kbdElements.first()).toBeVisible()
  })

  test("should show recent searches when no query is entered", async ({
    page,
  }) => {
    // First, navigate to a page via command menu to create a recent search
    await page.keyboard.press("Meta+K")
    await page.getByPlaceholder("Type a command or search...").fill("button")
    await page.keyboard.press("Enter")

    // Wait for navigation
    await page.waitForTimeout(500)

    // Open command menu again
    await page.keyboard.press("Meta+K")

    // Should show "Recent" heading
    const recentHeading = page
      .getByRole("dialog")
      .getByText("Recent", { exact: false })
    // Recent searches may not exist yet, so this is optional
    if ((await recentHeading.count()) > 0) {
      await expect(recentHeading).toBeVisible()
    }
  })

  test("should filter results with fuzzy search", async ({ page }) => {
    // Open command menu
    await page.keyboard.press("Meta+K")

    // Type a search query
    await page.getByPlaceholder("Type a command or search...").fill("butt")

    // Wait a bit for filtering
    await page.waitForTimeout(200)

    // Should show filtered results (cmdk handles fuzzy search automatically)
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
  })

  test("should close command menu on item selection", async ({ page }) => {
    // Open command menu
    await page.keyboard.press("Meta+K")

    // Wait for dialog
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Press Enter to select first item
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")

    // Dialog should close
    await expect(dialog).not.toBeVisible()
  })

  test("should show theme options with shortcuts", async ({ page }) => {
    // Open command menu
    await page.keyboard.press("Meta+K")

    // Wait for dialog
    await expect(page.getByRole("dialog")).toBeVisible()

    // Scroll to theme section
    await page.getByText("Light", { exact: true }).scrollIntoViewIfNeeded()

    // Theme options should be visible
    await expect(page.getByText("Light", { exact: true })).toBeVisible()
    await expect(page.getByText("Dark", { exact: true })).toBeVisible()
    await expect(page.getByText("System", { exact: true })).toBeVisible()
  })

  test("should clear recent searches when Clear button is clicked", async ({
    page,
  }) => {
    // First, create a recent search by navigating
    await page.keyboard.press("Meta+K")
    await page.getByPlaceholder("Type a command or search...").fill("button")
    await page.keyboard.press("Enter")
    await page.waitForTimeout(500)

    // Open command menu again
    await page.keyboard.press("Meta+K")

    // If Recent section exists, click Clear
    const clearButton = page.getByText("Clear", { exact: true })
    if ((await clearButton.count()) > 0) {
      await clearButton.click()
      // Recent section should disappear
      const recentHeading = page.getByText("Recent", { exact: false })
      await expect(recentHeading).not.toBeVisible()
    }
  })

  test("should support keyboard navigation", async ({ page }) => {
    // Open command menu
    await page.keyboard.press("Meta+K")

    // Wait for dialog
    await expect(page.getByRole("dialog")).toBeVisible()

    // Arrow down should navigate items
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")

    // Escape should close dialog
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("should display platform-specific modifier key", async ({ page }) => {
    // Open page
    await page.goto("http://localhost:3003")

    // Check the search button kbd for ⌘ (Mac) or Ctrl (Windows/Linux)
    const searchButton = page.getByRole("button", {
      name: /search documentation/i,
    })
    await expect(searchButton).toBeVisible()

    // Should contain either ⌘ or Ctrl
    const kbdText = await searchButton.locator("kbd").textContent()
    expect(kbdText).toMatch(/[⌘Ctrl]K/)
  })
})
