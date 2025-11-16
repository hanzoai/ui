import { test, expect } from '@playwright/test'

test.describe('Comprehensive Blocks Page Verification', () => {
  test('Complete blocks functionality test', async ({ page }) => {
    console.log('🔍 COMPREHENSIVE BLOCKS PAGE TEST\n')
    console.log('=' .repeat(60))

    // Setup: Track network activity
    const networkActivity = {
      successful: [] as string[],
      failed: [] as string[],
      iframeLoads: [] as string[]
    }

    page.on('response', response => {
      const url = response.url()
      const status = response.status()

      if (url.includes('/view/')) {
        if (status === 200) {
          networkActivity.successful.push(url)
          networkActivity.iframeLoads.push(url)
        } else if (status === 404) {
          networkActivity.failed.push(url)
        }
      }
    })

    // Test 1: Navigate to blocks page
    console.log('\n✅ TEST 1: Navigation to Blocks Page')
    console.log('-'.repeat(40))

    const response = await page.goto('http://localhost:3333/blocks', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    expect(response?.status()).toBe(200)
    console.log('  ✓ Page loaded with status 200')

    const title = await page.title()
    console.log(`  ✓ Page title: "${title}"`)

    // Test 2: Check page structure
    console.log('\n✅ TEST 2: Page Structure')
    console.log('-'.repeat(40))

    // Check header navigation (may be hidden on mobile)
    const builderLink = page.locator('a[href="/builder"]')
    const builderLinkCount = await builderLink.count()
    if (builderLinkCount > 0) {
      console.log('  ✓ Builder link found in navigation')
    } else {
      console.log('  ⓘ Builder link not visible (may be in mobile menu)')
    }

    // Check if blocks are present
    const mainContent = page.locator('main, [role="main"], div.flex.flex-col.gap-12')
    expect(await mainContent.count()).toBeGreaterThan(0)
    console.log('  ✓ Main content area found')

    // Test 3: Verify iframes
    console.log('\n✅ TEST 3: Iframe Verification')
    console.log('-'.repeat(40))

    await page.waitForSelector('iframe', { timeout: 10000 })
    const iframes = page.locator('iframe')
    const iframeCount = await iframes.count()

    expect(iframeCount).toBeGreaterThanOrEqual(5)
    console.log(`  ✓ Found ${iframeCount} iframes`)

    // Check each iframe
    const expectedBlocks = [
      'dashboard-01',
      'sidebar-07',
      'sidebar-03',
      'login-03',
      'login-04'
    ]

    for (let i = 0; i < iframeCount; i++) {
      const iframe = iframes.nth(i)
      const src = await iframe.getAttribute('src')

      // Verify URL format
      expect(src).toMatch(/^\/view\/[a-z0-9-]+$/)
      expect(src).not.toContain('/default/')
      expect(src).not.toContain('/style/')

      console.log(`  ✓ Iframe ${i + 1}: ${src} (correct format)`)
    }

    // Test 4: Wait for content to load
    console.log('\n✅ TEST 4: Content Loading')
    console.log('-'.repeat(40))

    await page.waitForTimeout(5000) // Allow iframes to fully load

    console.log(`  ✓ ${networkActivity.iframeLoads.length} iframe loads detected`)
    console.log(`  ✓ ${networkActivity.failed.length} 404 errors (should be 0)`)

    // Test 5: Interactive elements
    console.log('\n✅ TEST 5: Interactive Elements')
    console.log('-'.repeat(40))

    // Check for Preview/Code tabs if visible
    const tabs = page.locator('[role="tablist"], .tabs-list, [data-slot="tabs-list"]').first()
    if (await tabs.isVisible({ timeout: 1000 }).catch(() => false)) {
      const previewTab = tabs.locator('button:has-text("Preview")')
      const codeTab = tabs.locator('button:has-text("Code")')

      if (await previewTab.count() > 0) {
        await previewTab.click()
        console.log('  ✓ Preview tab clicked')
      }

      if (await codeTab.count() > 0) {
        await codeTab.click()
        console.log('  ✓ Code tab clicked')
      }
    }

    // Check viewport toggle buttons
    const viewportToggles = page.locator('button[title="Desktop"], button[title="Tablet"], button[title="Mobile"]')
    const toggleCount = await viewportToggles.count()
    console.log(`  ✓ Found ${toggleCount} viewport toggle buttons`)

    // Test 6: Visual verification
    console.log('\n✅ TEST 6: Visual Verification')
    console.log('-'.repeat(40))

    // Take screenshots at different scroll positions
    await page.screenshot({
      path: 'tests/final-blocks-top.png',
      fullPage: false
    })
    console.log('  ✓ Screenshot 1: Top of page')

    await page.evaluate(() => window.scrollBy(0, 500))
    await page.waitForTimeout(500)
    await page.screenshot({
      path: 'tests/final-blocks-middle.png',
      fullPage: false
    })
    console.log('  ✓ Screenshot 2: Middle section')

    await page.evaluate(() => window.scrollBy(0, 1000))
    await page.waitForTimeout(500)
    await page.screenshot({
      path: 'tests/final-blocks-bottom.png',
      fullPage: false
    })
    console.log('  ✓ Screenshot 3: Bottom section')

    // Test 7: Direct block view
    console.log('\n✅ TEST 7: Direct Block View')
    console.log('-'.repeat(40))

    const directResponse = await page.goto('http://localhost:3333/view/dashboard-01', {
      waitUntil: 'domcontentloaded'
    })

    expect(directResponse?.status()).toBe(200)
    console.log('  ✓ Direct view /view/dashboard-01 loads (200 OK)')

    await page.screenshot({
      path: 'tests/final-direct-view.png'
    })
    console.log('  ✓ Direct view screenshot captured')

    // Final Report
    console.log('\n' + '=' .repeat(60))
    console.log('📊 FINAL TEST RESULTS')
    console.log('=' .repeat(60))

    const allTestsPassed = networkActivity.failed.length === 0 && iframeCount >= 5

    console.log(`\n  Blocks Page Status: ${response?.status() === 200 ? '✅ WORKING' : '❌ FAILED'}`)
    console.log(`  Iframes Found: ${iframeCount >= 5 ? '✅' : '❌'} ${iframeCount}/5`)
    console.log(`  404 Errors: ${networkActivity.failed.length === 0 ? '✅ NONE' : '❌ ' + networkActivity.failed.length}`)
    console.log(`  Successful Loads: ✅ ${networkActivity.successful.length}`)
    console.log(`  Direct View Works: ✅ YES`)

    if (allTestsPassed) {
      console.log('\n🎉 ALL TESTS PASSED! Blocks page is fully functional!')
    } else {
      console.log('\n⚠️ Some issues detected:')
      if (networkActivity.failed.length > 0) {
        console.log('  404 URLs:', networkActivity.failed)
      }
    }

    console.log('\n📁 Screenshots saved:')
    console.log('  - tests/final-blocks-top.png')
    console.log('  - tests/final-blocks-middle.png')
    console.log('  - tests/final-blocks-bottom.png')
    console.log('  - tests/final-direct-view.png')
    console.log('=' .repeat(60))

    // Final assertions
    expect(networkActivity.failed.length).toBe(0)
    expect(iframeCount).toBeGreaterThanOrEqual(5)
    expect(response?.status()).toBe(200)
  })
})