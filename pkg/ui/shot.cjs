// Capture mobile + desktop fullPage screenshots of a URL.
// usage: node shot.cjs <url> <outPrefix>
const { chromium } = require('@playwright/test');

const [url, outPrefix] = process.argv.slice(2);
if (!url || !outPrefix) {
  console.error('usage: node shot.cjs <url> <outPrefix>');
  process.exit(2);
}

const VIEWS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  for (const v of VIEWS) {
    const ctx = await browser.newContext({
      viewport: { width: v.width, height: v.height },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`[${v.name}] console: ${m.text()}`);
    });
    page.on('pageerror', (e) => errors.push(`[${v.name}] pageerror: ${e.message}`));

    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1200);

    const out = `${outPrefix}-${v.name}.png`;
    await page.screenshot({ path: out, fullPage: true });

    // report what actually rendered, so a blank page can't pass silently
    const info = await page.evaluate(() => {
      const b = document.body;
      const bg = getComputedStyle(b).backgroundColor;
      const html = getComputedStyle(document.documentElement).backgroundColor;
      return {
        bodyBg: bg,
        htmlBg: html,
        textLen: (b.innerText || '').trim().length,
        nodes: b.querySelectorAll('*').length,
        rootChildren: (document.getElementById('root') || b).children.length,
        title: document.title,
        sample: (b.innerText || '').trim().slice(0, 180).replace(/\s+/g, ' '),
      };
    });
    console.log(
      `${v.name}: status=${resp && resp.status()} -> ${out}\n` +
        `   title=${JSON.stringify(info.title)} bodyBg=${info.bodyBg} htmlBg=${info.htmlBg}\n` +
        `   domNodes=${info.nodes} rootChildren=${info.rootChildren} textLen=${info.textLen}\n` +
        `   text="${info.sample}"`
    );
    await ctx.close();
  }
  await browser.close();
  if (errors.length) {
    console.log('--- page errors ---');
    for (const e of errors.slice(0, 25)) console.log('   ' + e);
  } else {
    console.log('--- no console/page errors ---');
  }
})();
