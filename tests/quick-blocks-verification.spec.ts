import { test, expect } from '@playwright/test'

test('Quick blocks page verification', async ({ page }) => {
  console.log('\n🚀 QUICK BLOCKS VERIFICATION TEST')
  console.log('='.repeat(50))

  // Track 404 errors
  const errors404: string[] = []
  const successfulIframes: string[] = []

  page.on('response', response => {
    const url = response.url()
    if (url.includes('/view/')) {
      if (response.status() === 404) {
        errors404.push(url)
      } else if (response.status() === 200) {
        successfulIframes.push(url)
      }
    }
  })

  // Navigate with shorter timeout
  console.log('\n📍 Loading blocks page...')
  await page.goto('http://localhost:3333/blocks', {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  })
  console.log('✅ Page loaded')

  // Wait for iframes
  await page.waitForSelector('iframe', { timeout: 5000 })

  // Get iframe count
  const iframes = await page.locator('iframe').all()
  console.log(`\n🖼️  Found ${iframes.length} iframes`)

  // Check iframe sources
  console.log('\n📋 Iframe sources:')
  for (const [i, iframe] of iframes.entries()) {
    const src = await iframe.getAttribute('src')
    console.log(`  ${i + 1}. ${src}`)

    // Verify correct format
    expect(src).toMatch(/^\/view\/[a-z0-9-]+$/)
    expect(src).not.toContain('/default/')
  }

  // Wait for content to load
  await page.waitForTimeout(3000)

  // Take screenshot
  await page.screenshot({
    path: 'tests/quick-verification.png',
    fullPage: false
  })

  // Results
  console.log('\n' + '='.repeat(50))
  console.log('📊 RESULTS:')
  console.log('='.repeat(50))
  console.log(`✅ Iframes found: ${iframes.length}`)
  console.log(`✅ Successful loads: ${successfulIframes.length}`)
  console.log(`${errors404.length === 0 ? '✅' : '❌'} 404 errors: ${errors404.length}`)

  if (errors404.length > 0) {
    console.log('\n❌ Failed URLs:')
    errors404.forEach(url => console.log(`  - ${url}`))
  }

  console.log('\n📸 Screenshot: tests/quick-verification.png')
  console.log('='.repeat(50))

  // Assertions
  expect(iframes.length).toBeGreaterThanOrEqual(5)
  expect(errors404.length).toBe(0)

  if (errors404.length === 0 && iframes.length >= 5) {
    console.log('\n🎉 SUCCESS! All blocks loading correctly!')
  }
})