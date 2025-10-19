import { chromium } from "playwright";

async function runTests() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  try {
    console.log("Step 1: Navigate to examples base route...");
    await page.goto("http://localhost:3003/examples", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000); // Wait for rendering
    await page.screenshot({ path: ".playwright-mcp/01-examples-base.png" });

    // Check which tabs are highlighted using CSS
    const examplesLink = page.locator('a[href="/examples"]');
    const examplesClass = await examplesLink.getAttribute("class");
    console.log("Examples link classes:", examplesClass);

    if (examplesClass.includes("bg-muted") && examplesClass.includes("text-primary")) {
      console.log("✓ Examples tab IS highlighted on /examples route");
    } else {
      console.log("✗ Examples tab is NOT highlighted on /examples route");
    }

    console.log("\nStep 2: Click on Mail tab...");
    await page.click('a[href="/examples/mail"]');
    await page.waitForURL("/examples/mail", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: ".playwright-mcp/02-mail-clicked.png" });

    const examplesLinkAfterMail = page.locator('a[href="/examples"]');
    const examplesClassAfterMail = await examplesLinkAfterMail.getAttribute("class");
    console.log("Examples link classes after Mail click:", examplesClassAfterMail);

    const mailLink = page.locator('a[href="/examples/mail"]');
    const mailClass = await mailLink.getAttribute("class");
    console.log("Mail link classes:", mailClass);

    if (!examplesClassAfterMail.includes("bg-muted")) {
      console.log("✓ Examples tab is NO LONGER highlighted on /examples/mail");
    } else {
      console.log("✗ Examples tab is STILL highlighted on /examples/mail (BUG)");
    }

    if (mailClass.includes("bg-muted") && mailClass.includes("text-primary")) {
      console.log("✓ Mail tab IS highlighted on /examples/mail");
    } else {
      console.log("✗ Mail tab is NOT highlighted on /examples/mail");
    }

    // Check for theme switcher
    const themeSwitcher = page.locator("[role='switch']");
    const isSwitcherVisible = await themeSwitcher.isVisible();
    console.log("\nTheme switcher visible:", isSwitcherVisible ? "✓ YES" : "✗ NO");

    if (!isSwitcherVisible) {
      await page.screenshot({ path: ".playwright-mcp/02-mail-missing-theme-switcher.png" });
    }

    console.log("\nStep 3: Click on Dashboard tab...");
    await page.click('a[href="/examples/dashboard"]');
    await page.waitForURL("/examples/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: ".playwright-mcp/03-dashboard-clicked.png" });

    const examplesLinkAfterDash = page.locator('a[href="/examples"]');
    const examplesClassAfterDash = await examplesLinkAfterDash.getAttribute("class");
    console.log("Examples link classes after Dashboard click:", examplesClassAfterDash);

    const dashLink = page.locator('a[href="/examples/dashboard"]');
    const dashClass = await dashLink.getAttribute("class");
    console.log("Dashboard link classes:", dashClass);

    if (!examplesClassAfterDash.includes("bg-muted")) {
      console.log("✓ Examples tab is NO LONGER highlighted on /examples/dashboard");
    } else {
      console.log("✗ Examples tab is STILL highlighted on /examples/dashboard (BUG)");
    }

    if (dashClass.includes("bg-muted") && dashClass.includes("text-primary")) {
      console.log("✓ Dashboard tab IS highlighted on /examples/dashboard");
    } else {
      console.log("✗ Dashboard tab is NOT highlighted on /examples/dashboard");
    }

    console.log("\nStep 4: Go back to /examples base route...");
    await page.goto("http://localhost:3003/examples", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: ".playwright-mcp/04-back-to-examples.png" });

    const examplesLinkFinal = page.locator('a[href="/examples"]');
    const examplesClassFinal = await examplesLinkFinal.getAttribute("class");
    console.log("Examples link classes on final /examples:", examplesClassFinal);

    if (examplesClassFinal.includes("bg-muted") && examplesClassFinal.includes("text-primary")) {
      console.log("✓ Examples tab IS highlighted on /examples");
    } else {
      console.log("✗ Examples tab is NOT highlighted on /examples");
    }

    console.log("\n✓ All tests completed!");
  } catch (error) {
    console.error("Test error:", error.message);
  } finally {
    await browser.close();
  }
}

runTests();
