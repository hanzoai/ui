import { chromium } from 'playwright';

const sites = [
  { name: 'shadcn', url: 'https://ui.shadcn.com' },
  { name: 'hanzo', url: 'http://localhost:3003' }
];

async function captureSite(browser, site) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log(`\n=== ${site.name.toUpperCase()} (${site.url}) ===`);

  try {
    await page.goto(site.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: `screenshot-${site.name}.png`, fullPage: false });

    // Get computed styles of key elements
    const styles = await page.evaluate(() => {
      const getComputedColor = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return 'NOT FOUND';
        const style = window.getComputedStyle(el);
        return {
          background: style.backgroundColor,
          color: style.color,
          border: style.borderColor
        };
      };

      return {
        primaryButton: getComputedColor('a[href*="docs"]'),
        announcement: getComputedColor('[class*="rounded-full"]'),
        heroText: getComputedColor('h1'),
        root: {
          primary: getComputedStyle(document.documentElement).getPropertyValue('--primary'),
          primaryFg: getComputedStyle(document.documentElement).getPropertyValue('--primary-foreground'),
          ring: getComputedStyle(document.documentElement).getPropertyValue('--ring')
        }
      };
    });

    console.log('CSS Variables:', styles.root);
    console.log('Primary Button:', styles.primaryButton);
    console.log('Announcement:', styles.announcement);

  } catch (error) {
    console.error(`Error capturing ${site.name}:`, error.message);
  }

  await context.close();
}

(async () => {
  const browser = await chromium.launch();

  for (const site of sites) {
    await captureSite(browser, site);
  }

  await browser.close();
  console.log('\n✓ Screenshots saved: screenshot-shadcn.png, screenshot-hanzo.png');
})();
