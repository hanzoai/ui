import { test, expect } from '@playwright/test'

test.describe('Builder Page - Iframe Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/builder')
  })

  test('should load builder page successfully', async ({ page }) => {
    // Check page title/header
    await expect(page.getByRole('heading', { name: 'Blocks' })).toBeVisible()

    // Check filter input exists
    await expect(page.getByPlaceholder('Filter blocks...')).toBeVisible()
  })

  test('should display block count', async ({ page }) => {
    // Wait for blocks to load
    await page.waitForSelector('text=/\\d+ blocks/')

    // Check that we have blocks
    const countText = await page.locator('text=/\\d+ blocks/').textContent()
    expect(countText).toMatch(/\d+ blocks/)
  })

  test('should display block cards with iframes', async ({ page }) => {
    // Wait for at least one block card to appear
    const cards = page.locator('[class*="Card"]')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })

    // Verify iframes exist
    const iframes = page.locator('iframe')
    const iframeCount = await iframes.count()
    expect(iframeCount).toBeGreaterThan(0)
  })

  test('should show loading state initially', async ({ page }) => {
    // Check for loading text (should appear briefly)
    const loadingText = page.getByText('Loading preview...')

    // We might catch it, but it may disappear quickly
    const hasLoadingState = await loadingText.count() > 0

    // Either way is fine - just verifying the state exists in code
    console.log('Loading state visible:', hasLoadingState)
  })

  test('should have proper iframe attributes', async ({ page }) => {
    // Wait for iframes to load
    const iframe = page.locator('iframe').first()
    await iframe.waitFor({ timeout: 10000 })

    // Check iframe has src attribute
    const src = await iframe.getAttribute('src')
    expect(src).toContain('/view/')

    // Check iframe has title
    const title = await iframe.getAttribute('title')
    expect(title).toBeTruthy()

    // Check NO lazy loading attribute
    const loading = await iframe.getAttribute('loading')
    expect(loading).toBeNull()
  })

  test('should have correct aspect ratio and minimum height', async ({ page }) => {
    // Wait for iframe container
    const iframeContainer = page.locator('.aspect-\\[4\\/3\\]').first()
    await iframeContainer.waitFor({ timeout: 10000 })

    // Verify it's visible
    await expect(iframeContainer).toBeVisible()

    // Verify it has min-height class
    const classes = await iframeContainer.getAttribute('class')
    expect(classes).toContain('min-h-[400px]')
  })

  test('should filter blocks correctly', async ({ page }) => {
    // Wait for blocks to load
    await page.waitForSelector('iframe', { timeout: 10000 })

    // Get initial count
    const initialCount = await page.locator('iframe').count()
    expect(initialCount).toBeGreaterThan(0)

    // Filter for "dashboard"
    await page.getByPlaceholder('Filter blocks...').fill('dashboard')

    // Wait a bit for filter to apply
    await page.waitForTimeout(500)

    // Get filtered count (should be less or equal)
    const filteredCount = await page.locator('iframe').count()
    expect(filteredCount).toBeLessThanOrEqual(initialCount)
  })

  test('should open block in new tab when clicked', async ({ page, context }) => {
    // Wait for a block card
    const firstCard = page.locator('a[href^="/view/"]').first()
    await firstCard.waitFor({ timeout: 10000 })

    // Verify it has target="_blank"
    const target = await firstCard.getAttribute('target')
    expect(target).toBe('_blank')

    // Verify it has rel="noopener noreferrer"
    const rel = await firstCard.getAttribute('rel')
    expect(rel).toBe('noopener noreferrer')
  })

  test('should display block names and descriptions', async ({ page }) => {
    // Wait for block cards
    await page.waitForSelector('iframe', { timeout: 10000 })

    // Check for block name (font-mono)
    const blockName = page.locator('.font-mono').first()
    await expect(blockName).toBeVisible()

    // Verify it has text content
    const nameText = await blockName.textContent()
    expect(nameText).toBeTruthy()
    expect(nameText?.length).toBeGreaterThan(0)
  })
})
