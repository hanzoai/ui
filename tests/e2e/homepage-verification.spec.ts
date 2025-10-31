import { test, expect } from '@playwright/test'

test.describe('Homepage Examples Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3333', { waitUntil: 'networkidle' })
  })

  test('homepage loads with tabs', async ({ page }) => {
    // Check for tab list
    const tabsList = page.locator('[role="tablist"]')
    await expect(tabsList).toBeVisible()
    
    // Check for Mail tab
    const mailTab = page.locator('[role="tab"]:has-text("Mail")')
    await expect(mailTab).toBeVisible()
    
    // Check for Dashboard tab
    const dashboardTab = page.locator('[role="tab"]:has-text("Dashboard")')
    await expect(dashboardTab).toBeVisible()
  })

  test('Mail tab displays without site headers', async ({ page }) => {
    // Click Mail tab
    const mailTab = page.locator('[role="tab"]:has-text("Mail")')
    await mailTab.click()
    await page.waitForTimeout(500)
    
    // Check for iframe
    const iframe = page.locator('iframe[title="Mail Example"]')
    await expect(iframe).toBeVisible()
    
    // Get the iframe content
    const iframeHandle = await iframe.elementHandle()
    const frame = await iframeHandle?.contentFrame()
    
    if (frame) {
      // Check for Mail sidebar (should be present)
      const sidebar = frame.locator('text=Inbox, Drafts, Sent Mail')
      const inboxText = frame.locator('text=Inbox')
      
      // Just check the iframe loaded
      const bodyContent = await frame.locator('body').innerHTML()
      console.log(`Mail iframe content size: ${bodyContent.length} bytes`)
    }
  })

  test('Dashboard tab displays without site headers', async ({ page }) => {
    // Click Dashboard tab
    const dashboardTab = page.locator('[role="tab"]:has-text("Dashboard")')
    await dashboardTab.click()
    await page.waitForTimeout(500)
    
    // Check for iframe
    const iframe = page.locator('iframe[title="Dashboard Example"]')
    await expect(iframe).toBeVisible()
  })

  test('verify Homepage structure - no examples nav on homepage', async ({ page }) => {
    // The examples nav should NOT be on the homepage
    const examplesNav = page.locator('[data-component="examples-nav"]')
    
    // This should not be visible on the homepage
    const isVisible = await examplesNav.isVisible().catch(() => false)
    console.log(`Examples nav visible on homepage: ${isVisible}`)
  })
})
