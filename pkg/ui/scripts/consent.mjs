// The cookie bar, measured in a real browser: that its × is centred on the bar's
// first line (the words, the link or the buttons beside them; words taller than
// the × start level with its top), stands in the
// inline-end corner and covers none of the words, under both rules that draw a
// bar (`eu` and `global`), under a mouse at 1280 wide and a finger at 390, dark
// and light, left-to-right and right-to-left; and that pressing it is an answer
// the next page load keeps. Each case writes a screenshot so a person can look.
//
// Run: node scripts/consent.mjs [out-dir]   (needs dist/theme.css: `node scripts/compose-theme.mjs`)
//
// jsdom cannot answer any of this: it lays nothing out. The × once stood at the
// bar's top padding over a 24px line, so it hung 6px below the words with its
// foot on the bar's edge, and every suite that read the markup passed.
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'

import { alias } from './alias.mjs'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))
const OUT = resolve(process.argv[2] ?? join(UI, 'test-results', 'consent'))
mkdirSync(OUT, { recursive: true })

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
const base = `${server.resolvedUrls.local[0].replace(/\/$/, '')}/test/consent.html`

const browser = await chromium.launch()
const failures = []
const check = (ok, what) => {
  if (!ok) failures.push(what)
}

/** The bar that asks under each rule, and the × that answers it (the bar's one icon button; its name is in the page's language). */
const BAR = { eu: '[data-slot="consent"][role="dialog"]', global: '[data-slot="consent"][role="region"]' }
const X = 'button[data-size="icon"]'

/** Boxes read in ONE frame: the bar, its ×, the words' line and the controls on the bar's first line. */
const boxes = (tab, mode) =>
  tab.evaluate(
    ([sel, close]) => {
      const box = (el) => {
        const b = el.getBoundingClientRect()
        return { x: b.left, y: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height, mid: (b.top + b.bottom) / 2 }
      }
      const bar = document.querySelector(sel)
      if (!bar) return null
      const x = bar.querySelector(close)
      const words = bar.querySelector('p')
      const line = box(words.parentElement)
      // Every other control, and the ones that share the words' line.
      const controls = [...bar.querySelectorAll('button')].filter((b) => b !== x).map(box)
      return {
        vw: innerWidth,
        scroll: document.documentElement.scrollWidth,
        bar: box(bar),
        x: box(x),
        words: box(words),
        line,
        beside: controls.filter((c) => c.y < line.b && c.b > line.y),
      }
    },
    [BAR[mode], X],
  )

/** The rule, served again on a reload, the way cloud answers every page. */
const settle = (tab) => tab.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))

for (const mode of ['global', 'eu'])
  for (const width of [1280, 390])
    for (const theme of ['dark', 'light'])
      for (const dir of ['ltr', 'rtl']) {
        const name = `${mode}-${width}-${theme}-${dir}`
        const touch = width < 600
        const ctx = await browser.newContext({ viewport: { width, height: touch ? 844 : 800 }, colorScheme: theme, hasTouch: touch })
        const tab = await ctx.newPage()
        const oops = []
        tab.on('pageerror', (e) => oops.push(String(e)))
        const url = `${base}?mode=${mode}&theme=${theme}&dir=${dir}`
        await tab.goto(url)
        await tab.waitForSelector(BAR[mode], { timeout: 60_000 })
        // RTL reads its catalog after the first paint: measure the bar in its own words.
        if (dir === 'rtl') await tab.waitForFunction((sel) => /[؀-ۿ]/.test(document.querySelector(sel)?.textContent ?? ''), BAR[mode], { timeout: 10_000 }).catch(() => {})
        await settle(tab)

        const m = await boxes(tab, mode)
        const { bar, x, words, line, beside } = m
        const at = (n) => Math.round(n * 10) / 10
        check(m.scroll <= m.vw, `${name}: the page does not scroll sideways (${m.scroll} > ${m.vw})`)
        check(x.w >= (touch ? 44 : 36) && x.h >= (touch ? 44 : 36), `${name}: the × is a ${touch ? 44 : 36}px target (${x.w}x${x.h})`)
        // Words of one or two lines make a line the ×'s height, and the × is centred on it; words
        // taller than the × (three lines on a phone) start level with its top, in the corner.
        if (line.h <= x.h + 1) check(Math.abs(x.mid - line.mid) <= 1, `${name}: the × is centred on the bar's first line (× ${at(x.mid)}, line ${at(line.mid)})`)
        else check(Math.abs(x.y - line.y) <= 1, `${name}: words taller than the × start level with its top (× ${at(x.y)}, words ${at(line.y)})`)
        check(x.y >= bar.y + 1 && x.b <= bar.b - 1, `${name}: the × is inside the bar (× ${at(x.y)}–${at(x.b)}, bar ${at(bar.y)}–${at(bar.b)})`)
        for (const c of beside) check(Math.abs(c.mid - x.mid) <= 1, `${name}: a control on the first line is level with the × (${at(c.mid)} vs ${at(x.mid)})`)
        if (!touch) {
          // One line: the words, the controls and the × all stand on the bar's middle.
          check(Math.abs(words.mid - x.mid) <= 1, `${name}: the words are level with the × (${at(words.mid)} vs ${at(x.mid)})`)
          check(Math.abs(bar.mid - x.mid) <= 1, `${name}: the × is centred in the bar (bar ${at(bar.mid)}, × ${at(x.mid)})`)
          check(beside.length >= 1, `${name}: the bar's controls share its one line`)
        }
        // The inline-end corner, clear of the words.
        if (dir === 'ltr') {
          check(Math.abs(bar.r - x.r - 13) <= 2, `${name}: the × sits 12px inside the bar's right edge (${at(bar.r - x.r)})`)
          check(words.r <= x.x - 4, `${name}: the words end before the × (${at(words.r)} vs ${at(x.x)})`)
        } else {
          check(Math.abs(x.x - bar.x - 13) <= 2, `${name}: the × sits 12px inside the bar's left edge in RTL (${at(x.x - bar.x)})`)
          check(words.x >= x.r + 4, `${name}: the words end before the × in RTL (${at(words.x)} vs ${at(x.r)})`)
        }
        await tab.screenshot({ path: join(OUT, `${name}.png`) })

        // The × is an answer, and the next page load keeps it.
        await tab.click(`${BAR[mode]} ${X}`)
        await tab.waitForSelector(BAR[mode], { state: 'detached', timeout: 5_000 }).catch(() => {})
        check((await tab.locator(BAR[mode]).count()) === 0, `${name}: the × closes the bar`)
        const jar = Object.fromEntries((await ctx.cookies()).map((c) => [c.name, c.value]))
        if (mode === 'global') check(jar.hz_consent_notice === '1', `${name}: the × records the notice as seen (${JSON.stringify(jar)})`)
        else check(jar.hz_consent === '' && jar.hz_consent_rule === 'eu', `${name}: the × stores essential cookies only (${JSON.stringify(jar)})`)
        await tab.reload()
        await tab.waitForSelector('#root > *', { timeout: 60_000 })
        await tab.waitForTimeout(300)
        check((await tab.locator(BAR[mode]).count()) === 0, `${name}: a reload does not ask again`)

        check(oops.length === 0, `${name}: page errors: ${oops.join(' | ')}`)
        await ctx.close()
      }

await browser.close()
await server.close()

console.log(`consent: screenshots in ${OUT}`)
if (failures.length) {
  console.error(failures.map((f) => `  ✗ ${f}`).join('\n'))
  process.exit(1)
}
console.log('consent: every case passed')
