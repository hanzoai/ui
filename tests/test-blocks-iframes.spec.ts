import { test, expect } from '@playwright/test'

test('Check blocks page and iframe loading', async ({ page }) => {
  // Track 404 responses
  const notFoundResponses: string[] = []

  page.on('response', response => {
    if (response.status() === 404) {
      notFoundResponses.push(response.url())
      console.log(`❌ 404 Error: ${response.url()}`)
    }
  })

  // Navigate to blocks page
  console.log('📍 Navigating to blocks page...')
  await page.goto('http://localhost:3333/blocks')

  // Wait for the page to load
  await page.waitForLoadState('networkidle')

  // Take a screenshot
  await page.screenshot({
    path: 'tests/blocks-page-full.png',
    fullPage: true
  })
  console.log('📸 Screenshot saved to tests/blocks-page-full.png')

  // Check if blocks are displayed
  const blockContainers = await page.locator('[data-block-display]').count()
  console.log(`🎯 Found ${blockContainers} block containers`)

  // Find all iframes
  const iframes = page.locator('iframe')
  const iframeCount = await iframes.count()
  console.log(`🖼️ Found ${iframeCount} iframes on the page`)

  // Check each iframe's source
  for (let i = 0; i < iframeCount; i++) {
    const iframe = iframes.nth(i)
    const src = await iframe.getAttribute('src')
    console.log(`📌 Iframe ${i + 1} source: ${src}`)

    // Try to check if iframe content loads
    try {
      const frameElement = await iframe.elementHandle()
      if (frameElement) {
        const frame = await frameElement.contentFrame()
        if (frame) {
          // Check if frame has content
          const hasContent = await frame.locator('body').count()
          if (hasContent > 0) {
            console.log(`✅ Iframe ${i + 1} content loaded`)
          } else {
            console.log(`⚠️ Iframe ${i + 1} has no content`)
          }
        }
      }
    } catch (e) {
      console.log(`⚠️ Could not access iframe ${i + 1} content (might be cross-origin)`)
    }
  }

  // Check for BlockDisplay components
  const blockDisplays = page.locator('[class*="block-display"], [class*="BlockDisplay"]')
  const displayCount = await blockDisplays.count()
  console.log(`🔍 Found ${displayCount} BlockDisplay components`)

  // Report 404 errors
  if (notFoundResponses.length > 0) {
    console.log('\n❌ The following resources returned 404:')
    notFoundResponses.forEach(url => console.log(`  - ${url}`))
  } else {
    console.log('\n✅ No 404 errors detected!')
  }

  // Check specific expected blocks
  const expectedBlocks = [
    'dashboard-01',
    'sidebar-07',
    'sidebar-03',
    'login-03',
    'login-04'
  ]

  console.log('\n🔍 Checking expected blocks...')
  for (const blockName of expectedBlocks) {
    // Check if iframe with this block exists
    const blockIframe = page.locator(`iframe[src*="${blockName}"]`)
    const exists = await blockIframe.count() > 0

    if (exists) {
      const src = await blockIframe.getAttribute('src')
      console.log(`✅ ${blockName}: iframe found with src=${src}`)
    } else {
      console.log(`❌ ${blockName}: iframe not found or not loaded`)
    }
  }

  // Final assertion
  expect(notFoundResponses.length).toBe(0)
})