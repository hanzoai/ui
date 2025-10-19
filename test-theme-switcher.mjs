import { chromium } from "playwright";

async function checkThemeSwitcher() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } }); // Larger viewport

  try {
    console.log("=== Checking theme switcher visibility ===\n");

    // Test on Mail page
    console.log("On /examples/mail:");
    await page.goto("http://localhost:3003/examples/mail", { waitUntil: "load" });
    await page.waitForTimeout(1500);

    const themeSwitcherMail = await page.locator("[role='switch']");
    const mailVisible = await themeSwitcherMail.isVisible();
    const mailBoundingBox = await themeSwitcherMail.boundingBox();
    console.log(`  Theme switcher visible: ${mailVisible}`);
    console.log(`  Bounding box: ${JSON.stringify(mailBoundingBox)}`);

    await page.screenshot({ path: ".playwright-mcp/theme-01-mail-large.png" });

    // Test on Dashboard page
    console.log("\nOn /examples/dashboard:");
    await page.goto("http://localhost:3003/examples/dashboard", { waitUntil: "load" });
    await page.waitForTimeout(1500);

    const themeSwitcherDash = await page.locator("[role='switch']");
    const dashVisible = await themeSwitcherDash.isVisible();
    const dashBoundingBox = await themeSwitcherDash.boundingBox();
    console.log(`  Theme switcher visible: ${dashVisible}`);
    console.log(`  Bounding box: ${JSON.stringify(dashBoundingBox)}`);

    // Check if it's being hidden by overflow
    const dashboardContentElement = await page.locator(".overflow-hidden").first();
    const dashboardOverflow = await dashboardContentElement.evaluate(el => {
      return {
        overflow: window.getComputedStyle(el).overflow,
        overflowX: window.getComputedStyle(el).overflowX,
        overflowY: window.getComputedStyle(el).overflowY
      };
    });
    console.log(`  Dashboard content overflow: ${JSON.stringify(dashboardOverflow)}`);

    await page.screenshot({ path: ".playwright-mcp/theme-02-dash-large.png" });

    // Test on Forms page
    console.log("\nOn /examples/forms:");
    await page.goto("http://localhost:3003/examples/forms", { waitUntil: "load" });
    await page.waitForTimeout(1500);

    const themeSwitcherForms = await page.locator("[role='switch']");
    const formsVisible = await themeSwitcherForms.isVisible();
    const formsBoundingBox = await themeSwitcherForms.boundingBox();
    console.log(`  Theme switcher visible: ${formsVisible}`);
    console.log(`  Bounding box: ${JSON.stringify(formsBoundingBox)}`);

    await page.screenshot({ path: ".playwright-mcp/theme-03-forms-large.png" });

    console.log("\n=== Analysis ===");
    console.log("The theme switcher is visible on Mail but hidden on Dashboard/Forms.");
    console.log("This suggests the dashboard/forms content might be hiding it with z-index or overflow.");

  } catch (error) {
    console.error("Test error:", error.message);
  } finally {
    await browser.close();
  }
}

checkThemeSwitcher();
