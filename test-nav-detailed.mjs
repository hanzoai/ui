import { chromium } from "playwright";

async function runTests() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  try {
    console.log("=== Navigate directly to /examples ===");
    await page.goto("http://localhost:3003/examples", { waitUntil: "load" });
    await page.waitForTimeout(2000);

    const url1 = page.url();
    const pathname1 = await page.evaluate(() => window.location.pathname);
    console.log("URL:", url1);
    console.log("Pathname:", pathname1);

    // Get all nav links
    const links = await page.$$eval('a[href*="/examples"]', els => 
      els.map(el => ({
        href: el.getAttribute("href"),
        text: el.textContent,
        classes: el.getAttribute("class")
      }))
    );
    console.log("\nNav links on /examples:");
    links.forEach((link, i) => {
      const isHighlighted = link.classes?.includes("bg-muted");
      console.log(`  ${i}: ${link.href} - "${link.text?.trim()}" - Highlighted: ${isHighlighted}`);
    });

    await page.screenshot({ path: ".playwright-mcp/final-01-examples-page.png" });

    console.log("\n=== Navigate directly to /examples/dashboard ===");
    await page.goto("http://localhost:3003/examples/dashboard", { waitUntil: "load" });
    await page.waitForTimeout(2000);

    const url2 = page.url();
    const pathname2 = await page.evaluate(() => window.location.pathname);
    console.log("URL:", url2);
    console.log("Pathname:", pathname2);

    const links2 = await page.$$eval('a[href*="/examples"]', els => 
      els.map(el => ({
        href: el.getAttribute("href"),
        text: el.textContent,
        classes: el.getAttribute("class")
      }))
    );
    console.log("\nNav links on /examples/dashboard:");
    links2.forEach((link, i) => {
      const isHighlighted = link.classes?.includes("bg-muted");
      console.log(`  ${i}: ${link.href} - "${link.text?.trim()}" - Highlighted: ${isHighlighted}`);
    });

    // Check if Examples is highlighted (it should NOT be)
    const examplesLink = links2.find(l => l.href === "/examples");
    if (examplesLink && !examplesLink.classes?.includes("bg-muted")) {
      console.log("\n✓ PASS: Examples is NOT highlighted on /examples/dashboard");
    } else {
      console.log("\n✗ FAIL: Examples IS highlighted on /examples/dashboard (BUG)");
    }

    // Check if Dashboard is highlighted (it should be)
    const dashboardLink = links2.find(l => l.href === "/examples/dashboard");
    if (dashboardLink && dashboardLink.classes?.includes("bg-muted")) {
      console.log("✓ PASS: Dashboard IS highlighted on /examples/dashboard");
    } else {
      console.log("✗ FAIL: Dashboard is NOT highlighted on /examples/dashboard");
    }

    await page.screenshot({ path: ".playwright-mcp/final-02-dashboard-page.png" });

  } catch (error) {
    console.error("Test error:", error.message);
  } finally {
    await browser.close();
  }
}

runTests();
