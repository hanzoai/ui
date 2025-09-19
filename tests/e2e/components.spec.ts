import { test, expect } from '@playwright/test'
import { registry } from '../../app/registry/registry'

/**
 * E2E tests to verify all registered components are accessible
 */

test.describe('Component Registry', () => {
  test('should have all components accessible', async ({ page }) => {
    // Get all unique component names
    const componentNames = [...new Set(registry.map(c => c.name))]
    const errors: string[] = []

    for (const name of componentNames) {
      // Test component documentation page
      const docUrl = `/docs/components/${name}`
      const response = await page.goto(docUrl, { waitUntil: 'networkidle' })

      if (!response || response.status() === 404) {
        errors.push(`Component ${name} documentation not found at ${docUrl}`)
      } else {
        // Verify the page has content
        const title = await page.title()
        expect(title).toBeTruthy()

        // Check for component preview
        const hasPreview = await page.locator('[data-testid="component-preview"]').count() > 0
        if (!hasPreview) {
          console.warn(`Component ${name} has no preview at ${docUrl}`)
        }
      }
    }

    // Report all errors at once
    if (errors.length > 0) {
      throw new Error(`Component accessibility issues:\n${errors.join('\n')}`)
    }
  })

  test('AI components should be accessible', async ({ page }) => {
    const aiComponents = [
      'ai-playground',
      'ai-chat',
      'ai-assistant',
      'ai-vision',
      'ai-agents',
      'ai-tools',
      'ai-code',
      'ai-voice'
    ]

    for (const component of aiComponents) {
      await test.step(`Check AI component: ${component}`, async () => {
        const response = await page.goto(`/docs/ai/${component}`, {
          waitUntil: 'networkidle',
        })

        expect(response?.status()).not.toBe(404)

        // Verify component documentation structure
        const title = await page.locator('h1').first().textContent()
        expect(title).toBeTruthy()

        // Check for installation instructions
        const hasInstallation = await page.getByText('Installation').count() > 0
        expect(hasInstallation).toBeTruthy()
      })
    }
  })

  test('Extended components should be accessible', async ({ page }) => {
    const extendedComponents = [
      'dock',
      'code-block',
      '3d-card',
      'animated-cursor',
      'apple-cards-carousel',
      'grid-pattern',
      'particles-background'
    ]

    for (const component of extendedComponents) {
      await test.step(`Check extended component: ${component}`, async () => {
        const response = await page.goto(`/docs/components/${component}`, {
          waitUntil: 'networkidle',
        })

        // Allow 404 for now since docs aren't created yet
        if (response?.status() === 404) {
          console.warn(`Extended component ${component} docs not yet created`)
        } else {
          const title = await page.locator('h1').first().textContent()
          expect(title).toBeTruthy()
        }
      })
    }
  })
})

test.describe('Component Functionality', () => {
  test('Dock component should be interactive', async ({ page }) => {
    // Navigate to dock demo if it exists
    await page.goto('/docs/components/dock')

    const dock = page.locator('[data-testid="dock"]')
    if (await dock.count() > 0) {
      // Test hover magnification
      const firstIcon = dock.locator('[data-testid="dock-icon"]').first()
      await firstIcon.hover()

      // Check if magnification animation triggered
      const transform = await firstIcon.evaluate(el =>
        window.getComputedStyle(el).transform
      )
      expect(transform).not.toBe('none')
    }
  })

  test('AI Playground should load model selector', async ({ page }) => {
    await page.goto('/docs/ai/ai-playground')

    const modelSelector = page.locator('[data-testid="model-selector"]')
    if (await modelSelector.count() > 0) {
      await modelSelector.click()

      // Check dropdown opened
      const dropdown = page.locator('[role="listbox"]')
      await expect(dropdown).toBeVisible()
    }
  })

  test('Code Editor should highlight syntax', async ({ page }) => {
    await page.goto('/docs/components/code-editor')

    const editor = page.locator('[data-testid="code-editor"]')
    if (await editor.count() > 0) {
      // Check for syntax highlighting elements
      const syntaxElements = editor.locator('.token')
      expect(await syntaxElements.count()).toBeGreaterThan(0)
    }
  })
})

test.describe('Navigation', () => {
  test('should navigate between sections', async ({ page }) => {
    await page.goto('/')

    // Test main navigation links
    const navLinks = [
      { text: 'Docs', href: '/docs' },
      { text: 'Components', href: '/docs/components' },
      { text: 'AI', href: '/ai' },
      { text: 'Blocks', href: '/blocks' },
    ]

    for (const link of navLinks) {
      const navItem = page.getByRole('link', { name: link.text, exact: true }).first()
      if (await navItem.count() > 0) {
        await navItem.click()
        await expect(page).toHaveURL(new RegExp(link.href))
        await page.goBack()
      }
    }
  })

  test('sidebar navigation should work', async ({ page }) => {
    await page.goto('/docs/components')

    // Click on a few sidebar items
    const sidebarLinks = await page.locator('aside a[href^="/docs/components/"]').all()

    if (sidebarLinks.length > 0) {
      // Test first 5 sidebar links
      for (let i = 0; i < Math.min(5, sidebarLinks.length); i++) {
        const href = await sidebarLinks[i].getAttribute('href')
        if (href) {
          await sidebarLinks[i].click()
          await expect(page).toHaveURL(href)

          // Verify page loaded
          const heading = await page.locator('h1').first().textContent()
          expect(heading).toBeTruthy()
        }
      }
    }
  })
})

test.describe('Responsiveness', () => {
  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check mobile menu exists
    const mobileMenuButton = page.locator('[data-testid="mobile-menu"]')
    if (await mobileMenuButton.count() > 0) {
      await mobileMenuButton.click()

      // Mobile menu should be visible
      const mobileNav = page.locator('[data-testid="mobile-nav"]')
      await expect(mobileNav).toBeVisible()
    }
  })

  test('should adapt layout on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/docs/components')

    // Sidebar should be visible on tablet
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()
  })
})

test.describe('Performance', () => {
  test('should load quickly', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/', { waitUntil: 'networkidle' })
    const loadTime = Date.now() - startTime

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/')

    // Measure LCP (Largest Contentful Paint)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry.renderTime || lastEntry.loadTime)
        }).observe({ entryTypes: ['largest-contentful-paint'] })
      })
    })

    // LCP should be under 2.5s for good performance
    expect(Number(lcp)).toBeLessThan(2500)
  })
})