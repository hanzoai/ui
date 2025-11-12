import { chromium } from 'playwright';

async function verifyColorsPage() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleMessages: Array<{ type: string; text: string }> = [];
  const pageErrors: string[] = [];

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', err => {
    pageErrors.push(err.toString());
  });

  try {
    console.log('Navigating to http://localhost:3333/colors...');
    const response = await page.goto('http://localhost:3333/colors', {
      waitUntil: 'load',
      timeout: 30000
    });

    console.log(`Page load status: ${response.status()}`);

    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Check if main content exists
    const mainContent = await page.locator('main').count();
    console.log(`Main content found: ${mainContent > 0 ? 'Yes' : 'No'}`);

    // Get page text
    const bodyContent = await page.locator('body').textContent();
    console.log(`Body text length: ${bodyContent.length} characters`);

    // Check for color/theme related content
    const hasColorText = bodyContent.toLowerCase().includes('color');
    const hasThemeText = bodyContent.toLowerCase().includes('theme');
    console.log(`Color content detected: ${hasColorText ? 'Yes' : 'No'}`);
    console.log(`Theme content detected: ${hasThemeText ? 'Yes' : 'No'}`);

    // Get page headings
    const headings = await page.locator('h1, h2, h3, h4').allTextContents();
    console.log(`\nPage headings found: ${headings.length}`);
    headings.slice(0, 5).forEach((h, i) => {
      console.log(`  ${i + 1}. ${h}`);
    });

    // Count interactive elements
    const buttons = await page.locator('button').count();
    const inputs = await page.locator('input, select').count();
    console.log(`\nInteractive elements:`);
    console.log(`  Buttons: ${buttons}`);
    console.log(`  Inputs/Selects: ${inputs}`);

    // Check for color swatches (common patterns)
    const divs = await page.locator('div').count();
    console.log(`  Total divs: ${divs}`);

    // Look for specific color-related elements
    const colorElements = await page.locator('[style*="background"], [style*="color"]').count();
    console.log(`  Elements with color/background styles: ${colorElements}`);

    // Take screenshot
    const screenshotPath = '/tmp/colors-page.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\nScreenshot saved to: ${screenshotPath}`);

    // Check for errors
    console.log('\n--- Error Analysis ---');
    const errors = consoleMessages.filter(m => m.type === 'error');
    if (errors.length > 0) {
      console.log(`Console errors found: ${errors.length}`);
      errors.forEach((e, i) => console.log(`  ${i + 1}. ${e.text}`));
    } else {
      console.log('No console errors ✓');
    }

    if (pageErrors.length > 0) {
      console.log(`Page errors: ${pageErrors.length}`);
      pageErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    } else {
      console.log('No page errors ✓');
    }

    // Check for console warnings
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    if (warnings.length > 0) {
      console.log(`Console warnings: ${warnings.length}`);
      warnings.slice(0, 3).forEach((w, i) => console.log(`  ${i + 1}. ${w.text.substring(0, 100)}`));
    }

    console.log('\n--- Page Health Check ---');
    if (response.status() === 200) {
      console.log('Page loads successfully ✓');
    } else {
      console.log(`Page returned status ${response.status()} ✗`);
    }

    if (bodyContent.length > 500) {
      console.log('Page has substantial content ✓');
    } else {
      console.log('Page content seems minimal (possible render issue) ⚠');
    }

    if (errors.length === 0 && pageErrors.length === 0) {
      console.log('No errors or exceptions ✓');
    } else {
      console.log('Errors detected ✗');
    }

  } catch (error) {
    console.error(`Error during verification: ${error.message}`);
    const screenshotPath = '/tmp/colors-page-error.png';
    try {
      await page.screenshot({ path: screenshotPath });
      console.log(`Error screenshot saved to: ${screenshotPath}`);
    } catch {
      console.log('Could not take error screenshot');
    }
  } finally {
    await browser.close();
  }
}

verifyColorsPage().catch(console.error);
