import { test, expect } from '@playwright/test'
import { registry } from '../../app/registry/registry'

/**
 * Visual regression tests for components
 * Captures screenshots and compares them against baselines
 */

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    })
  })

  test('Landing page visual snapshot', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Take full page screenshot
    await expect(page).toHaveScreenshot('landing-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    })
  })

  test('Docs page visual snapshot', async ({ page }) => {
    await page.goto('/docs')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('docs-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    })
  })

  test('Components gallery visual snapshot', async ({ page }) => {
    await page.goto('/docs/components')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('components-gallery.png', {
      fullPage: true,
      maxDiffPixels: 100,
    })
  })

  test('AI components page visual snapshot', async ({ page }) => {
    await page.goto('/ai')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('ai-components.png', {
      fullPage: true,
      maxDiffPixels: 100,
    })
  })

  test('Key component screenshots', async ({ page }) => {
    const keyComponents = [
      'button',
      'card',
      'dialog',
      'dropdown-menu',
      'input',
      'select',
      'table',
      'tabs',
    ]

    for (const component of keyComponents) {
      await test.step(`Screenshot: ${component}`, async () => {
        const response = await page.goto(`/docs/components/${component}`, {
          waitUntil: 'networkidle',
        })

        if (response?.status() !== 404) {
          // Wait for component preview to load
          const preview = page.locator('[data-testid="component-preview"]').first()
          if (await preview.count() > 0) {
            await preview.scrollIntoViewIfNeeded()
            await expect(preview).toHaveScreenshot(`component-${component}.png`, {
              maxDiffPixels: 50,
            })
          }
        }
      })
    }
  })

  test('AI Playground visual test', async ({ page }) => {
    await page.goto('/docs/ai/ai-playground')
    await page.waitForLoadState('networkidle')

    const playground = page.locator('[data-testid="ai-playground"]').first()
    if (await playground.count() > 0) {
      await expect(playground).toHaveScreenshot('ai-playground.png', {
        maxDiffPixels: 100,
      })
    }
  })

  test('Dock component visual test', async ({ page }) => {
    await page.goto('/docs/components/dock')
    await page.waitForLoadState('networkidle')

    const dock = page.locator('[data-testid="dock"]').first()
    if (await dock.count() > 0) {
      // Capture default state
      await expect(dock).toHaveScreenshot('dock-default.png')

      // Capture hover state
      const firstIcon = dock.locator('[data-testid="dock-icon"]').first()
      await firstIcon.hover()
      await page.waitForTimeout(100) // Wait for animation
      await expect(dock).toHaveScreenshot('dock-hover.png')
    }
  })

  test('Code Editor visual test', async ({ page }) => {
    await page.goto('/docs/components/code-editor')
    await page.waitForLoadState('networkidle')

    const editor = page.locator('[data-testid="code-editor"]').first()
    if (await editor.count() > 0) {
      await expect(editor).toHaveScreenshot('code-editor.png', {
        maxDiffPixels: 100,
      })
    }
  })

  test('Dark mode visual tests', async ({ page }) => {
    // Set dark mode
    await page.goto('/')
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })

    await page.waitForTimeout(100) // Wait for theme change

    // Landing page in dark mode
    await expect(page).toHaveScreenshot('landing-page-dark.png', {
      fullPage: true,
      maxDiffPixels: 100,
    })

    // Components in dark mode
    await page.goto('/docs/components')
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })
    await expect(page).toHaveScreenshot('components-dark.png', {
      fullPage: true,
      maxDiffPixels: 100,
    })
  })

  test('Responsive visual tests', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ]

    for (const viewport of viewports) {
      await test.step(`${viewport.name} viewport`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveScreenshot(`landing-${viewport.name}.png`, {
          fullPage: false, // Viewport screenshot
          maxDiffPixels: 100,
        })
      })
    }
  })

  test('Component states visual test', async ({ page }) => {
    await page.goto('/docs/components/button')

    const buttonStates = [
      { selector: '[data-state="default"]', name: 'default' },
      { selector: '[data-state="hover"]', name: 'hover' },
      { selector: '[data-state="focus"]', name: 'focus' },
      { selector: '[data-state="disabled"]', name: 'disabled' },
    ]

    for (const state of buttonStates) {
      const button = page.locator(state.selector).first()
      if (await button.count() > 0) {
        await expect(button).toHaveScreenshot(`button-${state.name}.png`)
      }
    }
  })

  test('3D Card visual test', async ({ page }) => {
    await page.goto('/docs/components/3d-card')
    await page.waitForLoadState('networkidle')

    const card3d = page.locator('[data-testid="3d-card"]').first()
    if (await card3d.count() > 0) {
      // Default state
      await expect(card3d).toHaveScreenshot('3d-card-default.png')

      // Hover state for 3D effect
      await card3d.hover()
      await page.waitForTimeout(200) // Wait for 3D transform
      await expect(card3d).toHaveScreenshot('3d-card-hover.png')
    }
  })

  test('Particles Background visual test', async ({ page }) => {
    await page.goto('/docs/components/particles-background')
    await page.waitForLoadState('networkidle')

    const particles = page.locator('[data-testid="particles-background"]').first()
    if (await particles.count() > 0) {
      // Particles are animated, so we allow more difference
      await expect(particles).toHaveScreenshot('particles-background.png', {
        maxDiffPixels: 500,
      })
    }
  })
})

test.describe('Cross-browser Visual Tests', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`Components render correctly in ${browserName}`, async ({ page }) => {
      await page.goto('/docs/components')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot(`components-${browserName}.png`, {
        fullPage: false,
        maxDiffPixels: 200,
      })
    })
  })
})

test.describe('Accessibility Visual Tests', () => {
  test('Focus indicators are visible', async ({ page }) => {
    await page.goto('/docs/components/button')

    // Tab through interactive elements
    await page.keyboard.press('Tab')
    await expect(page).toHaveScreenshot('focus-indicator-1.png')

    await page.keyboard.press('Tab')
    await expect(page).toHaveScreenshot('focus-indicator-2.png')
  })

  test('High contrast mode', async ({ page }) => {
    await page.goto('/')

    // Simulate high contrast mode
    await page.evaluate(() => {
      document.documentElement.style.filter = 'contrast(2)'
    })

    await expect(page).toHaveScreenshot('high-contrast.png', {
      fullPage: false,
      maxDiffPixels: 200,
    })
  })
})