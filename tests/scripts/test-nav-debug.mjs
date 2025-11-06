import { chromium } from "playwright";

async function runTests() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  try {
    console.log("=== TEST 1: Navigate to /examples ===");
    await page.goto("http://localhost:3003/examples", { waitUntil: "load" });
    await page.waitForTimeout(2000);

    // Get the full HTML of the nav area to debug
    const navHtml = await page.locator('a[href="/examples"]').innerHTML();
    console.log("Examples link HTML:", navHtml);

    const pathname = await page.evaluate(() => window.location.pathname);
    console.log("Current pathname:", pathname);

    // Check all nav links
    const allLinks = await page.locator('a[href*="/examples"]').all();
    console.log("Total examples links found:", allLinks.length);

    for (let i = 0; i < allLinks.length; i++) {
      const href = await allLinks[i].getAttribute("href");
      const text = await allLinks[i].textContent();
      const classes = await allLinks[i].getAttribute("class");
      const isHighlighted = classes.includes("bg-muted");
      console.log(`  Link ${i}: ${href} - "${text}" - Highlighted: ${isHighlighted}`);
    }

    await page.screenshot({ path: ".playwright-mcp/debug-01-examples-page.png" });

    console.log("\n=== TEST 2: Navigate to /examples/mail ===");
    // Try clicking with a more detailed approach
    const mailLink = page.locator('a[href="/examples/mail"]');
    const mailLinkExists = await mailLink.count();
    console.log("Mail link exists:", mailLinkExists > 0);

    if (mailLinkExists > 0) {
      await mailLink.click();
      await page.waitForTimeout(2000);

      const pathnameAfterMail = await page.evaluate(() => window.location.pathname);
      console.log("Current pathname after Mail click:", pathnameAfterMail);

      // Check all nav links again
      const allLinksAfterMail = await page.locator('a[href*="/examples"]').all();
      console.log("Total examples links after Mail:", allLinksAfterMail.length);

      for (let i = 0; i < allLinksAfterMail.length; i++) {
        const href = await allLinksAfterMail[i].getAttribute("href");
        const text = await allLinksAfterMail[i].textContent();
        const classes = await allLinksAfterMail[i].getAttribute("class");
        const isHighlighted = classes.includes("bg-muted");
        console.log(`  Link ${i}: ${href} - "${text}" - Highlighted: ${isHighlighted}`);
      }

      await page.screenshot({ path: ".playwright-mcp/debug-02-mail-page.png" });
    }

  } catch (error) {
    console.error("Test error:", error.message);
  } finally {
    await browser.close();
  }
}

runTests();
