// Corner, measured in a real browser: where the trigger sits, which way the card
// opens, that it stays inside the window, that the keyboard reaches everything,
// and that the theme row writes the library's own preference. Every case runs at
// 1280 and 390 wide, dark and light, left-to-right and right-to-left, and writes
// a screenshot of each so a person can look.
//
// Run: node scripts/corner.mjs [out-dir]   (needs dist/theme.css: `node scripts/compose-theme.mjs`)
//
// jsdom cannot answer any of this: it lays nothing out and resolves no floating
// placement, and the placement in a right-to-left document is the question.
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'

import { alias } from './alias.mjs'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))
const OUT = resolve(process.argv[2] ?? join(UI, 'test-results', 'corner'))
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
const base = `${server.resolvedUrls.local[0].replace(/\/$/, '')}/test/corner.html`

const browser = await chromium.launch()
const failures = []
const check = (ok, what) => {
  if (!ok) failures.push(what)
}

/** Boxes read in ONE frame, so a scroll between two reads cannot skew them. */
const boxes = (tab) =>
  tab.evaluate(() => {
    const r = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const b = el.getBoundingClientRect()
      return { x: b.left, y: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }
    }
    return {
      vw: innerWidth,
      vh: innerHeight,
      scroll: document.documentElement.scrollWidth,
      trigger: r('[data-slot="corner-trigger"]'),
      card: r('[data-slot="corner-card"]'),
    }
  })

/**
 * The card's box once it stops moving: the popper places it a frame or two after
 * it mounts, later on a loaded machine, so a read taken on a timer can catch it
 * mid-flight. Two reads a frame apart that agree are the placement.
 */
const settled = async (tab) => {
  let last = ''
  for (let i = 0; i < 100; i++) {
    const now = await tab.evaluate(
      () =>
        new Promise((done) =>
          requestAnimationFrame(() => {
            const el = document.querySelector('[data-slot="corner-card"]')
            const b = el?.getBoundingClientRect()
            done(b ? `${b.left},${b.top},${b.width},${b.height}` : '')
          }),
        ),
    )
    if (now && now === last) return
    last = now
  }
}

