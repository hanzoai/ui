// Every layout name @hanzo/ui and @hanzo/gui both claimed, read in Chromium.
//
// jsdom cannot answer this. Measured on jsdom 28.1.0 under vitest 4: three
// IDENTICAL `<View display="grid" />` boxes in one document read grid, flex,
// flex — `getComputedStyle` resolves the cascade for the FIRST element queried
// and hands every later element the base `.is_View { display: flex }` instead.
// Neither a DOM mutation, a classList touch, a fresh sheet, a clone nor a
// re-parent clears it, so any jsdom suite reading more than one computed style
// reports the base rule from its second assertion on, silently.
//
// Run: node scripts/layout.mjs   (after `pnpm build`)
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'

import { alias } from './alias.mjs'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))

const server = await createServer({
  root: UI,
  configFile: false,
  logLevel: 'error',
  css: { postcss: { plugins: [] } },
  resolve: { alias },
  optimizeDeps: { include: ['react', 'react-dom/client', 'react-native-web'] },
  server: { port: 0 },
})
await server.listen()
const url = `${server.resolvedUrls.local[0].replace(/\/$/, '')}/test/layout.html`

const browser = await chromium.launch()
const tab = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const oops = []
tab.on('pageerror', (e) => oops.push(String(e)))
await tab.goto(url)
await tab.waitForSelector('[data-probe]', { state: 'attached', timeout: 30_000 })
await tab.waitForTimeout(300)

const read = await tab.evaluate(() => {
  const out = {}
  for (const el of document.querySelectorAll('[data-probe]')) {
    const s = getComputedStyle(el)
    out[el.dataset.probe] = {
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute('role') ?? '',
      slot: el.getAttribute('data-slot') ?? '',
      display: s.display,
      flexDirection: s.flexDirection,
      gridTemplateColumns: s.gridTemplateColumns,
      gridColumn: s.gridColumn,
      alignSelf: s.alignSelf,
      width: s.width,
      maxWidth: s.maxWidth,
      paddingTop: s.paddingTop,
      paddingLeft: s.paddingLeft,
      borderBottomWidth: s.borderBottomWidth,
      borderRightWidth: s.borderRightWidth,
      borderBottomColor: s.borderBottomColor,
      borderRightColor: s.borderRightColor,
      borderTopLeftRadius: s.borderTopLeftRadius,
      // Every prop gui failed to recognise arrives here instead, lowercased.
      leaked: [...el.attributes]
        .map((a) => a.name)
        .filter((n) => /^(grid|columns|rows|col|row|min|max|vertical|orientation|decorative|innerprops)/.test(n))
        .join(','),
    }
  }
  return out
})

await browser.close()
await server.close()

if (oops.length) {
  console.error(oops.join('\n'))
  process.exit(1)
}
console.log(JSON.stringify(read, null, 2))
