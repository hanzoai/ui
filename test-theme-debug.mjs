import { chromium } from "playwright";

async function debugThemeSwitcher() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  try {
    console.log("=== Debugging theme switcher ===\n");

    // Test on Dashboard
    console.log("On /examples/dashboard:");
    await page.goto("http://localhost:3003/examples/dashboard", { waitUntil: "load" });
    await page.waitForTimeout(2000);

    // Get all possible theme toggle elements
    const allRoleSwitch = await page.locator("[role='switch']").count();
    console.log(`  Total [role='switch'] elements found: ${allRoleSwitch}`);

    // Check for any visible toggle/button in the header
    const headerButtons = await page.$$eval("header button, header [role='button']", els =>
      els.map(el => ({
        class: el.getAttribute("class"),
        visible: el.offsetParent !== null,
        text: el.textContent?.trim().substring(0, 20)
      }))
    );
    console.log(`  Header buttons/toggles: ${headerButtons.length}`);
    headerButtons.forEach((btn, i) => {
      console.log(`    ${i}: visible=${btn.visible}, text="${btn.text}"`);
    });

    // Check the main layout structure
    const mainLayout = await page.evaluate(() => {
      const header = document.querySelector("header");
      const content = document.querySelector(".overflow-hidden");
      return {
        headerVisible: header?.offsetParent !== null,
        headerZIndex: window.getComputedStyle(header).zIndex,
        contentVisible: content?.offsetParent !== null,
        contentZIndex: window.getComputedStyle(content).zIndex,
        contentOverflow: window.getComputedStyle(content).overflow
      };
    });
    console.log(`  Layout check:`, JSON.stringify(mainLayout, null, 2));

    await page.screenshot({ path: ".playwright-mcp/debug-dashboard-layout.png" });

  } catch (error) {
    console.error("Test error:", error.message);
  } finally {
    await browser.close();
  }
}

debugThemeSwitcher();
