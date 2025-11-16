import { test, expect } from '@playwright/test'

test('Verify blocks page and iframes are working', async ({ page }) => {
  console.log('🚀 Starting blocks page verification...\n')

  // Track any 404 errors
  const errors404: string[] = []
  let successfulLoads = 0

  page.on('response', response => {
    if (response.status() === 404) {
      errors404.push(response.url())
      console.log(`  ❌ 404: ${response.url()}`)
    } else if (response.status() === 200 && response.url().includes('/view/')) {
      successfulLoads++
      console.log(`  ✅ 200: ${response.url()}`)
    }
  })

  // Navigate to blocks page
  console.log('📍 Step 1: Navigating to /blocks page...')
  const response = await page.goto('http://localhost:3333/blocks', {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  })

  // Check page loaded successfully
  expect(response?.status()).toBe(200)
  console.log('✅ Blocks page loaded successfully (HTTP 200)\n')

  // Wait for iframes to be present
  console.log('📍 Step 2: Checking for iframe elements...')
  await page.waitForSelector('iframe', { timeout: 5000 })

  // Get all iframes
  const iframes = await page.locator('iframe').all()
  console.log(`✅ Found ${iframes.length} iframe elements\n`)

  // Check each iframe source
  console.log('📍 Step 3: Verifying iframe sources...')
  const expectedBlocks = ['dashboard-01', 'sidebar-07', 'sidebar-03', 'login-03', 'login-04']
  const iframeSources: string[] = []

  for (let i = 0; i < iframes.length; i++) {
    const src = await iframes[i].getAttribute('src')
    if (src) {
      iframeSources.push(src)
      console.log(`  Iframe ${i + 1}: ${src}`)

      // Verify URL format is correct (should be /view/[name] not /view/default/[name])
      expect(src).toMatch(/^\/view\/[^\/]+$/)
      expect(src).not.toContain('/default/')
    }
  }

  console.log('\n📍 Step 4: Waiting for iframe content to load...')
  await page.waitForTimeout(3000) // Give iframes time to load

  // Take screenshots for visual proof
  console.log('\n📍 Step 5: Taking screenshots for verification...')

  // Full page screenshot
  await page.screenshot({
    path: 'tests/blocks-page-working-full.png',
    fullPage: true
  })
  console.log('  📸 Full page screenshot saved')

  // Viewport screenshot showing first blocks
  await page.screenshot({
    path: 'tests/blocks-page-working-viewport.png'
  })
  console.log('  📸 Viewport screenshot saved')

  // Scroll to see more blocks
  await page.evaluate(() => window.scrollBy(0, 1000))
  await page.waitForTimeout(1000)
  await page.screenshot({
    path: 'tests/blocks-page-working-scrolled.png'
  })
  console.log('  📸 Scrolled view screenshot saved')

  // Final verification
  console.log('\n' + '='.repeat(60))
  console.log('📊 FINAL VERIFICATION RESULTS:')
  console.log('='.repeat(60))
  console.log(`✅ Blocks page status: 200 OK`)
  console.log(`✅ Iframes found: ${iframes.length}`)
  console.log(`✅ Iframe sources verified: All using correct /view/[name] format`)
  console.log(`✅ 404 errors: ${errors404.length === 0 ? 'NONE' : errors404.length + ' found'}`)
  console.log(`✅ Successful view loads: ${successfulLoads}`)

  if (errors404.length === 0) {
    console.log('\n🎉 SUCCESS: All blocks are loading correctly with no 404 errors!')
  } else {
    console.log('\n⚠️ Some 404 errors detected:')
    errors404.forEach(url => console.log(`  - ${url}`))
  }

  console.log('\n📁 Screenshots saved in tests/ directory:')
  console.log('  - blocks-page-working-full.png')
  console.log('  - blocks-page-working-viewport.png')
  console.log('  - blocks-page-working-scrolled.png')
  console.log('='.repeat(60))

  // Assertions
  expect(iframes.length).toBeGreaterThanOrEqual(5)
  expect(errors404.length).toBe(0)
  expect(iframeSources.length).toBeGreaterThan(0)

  // Verify expected blocks are present
  for (const blockName of expectedBlocks) {
    const hasBlock = iframeSources.some(src => src.includes(blockName))
    expect(hasBlock).toBeTruthy()
  }
})