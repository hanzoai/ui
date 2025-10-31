import { test, expect } from '@playwright/test'

// Configure to not use webServer since we have one running
test.use({
  baseURL: 'http://localhost:3333',
})

test.describe('Homepage Examples Verification', () => {
  test('homepage loads with tabs', async ({ page }) => {
    await page.goto('/')
    
    // Check for tab list
    const tabsList = page.locator('[role="tablist"]')
    await expect(tabsList).toBeVisible()
    
    // Check for Mail tab
    const mailTab = page.locator('[role="tab"]:has-text("Mail")')
    await expect(mailTab).toBeVisible()
    
    // Check for Dashboard tab
    const dashboardTab = page.locator('[role="tab"]:has-text("Dashboard")')
    await expect(dashboardTab).toBeVisible()
    
    console.log('✓ Homepage loads with tabs')
  })

  test('Mail tab displays correctly', async ({ page }) => {
    await page.goto('/')
    
    // Click Mail tab
    const mailTab = page.locator('[role="tab"]:has-text("Mail")')
    await mailTab.click()
    await page.waitForTimeout(1000)
    
    // Check for iframe
    const iframe = page.locator('iframe[title="Mail Example"]')
    await expect(iframe).toBeVisible()
    
    const src = await iframe.getAttribute('src')
    console.log(`✓ Mail iframe src: ${src}`)
    
    // Try to access iframe content
    const iframeLocator = page.frameLocator('iframe[title="Mail Example"]')
    const body = iframeLocator.locator('body')
    await expect(body).toBeVisible()
    
    console.log('✓ Mail tab displays with iframe')
  })

  test('Dashboard tab displays correctly', async ({ page }) => {
    await page.goto('/')
    
    // Click Dashboard tab
    const dashboardTab = page.locator('[role="tab"]:has-text("Dashboard")')
    await dashboardTab.click()
    await page.waitForTimeout(1000)
    
    // Check for iframe
    const iframe = page.locator('iframe[title="Dashboard Example"]')
    await expect(iframe).toBeVisible()
    
    const src = await iframe.getAttribute('src')
    console.log(`✓ Dashboard iframe src: ${src}`)
    
    console.log('✓ Dashboard tab displays with iframe')
  })
})
