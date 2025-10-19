import { chromium } from "playwright";

async function runTests() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const results = {
    test1: {},
    test2: {},
    test3: {},
    theme_switcher: {},
    layout_issues: []
  };

  try {
    console.log("=== TEST 1: Check /examples/mail tab state ===");
    await page.goto("http://localhost:3003/examples/mail", { waitUntil: "load" });
    await page.waitForTimeout(2000);

    const pathname1 = await page.evaluate(() => window.location.pathname);
    console.log("1. On /examples/mail");

    const links1 = await page.$$eval('a[href*="/examples"]', els => 
      els.map(el => ({
        href: el.getAttribute("href"),
        text: el.textContent?.trim(),
        isHighlighted: el.getAttribute("class")?.includes("bg-muted")
      }))
    );

    const examplesOnMail = links1.find(l => l.href === "/examples");
    const mailOnMail = links1.find(l => l.href === "/examples/mail");

    console.log(`   Examples highlighted: ${examplesOnMail?.isHighlighted} (should be false)`);
    console.log(`   Mail highlighted: ${mailOnMail?.isHighlighted} (should be true)`);

    results.test1.examplesNotHighlighted = examplesOnMail?.isHighlighted === false;
    results.test1.mailHighlighted = mailOnMail?.isHighlighted === true;

    // Check theme switcher
    const themeSwitcherOnMail = await page.locator("[role='switch']").isVisible();
    console.log(`   Theme switcher visible: ${themeSwitcherOnMail}`);
    results.theme_switcher.onMail = themeSwitcherOnMail;

    await page.screenshot({ path: ".playwright-mcp/test-01-mail.png" });

    console.log("\n=== TEST 2: Check /examples/dashboard tab state ===");
    await page.goto("http://localhost:3003/examples/dashboard", { waitUntil: "load" });
    await page.waitForTimeout(2000);

    const pathname2 = await page.evaluate(() => window.location.pathname);
    console.log("2. On /examples/dashboard");

    const links2 = await page.$$eval('a[href*="/examples"]', els => 
      els.map(el => ({
        href: el.getAttribute("href"),
        text: el.textContent?.trim(),
        isHighlighted: el.getAttribute("class")?.includes("bg-muted")
      }))
    );

    const examplesOnDash = links2.find(l => l.href === "/examples");
    const dashOnDash = links2.find(l => l.href === "/examples/dashboard");

    console.log(`   Examples highlighted: ${examplesOnDash?.isHighlighted} (should be false)`);
    console.log(`   Dashboard highlighted: ${dashOnDash?.isHighlighted} (should be true)`);

    results.test2.examplesNotHighlighted = examplesOnDash?.isHighlighted === false;
    results.test2.dashHighlighted = dashOnDash?.isHighlighted === true;

    // Check theme switcher
    const themeSwitcherOnDash = await page.locator("[role='switch']").isVisible();
    console.log(`   Theme switcher visible: ${themeSwitcherOnDash}`);
    results.theme_switcher.onDashboard = themeSwitcherOnDash;

    await page.screenshot({ path: ".playwright-mcp/test-02-dashboard.png" });

    console.log("\n=== TEST 3: Check /examples/forms tab state ===");
    await page.goto("http://localhost:3003/examples/forms", { waitUntil: "load" });
    await page.waitForTimeout(2000);

    const pathname3 = await page.evaluate(() => window.location.pathname);
    console.log("3. On /examples/forms");

    const links3 = await page.$$eval('a[href*="/examples"]', els => 
      els.map(el => ({
        href: el.getAttribute("href"),
        text: el.textContent?.trim(),
        isHighlighted: el.getAttribute("class")?.includes("bg-muted")
      }))
    );

    const examplesOnForms = links3.find(l => l.href === "/examples");
    const formsOnForms = links3.find(l => l.href === "/examples/forms");

    console.log(`   Examples highlighted: ${examplesOnForms?.isHighlighted} (should be false)`);
    console.log(`   Forms highlighted: ${formsOnForms?.isHighlighted} (should be true)`);

    results.test3.examplesNotHighlighted = examplesOnForms?.isHighlighted === false;
    results.test3.formsHighlighted = formsOnForms?.isHighlighted === true;

    // Check theme switcher
    const themeSwitcherOnForms = await page.locator("[role='switch']").isVisible();
    console.log(`   Theme switcher visible: ${themeSwitcherOnForms}`);
    results.theme_switcher.onForms = themeSwitcherOnForms;

    await page.screenshot({ path: ".playwright-mcp/test-03-forms.png" });

    console.log("\n=== SUMMARY ===");
    const allTestsPassed = 
      results.test1.examplesNotHighlighted && results.test1.mailHighlighted &&
      results.test2.examplesNotHighlighted && results.test2.dashHighlighted &&
      results.test3.examplesNotHighlighted && results.test3.formsHighlighted;

    console.log("\nTest 1 (Mail page):", 
      results.test1.examplesNotHighlighted && results.test1.mailHighlighted ? "PASS" : "FAIL");
    console.log("Test 2 (Dashboard page):", 
      results.test2.examplesNotHighlighted && results.test2.dashHighlighted ? "PASS" : "FAIL");
    console.log("Test 3 (Forms page):", 
      results.test3.examplesNotHighlighted && results.test3.formsHighlighted ? "PASS" : "FAIL");

    console.log("\nTheme Switcher Visibility:");
    console.log("  On Mail:", results.theme_switcher.onMail ? "VISIBLE" : "HIDDEN");
    console.log("  On Dashboard:", results.theme_switcher.onDashboard ? "VISIBLE" : "HIDDEN");
    console.log("  On Forms:", results.theme_switcher.onForms ? "VISIBLE" : "HIDDEN");

    console.log("\nOverall Result:", allTestsPassed ? "✓ ALL TESTS PASSED" : "✗ SOME TESTS FAILED");

  } catch (error) {
    console.error("Test error:", error.message);
  } finally {
    await browser.close();
  }
}

runTests();
