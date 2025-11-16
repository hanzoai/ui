import { test } from '@playwright/test'

test('Capture blocks page with loading previews', async ({ page }) => {
  console.log('📸 Capturing blocks page with loaded previews...\n')

  // Set viewport to desktop size
  await page.setViewportSize({ width: 1920, height: 1080 })

  // Navigate to blocks page
  await page.goto('http://localhost:3333/blocks', {
    waitUntil: 'domcontentloaded'
  })

  // Wait for iframes to be present
  await page.waitForSelector('iframe', { timeout: 10000 })
  console.log('✅ Iframes detected')

  // Wait a bit for content to load
  await page.waitForTimeout(4000)
  console.log('✅ Waiting for content to load...')

  // Take full page screenshot
  await page.screenshot({
    path: 'tests/blocks-with-previews-FULL.png',
    fullPage: true
  })
  console.log('📸 Full page screenshot saved: blocks-with-previews-FULL.png')

  // Take viewport screenshot (what you see without scrolling)
  await page.screenshot({
    path: 'tests/blocks-with-previews-VIEWPORT.png',
    fullPage: false
  })
  console.log('📸 Viewport screenshot saved: blocks-with-previews-VIEWPORT.png')

  // Scroll to middle and capture
  await page.evaluate(() => window.scrollTo(0, 800))
  await page.waitForTimeout(1000)
  await page.screenshot({
    path: 'tests/blocks-with-previews-MIDDLE.png',
    fullPage: false
  })
  console.log('📸 Middle section screenshot saved: blocks-with-previews-MIDDLE.png')

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1000)
  await page.screenshot({
    path: 'tests/blocks-with-previews-BOTTOM.png',
    fullPage: false
  })
  console.log('📸 Bottom section screenshot saved: blocks-with-previews-BOTTOM.png')

  // Get count of loaded iframes
  const iframes = await page.locator('iframe').all()
  console.log(`\n✅ ${iframes.length} block previews captured`)

  console.log('\n📁 Screenshots saved in tests/ directory:')
  console.log('  • blocks-with-previews-FULL.png (complete page)')
  console.log('  • blocks-with-previews-VIEWPORT.png (above the fold)')
  console.log('  • blocks-with-previews-MIDDLE.png (middle section)')
  console.log('  • blocks-with-previews-BOTTOM.png (bottom section)')
})