for (const width of [1280, 390])
  for (const theme of ['dark', 'light'])
    for (const dir of ['ltr', 'rtl']) {
      const name = `${width}-${theme}-${dir}`
      const ctx = await browser.newContext({
        viewport: { width, height: width > 600 ? 800 : 844 },
        colorScheme: theme,
        hasTouch: width < 600,
      })
      const tab = await ctx.newPage()
      const oops = []
      tab.on('pageerror', (e) => oops.push(String(e)))
      // The person's stored choice, read by `<Hanzo>` the way it is on every load.
      await tab.addInitScript((t) => localStorage.setItem('hanzo.appearance', JSON.stringify({ theme: t })), theme)
      await tab.goto(`${base}?dir=${dir}`)
      await tab.waitForSelector('[data-slot="corner-trigger"]', { timeout: 60_000 })
      await tab.waitForFunction((t) => document.documentElement.classList.contains(t), theme, { timeout: 10_000 }).catch(() => {})

      const shut = await boxes(tab)
      const t = shut.trigger
      check(t && t.b <= shut.vh && shut.vh - t.b <= 24, `${name}: trigger sits at the foot (${t && shut.vh - t.b}px off)`)
      if (dir === 'ltr') check(t && t.x <= 24, `${name}: trigger at the left in LTR (x=${t?.x})`)
      else check(t && shut.vw - t.r <= 24, `${name}: trigger at the right in RTL (${t && shut.vw - t.r}px off)`)
      check(t && t.w <= 44 && t.h <= 44, `${name}: trigger is small (${t?.w}x${t?.h})`)
      if (width < 600) check(t && t.w >= 44 && t.h >= 44, `${name}: trigger is a 44px touch target (${t?.w}x${t?.h})`)
      check(
        await tab.evaluate((t) => document.documentElement.classList.contains(t), theme),
        `${name}: the stored theme painted the document`,
      )
      await tab.screenshot({ path: join(OUT, `${name}-closed.png`) })

      // Open from the keyboard: focus lands inside the card.
      await tab.focus('[data-slot="corner-trigger"]')
      await tab.keyboard.press('Enter')
      await tab.waitForSelector('[data-slot="corner-card"]')
      await settled(tab)
      const opened = await boxes(tab)
      const c = opened.card
      check(c && c.x >= 0 && c.r <= opened.vw && c.y >= 0 && c.b <= opened.vh, `${name}: card inside the window ${JSON.stringify(c)}`)
      check(c && t && c.b <= t.y + 1, `${name}: card opens above the trigger`)
      if (dir === 'ltr') check(c && t && Math.abs(c.x - t.x) <= 2 && c.r > t.r, `${name}: card opens inward from the left (${c?.x} vs ${t?.x})`)
      else check(c && t && Math.abs(c.r - t.r) <= 2 && c.x < t.x, `${name}: card opens inward from the right (${c?.r} vs ${t?.r})`)
      check(opened.scroll <= opened.vw, `${name}: no sideways scroll (${opened.scroll} > ${opened.vw})`)
      check(
        await tab.evaluate(() => !!document.activeElement?.closest('[data-slot="corner-card"]')),
        `${name}: focus moved into the card`,
      )
      // Touch targets: every control in the card is 44px tall under a finger.
      if (width < 600) {
        const short = await tab.evaluate(() =>
          [...document.querySelectorAll('[data-slot="corner-card"] [data-corner-stop]')]
            .map((el) => el.getBoundingClientRect().height)
            .filter((h) => h < 44),
        )
        check(short.length === 0, `${name}: rows under 44px on touch: ${short.join(',')}`)
      }
      await tab.screenshot({ path: join(OUT, `${name}-open.png`) })

      // The arrows walk the card: down from the first link reaches the second.
      const first = await tab.evaluate(() => document.activeElement?.textContent)
      await tab.keyboard.press('ArrowDown')
      const second = await tab.evaluate(() => document.activeElement?.textContent)
      check(first && second && first !== second, `${name}: ArrowDown moves through the card (${first} -> ${second})`)

      // The language list: search, choose, back on the card with the new value.
      await tab.click('[data-corner-row="language"]')
      await tab.waitForSelector('[data-slot="corner-list"]')
      await settled(tab)
      check(
        await tab.evaluate(() => document.activeElement?.getAttribute('role') === 'combobox'),
        `${name}: a long list focuses its search`,
      )
      check(
        (await tab.locator('[data-slot="corner-option"]').count()) === 85,
        `${name}: all 85 languages listed`,
      )
      const listed = await boxes(tab)
      const l = listed.card
      check(l && l.x >= 0 && l.r <= listed.vw && l.y >= 0 && l.b <= listed.vh, `${name}: list card inside the window ${JSON.stringify(l)}`)
      await tab.screenshot({ path: join(OUT, `${name}-language.png`) })
      await tab.keyboard.type('deu')
      check((await tab.locator('[data-slot="corner-option"]').count()) === 1, `${name}: search narrows to Deutsch`)
      await tab.keyboard.press('Enter')
      await tab.waitForSelector('[data-corner-row="language"]')
      const value = await tab.locator('[data-corner-row="language"]').textContent()
      check(value?.includes('Deutsch'), `${name}: the row shows the chosen language (${value})`)
      check(
        await tab.evaluate(() => document.activeElement?.getAttribute('data-corner-row') === 'language'),
        `${name}: focus returns to the row the list opened from`,
      )

      // Escape in a list goes back; Escape on the card closes and focus returns.
      await tab.click('[data-corner-row="currency"]')
      await tab.waitForSelector('[data-slot="corner-list"]')
      await tab.keyboard.press('Escape')
      check((await tab.locator('[data-corner-row="currency"]').count()) === 1, `${name}: Escape in a list returns to the card`)
      await tab.keyboard.press('Escape')
      await tab.waitForSelector('[data-slot="corner-card"]', { state: 'detached' })
      check((await tab.locator('[data-slot="corner-card"]').count()) === 0, `${name}: Escape closes the card`)
      check(
        await tab.evaluate(() => document.activeElement?.getAttribute('data-slot') === 'corner-trigger'),
        `${name}: focus returns to the trigger`,
      )

      // Theme: the other ground, written where the library keeps it.
      const other = theme === 'dark' ? 'light' : 'dark'
      await tab.click('[data-slot="corner-trigger"]')
      await tab.waitForSelector('[data-slot="corner-card"]')
      await tab.click(`[data-slot="corner-theme"] [role="radio"]:nth-child(${other === 'light' ? 2 : 3})`)
      await tab.waitForFunction((o) => document.documentElement.classList.contains(o), other, { timeout: 5_000 }).catch(() => {})
      check(
        await tab.evaluate((o) => document.documentElement.classList.contains(o), other),
        `${name}: choosing ${other} paints the document`,
      )
      check(
        (await tab.evaluate(() => JSON.parse(localStorage.getItem('hanzo.appearance') || '{}').theme)) === other,
        `${name}: choosing ${other} is stored as the person's appearance`,
      )

      check(oops.length === 0, `${name}: page errors: ${oops.join(' | ')}`)
      await ctx.close()
    }

await browser.close()
await server.close()

console.log(`corner: screenshots in ${OUT}`)
if (failures.length) {
  console.error(failures.map((f) => `  ✗ ${f}`).join('\n'))
  process.exit(1)
}
console.log('corner: every case passed')
