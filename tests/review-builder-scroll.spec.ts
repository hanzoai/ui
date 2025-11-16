import { test, expect } from '@playwright/test'

test('Review builder page with scrolling screenshots', async ({ page }) => {
  console.log('\n🔍 BUILDER PAGE REVIEW TEST')
  console.log('='.repeat(60))

  // Navigate to builder page
  await page.goto('http://localhost:3333/builder', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  })

  // Wait for blocks to load
  await page.waitForSelector('iframe', { timeout: 10000 })
  await page.waitForTimeout(3000) // Let iframes load

  console.log('\n📸 Capturing screenshots at different scroll positions...\n')

  // 1. Top of page
  await page.screenshot({
    path: 'tests/review-builder-top.png',
    fullPage: false
  })
  console.log('✓ Captured: review-builder-top.png')

  // 2. Scroll down 500px
  await page.evaluate(() => window.scrollBy(0, 500))
  await page.waitForTimeout(500)
  await page.screenshot({
    path: 'tests/review-builder-scroll-500.png',
    fullPage: false
  })
  console.log('✓ Captured: review-builder-scroll-500.png')

  // 3. Scroll down 1000px (total 1500px)
  await page.evaluate(() => window.scrollBy(0, 1000))
  await page.waitForTimeout(500)
  await page.screenshot({
    path: 'tests/review-builder-scroll-1500.png',
    fullPage: false
  })
  console.log('✓ Captured: review-builder-scroll-1500.png')

  // 4. Scroll down another 1000px (total 2500px)
  await page.evaluate(() => window.scrollBy(0, 1000))
  await page.waitForTimeout(500)
  await page.screenshot({
    path: 'tests/review-builder-scroll-2500.png',
    fullPage: false
  })
  console.log('✓ Captured: review-builder-scroll-2500.png')

  // 5. Scroll to middle
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
  await page.waitForTimeout(500)
  await page.screenshot({
    path: 'tests/review-builder-middle.png',
    fullPage: false
  })
  console.log('✓ Captured: review-builder-middle.png')

  // 6. Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  await page.screenshot({
    path: 'tests/review-builder-bottom.png',
    fullPage: false
  })
  console.log('✓ Captured: review-builder-bottom.png')

  // 7. Full page screenshot
  await page.screenshot({
    path: 'tests/review-builder-FULL.png',
    fullPage: true
  })
  console.log('✓ Captured: review-builder-FULL.png (complete page)')

  // Get count of blocks
  const blockCount = await page.locator('iframe').count()
  const headerText = await page.locator('h1').textContent()
  const countText = await page.locator('text=/\\d+ blocks/').textContent()

  console.log('\n' + '='.repeat(60))
  console.log('📊 PAGE ANALYSIS:')
  console.log('='.repeat(60))
  console.log(`Header: ${headerText}`)
  console.log(`Count Display: ${countText}`)
  console.log(`Actual Iframes: ${blockCount}`)
  console.log('\n✅ All screenshots captured in tests/ directory')
  console.log('='.repeat(60))

  expect(blockCount).toBeGreaterThanOrEqual(80)
})
