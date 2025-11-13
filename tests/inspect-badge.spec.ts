import { test } from '@playwright/test'

test('Inspect NEW badge styling next to Breadcrumb in sidebar', async ({ page }) => {
  // Navigate to the accordion component page
  await page.goto('/docs/components/accordion')

  // Wait for the page to fully load
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // Find text "New" in the sidebar
  let badgeToInspect = page.locator('span').filter({ hasText: /New/ }).first()
  let badgeCount = await page.locator('span').filter({ hasText: /New/ }).count()
  console.log(`Found ${badgeCount} spans with "New" text`)

  // Check if we found it
  if (badgeCount === 0) {
    // Try without filter
    const allSpans = await page.locator('span').all()
    console.log(`Total spans: ${allSpans.length}`)

    // Just take a screenshot to see what's there
    await page.screenshot({ path: 'tests/reports/sidebar-full.png' })
    return
  }

  // Get computed styles from the badge element
  const computedStyles = await badgeToInspect.evaluate(el => {
    const styles = window.getComputedStyle(el)
    return {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      borderColor: styles.borderColor,
      borderWidth: styles.borderWidth,
      borderStyle: styles.borderStyle,
      padding: styles.padding,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      display: styles.display,
      className: el.className,
      parentClassName: el.parentElement?.className || 'no parent'
    }
  })

  console.log('\n=== BADGE INSPECTION RESULTS ===\n')
  console.log('Element Classes:', computedStyles.className)
  console.log('Parent Classes:', computedStyles.parentClassName)
  console.log('\nComputed Styles:')
  console.log('  Background Color:', computedStyles.backgroundColor)
  console.log('  Text Color:', computedStyles.color)
  console.log('  Border Color:', computedStyles.borderColor)
  console.log('  Border Width:', computedStyles.borderWidth)
  console.log('  Border Style:', computedStyles.borderStyle)
  console.log('  Padding:', computedStyles.padding)
  console.log('  Font Size:', computedStyles.fontSize)
  console.log('  Font Weight:', computedStyles.fontWeight)
  console.log('  Display:', computedStyles.display)

  // Check if it's using lime yellow (the old bad color)
  const isLimeYellow = computedStyles.backgroundColor === 'rgb(173, 250, 29)' ||
                      computedStyles.backgroundColor === 'rgb(173, 250, 29)' ||
                      computedStyles.backgroundColor.includes('173')
  console.log('\nIs using lime yellow (#adfa1d / rgb(173, 250, 29))?', isLimeYellow ? 'YES - NEEDS FIX' : 'NO - GOOD')

  // Take a screenshot of the badge area
  const boundingBox = await badgeToInspect.boundingBox()
  if (boundingBox) {
    await page.screenshot({
      path: 'tests/reports/badge-screenshot.png',
      clip: {
        x: Math.max(0, boundingBox.x - 100),
        y: Math.max(0, boundingBox.y - 30),
        width: Math.min(400, boundingBox.width + 200),
        height: boundingBox.height + 60,
      },
    })
    console.log('\nScreenshot saved to tests/reports/badge-screenshot.png')
  }

  // Also get a full page screenshot showing the sidebar
  await page.screenshot({ path: 'tests/reports/sidebar-full.png' })
  console.log('Full page screenshot saved to tests/reports/sidebar-full.png')
})
