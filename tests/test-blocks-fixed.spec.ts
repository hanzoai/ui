import { test, expect } from '@playwright/test'

test('Verify blocks page iframes are loading correctly', async ({ page }) => {
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

  // Wait a bit for iframes to start loading
  await page.waitForTimeout(3000)

  // Find all iframes
  const iframes = page.locator('iframe')
  const iframeCount = await iframes.count()
  console.log(`\n🖼️ Found ${iframeCount} iframes on the page`)

  // Check each iframe's source
  const iframeSources: string[] = []
  for (let i = 0; i < iframeCount; i++) {
    const iframe = iframes.nth(i)
    const src = await iframe.getAttribute('src')
    iframeSources.push(src || '')
    console.log(`✅ Iframe ${i + 1}: ${src}`)
  }

  // Report results
  console.log('\n📊 Summary:')
  console.log(`- Total iframes: ${iframeCount}`)
  console.log(`- 404 errors: ${notFoundResponses.length}`)

  if (notFoundResponses.length > 0) {
    console.log('\n❌ The following resources returned 404:')
    notFoundResponses.forEach(url => console.log(`  - ${url}`))
  } else {
    console.log('✅ No 404 errors detected!')
  }

  // Take a screenshot for visual verification
  await page.screenshot({
    path: 'tests/blocks-page-working.png',
    fullPage: true
  })
  console.log('📸 Screenshot saved to tests/blocks-page-working.png')

  // Assertions
  expect(iframeCount).toBeGreaterThan(0)
  expect(notFoundResponses.length).toBe(0)

  // Verify correct URL format (should be /view/[block-name], not /view/default/[block-name])
  iframeSources.forEach(src => {
    expect(src).toMatch(/^\/view\/[^\/]+$/) // Should match /view/something, not /view/something/else
  })

  console.log('\n✅ All tests passed! Blocks page is working correctly.')
})