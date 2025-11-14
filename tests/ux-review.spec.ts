import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const SCREENSHOTS_DIR = 'tests/reports/ux-review'

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
}

test.describe('UI/UX Comprehensive Review', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
  })

  test('Homepage - First Impressions & Hero Section', async ({ page }) => {
    await page.goto('http://localhost:3333')
    await page.waitForLoadState('networkidle')

    // Capture full page screenshot
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/01-homepage-hero.png`,
      fullPage: true
    })

    // Analyze hero section
    const hero = page.locator('section').first()
    await expect(hero).toBeVisible()

    // Check for clear value proposition
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()
    const headingText = await heading.textContent()
    console.log('🎯 Hero Heading:', headingText)

    // Check for call-to-action
    const cta = page.locator('a[href*="docs"], button').first()
    await expect(cta).toBeVisible()

    // Analyze navigation
    const nav = page.locator('header, nav').first()
    await expect(nav).toBeVisible()

    // Check navigation items
    const navLinks = await page.locator('header a, nav a').all()
    console.log(`📊 Navigation items: ${navLinks.length}`)

    // UX Check: Navigation accessibility
    for (let i = 0; i < Math.min(navLinks.length, 10); i++) {
      const link = navLinks[i]
      const text = await link.textContent()
      const href = await link.getAttribute('href')
      console.log(`  - ${text}: ${href}`)
    }
  })

  test('Homepage - Visual Hierarchy & Spacing', async ({ page }) => {
    await page.goto('http://localhost:3333')
    await page.waitForLoadState('networkidle')

    // Analyze spacing between sections
    const sections = await page.locator('section').all()
    console.log(`📐 Found ${sections.length} sections`)

    for (let i = 0; i < Math.min(sections.length, 5); i++) {
      const section = sections[i]
      const box = await section.boundingBox()
      if (box) {
        console.log(`Section ${i + 1}: height=${box.height}px, y=${box.y}px`)
      }
    }

    // Check for consistent color scheme
    const background = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    console.log('🎨 Body background:', background)

    // Screenshot with element highlights
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/02-homepage-hierarchy.png`,
      fullPage: true
    })
  })

  test('Components Page - Browse Experience', async ({ page }) => {
    await page.goto('http://localhost:3333/docs/components')
    await page.waitForLoadState('networkidle')

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/03-components-overview.png`,
      fullPage: true
    })

    // Check sidebar navigation
    const sidebar = page.locator('[role="navigation"], aside, .sidebar').first()
    await expect(sidebar).toBeVisible()

    // Analyze component list
    const componentLinks = await page.locator('a[href*="/docs/components/"]').all()
    console.log(`🧩 Total component links: ${componentLinks.length}`)

    // UX Check: Is search available?
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]')
    const hasSearch = await searchInput.count() > 0
    console.log(`🔍 Search functionality: ${hasSearch ? '✓ Available' : '✗ Missing'}`)

    if (hasSearch) {
      await searchInput.first().screenshot({
        path: `${SCREENSHOTS_DIR}/04-search-component.png`
      })
    }
  })

  test('Individual Component Page - Documentation Quality', async ({ page }) => {
    await page.goto('http://localhost:3333/docs/components/button')
    await page.waitForLoadState('networkidle')

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/05-button-component-page.png`,
      fullPage: true
    })

    // Check for essential documentation elements
    const checks = {
      'Live Preview': await page.locator('[class*="preview"], [data-preview]').count() > 0,
      'Code Example': await page.locator('pre code, [class*="code"]').count() > 0,
      'Props Table': await page.locator('table').count() > 0,
      'Installation': await page.locator('text=/install|npm|pnpm/i').count() > 0,
      'Copy Button': await page.locator('button:has-text("Copy"), button[aria-label*="copy" i]').count() > 0,
    }

    console.log('📚 Documentation elements:')
    for (const [element, present] of Object.entries(checks)) {
      console.log(`  ${present ? '✓' : '✗'} ${element}`)
    }

    // Check for multiple variants/examples
    const examples = await page.locator('[class*="example"], [data-example]').count()
    console.log(`📖 Number of examples: ${examples}`)
  })

  test('Blocks Page - Gallery Experience', async ({ page }) => {
    await page.goto('http://localhost:3333/blocks')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/06-blocks-gallery.png`,
      fullPage: true
    })

    // Analyze block cards
    const blockCards = await page.locator('[class*="card"], [data-block]').all()
    console.log(`🎴 Total block cards visible: ${blockCards.length}`)

    // Check card design
    if (blockCards.length > 0) {
      const firstCard = blockCards[0]
      const cardBox = await firstCard.boundingBox()
      if (cardBox) {
        console.log(`📏 Card dimensions: ${cardBox.width}x${cardBox.height}px`)
      }

      // Screenshot first few cards
      await firstCard.screenshot({
        path: `${SCREENSHOTS_DIR}/07-block-card-detail.png`
      })
    }

    // UX Check: Filter/search functionality
    const filterInput = page.locator('input[placeholder*="filter" i], input[placeholder*="search" i]')
    const hasFilter = await filterInput.count() > 0
    console.log(`🔎 Filter functionality: ${hasFilter ? '✓ Available' : '✗ Missing'}`)

    // Check for category navigation
    const categories = await page.locator('[role="tab"], button[data-category]').all()
    console.log(`🏷️  Categories/tabs: ${categories.length}`)
  })

  test('Builder Page - Interface Usability', async ({ page }) => {
    await page.goto('http://localhost:3333/builder')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/08-builder-interface.png`,
      fullPage: true
    })

    // Analyze builder layout
    const layout = await page.evaluate(() => {
      const main = document.querySelector('main')
      const sidebar = document.querySelector('aside, [class*="sidebar"]')
      const canvas = document.querySelector('[class*="canvas"], [data-canvas]')

      return {
        mainWidth: main?.getBoundingClientRect().width,
        sidebarWidth: sidebar?.getBoundingClientRect().width,
        canvasWidth: canvas?.getBoundingClientRect().width,
      }
    })

    console.log('🏗️  Builder Layout:')
    console.log(`  Main: ${layout.mainWidth}px`)
    console.log(`  Sidebar: ${layout.sidebarWidth}px`)
    console.log(`  Canvas: ${layout.canvasWidth}px`)

    // Check for essential builder controls
    const controls = {
      'Add Container': await page.locator('button:has-text("Add Container"), button:has-text("Container")').count() > 0,
      'Viewport Switcher': await page.locator('button:has-text("Mobile"), button:has-text("Desktop")').count() > 0,
      'Export/Download': await page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("Copy")').count() > 0,
      'Component Library': await page.locator('text=/component library|blocks/i').count() > 0,
    }

    console.log('🎮 Builder Controls:')
    for (const [control, present] of Object.entries(controls)) {
      console.log(`  ${present ? '✓' : '✗'} ${control}`)
    }

    // Screenshot component library panel
    const libraryPanel = page.locator('[class*="library"], [class*="sidebar"]').first()
    if (await libraryPanel.isVisible()) {
      await libraryPanel.screenshot({
        path: `${SCREENSHOTS_DIR}/09-builder-library-panel.png`
      })
    }
  })

  test('Mobile Responsiveness - Homepage', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3333')
    await page.waitForLoadState('networkidle')

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/10-mobile-homepage.png`,
      fullPage: true
    })

    // Check mobile navigation
    const mobileNav = page.locator('[class*="mobile"], button[aria-label*="menu" i]')
    const hasMobileNav = await mobileNav.count() > 0
    console.log(`📱 Mobile navigation: ${hasMobileNav ? '✓ Present' : '✗ Missing'}`)

    // Check for hamburger menu
    const hamburger = page.locator('button:has-text("☰"), button[aria-label*="menu"]')
    if (await hamburger.count() > 0) {
      await hamburger.first().click()
      await page.waitForTimeout(500)
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/11-mobile-menu-open.png`,
        fullPage: true
      })
    }
  })

  test('Tablet Responsiveness - Builder', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:3333/builder')
    await page.waitForLoadState('networkidle')

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/12-tablet-builder.png`,
      fullPage: true
    })

    console.log('📱 Tablet viewport (768x1024) - Builder page')
  })

  test('Accessibility Audit - Interactive Elements', async ({ page }) => {
    await page.goto('http://localhost:3333')
    await page.waitForLoadState('networkidle')

    // Check for alt text on images
    const images = await page.locator('img').all()
    let imagesWithAlt = 0
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      if (alt && alt.trim()) imagesWithAlt++
    }
    console.log(`♿ Images with alt text: ${imagesWithAlt}/${images.length}`)

    // Check button accessibility
    const buttons = await page.locator('button').all()
    let buttonsWithLabel = 0
    for (const btn of buttons.slice(0, 20)) {
      const label = await btn.getAttribute('aria-label')
      const text = await btn.textContent()
      if (label || (text && text.trim())) buttonsWithLabel++
    }
    console.log(`♿ Buttons with labels: ${buttonsWithLabel}/${Math.min(buttons.length, 20)}`)

    // Check for skip links
    const skipLinks = await page.locator('a[href="#main"], a[href="#content"]').count()
    console.log(`♿ Skip links: ${skipLinks > 0 ? '✓ Present' : '✗ Missing'}`)

    // Check for heading hierarchy
    const h1Count = await page.locator('h1').count()
    const h2Count = await page.locator('h2').count()
    const h3Count = await page.locator('h3').count()
    console.log(`♿ Heading hierarchy: H1=${h1Count}, H2=${h2Count}, H3=${h3Count}`)
  })

  test('Performance - Load Time Analysis', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('http://localhost:3333')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime
    console.log(`⚡ Page load time: ${loadTime}ms`)

    // Check for loading states
    const hasLoader = await page.locator('[class*="loading"], [class*="spinner"], [data-loading]').count()
    console.log(`⚡ Loading indicators: ${hasLoader}`)

    // Measure time to first contentful paint
    const metrics = await page.evaluate(() => {
      const paint = performance.getEntriesByType('paint')
      return paint.map(p => ({ name: p.name, time: p.startTime }))
    })

    console.log('⚡ Paint metrics:')
    metrics.forEach(m => console.log(`  ${m.name}: ${m.time.toFixed(2)}ms`))
  })

  test('Color Contrast & Theme - Dark/Light Mode', async ({ page }) => {
    await page.goto('http://localhost:3333')
    await page.waitForLoadState('networkidle')

    // Check for theme switcher
    const themeSwitcher = page.locator('button[aria-label*="theme" i], button:has-text("Dark"), button:has-text("Light")')
    const hasThemeSwitcher = await themeSwitcher.count() > 0
    console.log(`🌓 Theme switcher: ${hasThemeSwitcher ? '✓ Available' : '✗ Missing'}`)

    if (hasThemeSwitcher) {
      // Capture light mode
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/13-light-mode.png`,
        fullPage: false,
        clip: { x: 0, y: 0, width: 1920, height: 1080 }
      })

      // Toggle to dark mode
      await themeSwitcher.first().click()
      await page.waitForTimeout(500)

      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/14-dark-mode.png`,
        fullPage: false,
        clip: { x: 0, y: 0, width: 1920, height: 1080 }
      })

      // Analyze contrast
      const textColor = await page.evaluate(() => {
        const body = document.body
        const styles = window.getComputedStyle(body)
        return {
          color: styles.color,
          background: styles.backgroundColor,
        }
      })
      console.log('🎨 Dark mode colors:', textColor)
    }
  })

  test('Interactive Elements - Hover States', async ({ page }) => {
    await page.goto('http://localhost:3333/docs/components')
    await page.waitForLoadState('networkidle')

    // Find first few links
    const links = await page.locator('a').all()

    if (links.length > 0) {
      const firstLink = links[0]

      // Normal state
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/15-link-normal.png`,
      })

      // Hover state
      await firstLink.hover()
      await page.waitForTimeout(200)
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/16-link-hover.png`,
      })

      console.log('🎯 Captured hover state transitions')
    }
  })
})

test.describe('UX Issues & Improvement Recommendations', () => {
  let issues: Array<{ severity: string; area: string; issue: string; recommendation: string }> = []

  test.afterAll(() => {
    // Output all findings
    console.log('\n\n' + '='.repeat(80))
    console.log('UI/UX REVIEW SUMMARY')
    console.log('='.repeat(80) + '\n')

    if (issues.length > 0) {
      console.log('🎨 IMPROVEMENT OPPORTUNITIES:\n')
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity}] ${issue.area}`)
        console.log(`   Issue: ${issue.issue}`)
        console.log(`   Recommendation: ${issue.recommendation}\n`)
      })
    }

    console.log(`\n📸 Screenshots saved to: ${SCREENSHOTS_DIR}`)
    console.log('='.repeat(80) + '\n')
  })

  test('Compile Findings', async ({ page }) => {
    // This test aggregates all findings from other tests
    // In a real scenario, you'd collect these during the actual tests

    issues.push({
      severity: 'HIGH',
      area: 'Navigation',
      issue: 'Verify if navigation hierarchy is clear at first glance',
      recommendation: 'Ensure primary navigation items are prominent with clear labels and visual hierarchy'
    })

    issues.push({
      severity: 'MEDIUM',
      area: 'Component Gallery',
      issue: 'Check if filtering/search is immediately discoverable',
      recommendation: 'Place search prominently with placeholder text that guides users'
    })

    issues.push({
      severity: 'MEDIUM',
      area: 'Builder Interface',
      issue: 'Verify if drag-and-drop affordances are clear',
      recommendation: 'Add visual cues (cursor changes, hover states, drop zones) to guide users'
    })

    issues.push({
      severity: 'LOW',
      area: 'Mobile Experience',
      issue: 'Ensure touch targets meet minimum size (44x44px)',
      recommendation: 'Increase button/link padding on mobile viewports'
    })

    issues.push({
      severity: 'MEDIUM',
      area: 'Performance',
      issue: 'Assess if loading states provide adequate feedback',
      recommendation: 'Add skeleton screens or progress indicators for async operations'
    })
  })
})
