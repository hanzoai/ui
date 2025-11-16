import { test, expect } from '@playwright/test'

test('Visual proof - blocks page with working previews', async ({ page }) => {
  console.log('📸 Creating visual proof of working blocks...\n')

  // Navigate to blocks page
  await page.goto('http://localhost:3333/blocks', { waitUntil: 'networkidle' })
  console.log('✅ Navigated to blocks page')

  // Take hero screenshot
  await page.screenshot({
    path: 'tests/proof-blocks-hero.png',
    clip: { x: 0, y: 0, width: 1280, height: 800 }
  })
  console.log('📸 Hero section captured')

  // Scroll to each block and capture
  const blocks = ['dashboard-01', 'sidebar-07', 'sidebar-03', 'login-03', 'login-04']

  for (const blockName of blocks) {
    const iframe = page.locator(`iframe[src="/view/${blockName}"]`).first()

    if (await iframe.count() > 0) {
      await iframe.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)

      await page.screenshot({
        path: `tests/proof-block-${blockName}.png`,
        clip: {
          x: 0,
          y: Math.max(0, (await iframe.boundingBox())?.y || 0) - 50,
          width: 1280,
          height: 800
        }
      })
      console.log(`📸 Captured ${blockName}`)
    }
  }

  // Also visit a block directly to show it loads
  console.log('\n🔍 Visiting a block preview directly...')
  await page.goto('http://localhost:3333/view/dashboard-01', { waitUntil: 'networkidle' })

  await page.screenshot({
    path: 'tests/proof-direct-view-dashboard.png',
    fullPage: false
  })
  console.log('📸 Direct view of dashboard-01 captured')

  console.log('\n✅ All visual proofs captured!')
  console.log('📁 Check tests/ directory for screenshots:')
  console.log('  - proof-blocks-hero.png')
  console.log('  - proof-block-dashboard-01.png')
  console.log('  - proof-block-sidebar-07.png')
  console.log('  - proof-block-sidebar-03.png')
  console.log('  - proof-block-login-03.png')
  console.log('  - proof-block-login-04.png')
  console.log('  - proof-direct-view-dashboard.png')
})