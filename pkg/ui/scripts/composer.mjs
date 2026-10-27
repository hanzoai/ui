// The composer, measured in a real browser: on a phone (390 and 440 wide) and a
// laptop, dark and light, as Chat hands it its slots and as Dev does (three
// pills, a carried file, the commands). Every control in the row is the
// composer's control size and on one centreline, the gaps between neighbours
// are one gap, the pills stand as tall as the controls, fully round with no
// fill, nothing runs past the frame, and the effort's level reads whole. Then
// the fill: unset, `--composer-fill` leaves the composer the material every
// glass surface is; set, the composer alone takes it. A screenshot of each case.
//
// Run: node scripts/composer.mjs [out-dir]   (needs dist/theme.css: `node scripts/compose-theme.mjs`)
//
// jsdom lays nothing out and computes no colour, and both are the question.
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'

import { alias } from './alias.mjs'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))
const OUT = resolve(process.argv[2] ?? join(UI, 'test-results', 'composer'))
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
const base = `${server.resolvedUrls.local[0].replace(/\/$/, '')}/test/composer.html`

const browser = await chromium.launch()
const failures = []
const check = (ok, what) => {
  if (!ok) failures.push(what)
}
const near = (a, b) => Math.abs(a - b) <= 1

/** The composer's one gap between neighbours in a row, px (Composer.tsx `SPACE`). */
const SPACE = 4

/** Every box the gates read, in ONE frame. */
const measure = (tab) =>
  tab.evaluate(() => {
    const box = (el) => {
      const b = el.getBoundingClientRect()
      return { x: b.left, r: b.right, y: b.top, b: b.bottom, w: b.width, h: b.height, cy: b.top + b.height / 2 }
    }
    const frame = document.querySelector('[data-slot="composer"]')
    const within = (sel) => [...frame.querySelectorAll(sel)]
    // The row's controls, each a box the finger lands on, in reading order.
    const controls = (group) =>
      [
        ...within(`[data-slot="${group}"] [data-slot="plus"]`),
        ...within(`[data-slot="${group}"] [data-slot="composer-carried"]`),
        ...within(`[data-slot="${group}"] [data-slot="dial-button"]`),
        ...within(`[data-slot="${group}"] [data-slot="chip-select"]`),
        ...within(`[data-slot="${group}"] [data-slot="dictation"] button`),
        ...within(`[data-slot="${group}"] [data-slot="composer-send"]`),
        ...within(`[data-slot="${group}"] [data-slot="composer-talk"]`),
      ]
        .map((el) => ({ name: el.getAttribute('data-slot') || el.getAttribute('aria-label') || el.tagName, ...box(el) }))
        .sort((a, b) => a.x - b.x)
    // The frame's rows of chips: the pills, and on a phone what the draft carries.
    const chips = (sel) =>
      within(sel).map((el) => {
        const s = getComputedStyle(el)
        return { name: el.getAttribute('aria-label') || el.textContent, ...box(el), radius: parseFloat(s.borderTopLeftRadius), bg: s.backgroundColor, edge: parseFloat(s.borderTopWidth) }
      })
    const pills = chips('[data-slot="composer-pills"] [data-slot="chip-select"]')
    const carry = chips('[data-slot="composer-carry"] [data-slot="composer-carried"]')
    const pip = frame.querySelector('[data-slot="dial-pip"]')
    const dial = frame.querySelector('[data-slot="dial-button"]')
    const gauge = dial?.querySelector('svg')
    // The glyphs themselves, not the box they are set in: what a reader sees of the level.
    const ink = (() => {
      if (!pip) return null
      const range = document.createRange()
      range.selectNodeContents(pip)
      return box(range)
    })()
    const fr = box(frame)
    const s = getComputedStyle(frame)
    const inner = { x: fr.x + parseFloat(s.borderLeftWidth), r: fr.r - parseFloat(s.borderRightWidth) }
    const past = [...frame.querySelectorAll('*')]
      .filter((el) => {
        const b = el.getBoundingClientRect()
        return b.width > 0 && (b.left < inner.x - 0.5 || b.right > inner.r + 0.5)
      })
      .map((el) => el.getAttribute('data-slot') || el.tagName)
    return {
      vw: innerWidth,
      scroll: document.documentElement.scrollWidth,
      frame: fr,
      start: controls('composer-start'),
      end: controls('composer-end'),
      pills,
      carry,
      past,
      pip: pip && { ...ink, text: pip.textContent },
      dial: dial && box(dial),
      gauge: gauge && box(gauge),
    }
  })

/** The space between each control and the next, px. */
const gaps = (row) => row.slice(1).map((c, i) => +(c.x - row[i].r).toFixed(1))

const round = (n) => Math.round(n * 10) / 10
const report = []

for (const [width, height] of [
  [390, 844],
  [440, 956],
  [1280, 800],
])
  for (const theme of ['dark', 'light'])
    for (const kind of ['chat', 'dev']) {
      const name = `${kind}-${width}-${theme}`
      const phone = width < 640
      const hit = phone ? 36 : 32
      const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: theme, hasTouch: phone })
      const tab = await ctx.newPage()
      const oops = []
      tab.on('pageerror', (e) => oops.push(String(e)))
      await tab.addInitScript((t) => localStorage.setItem('hanzo.appearance', JSON.stringify({ theme: t })), theme)
      // A cold dev server transforms the whole graph on the first load: wait for the composer, not the load event.
      await tab.goto(`${base}?case=${kind}`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
      await tab.waitForSelector('[data-slot="composer-send"], [data-slot="composer-talk"]', { timeout: 120_000 })
      await tab.waitForFunction((t) => document.documentElement.classList.contains(t), theme, { timeout: 10_000 }).catch(() => {})
      await tab.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))

      const m = await measure(tab)
      const row = [...m.start, ...m.end]
      // A phone carries the draft's file in a row of its own; a laptop after `+`, as the 28px tab it was.
      check(row.length === (kind === 'chat' ? 5 : phone ? 6 : 7), `${name}: the row draws its controls (${row.map((c) => c.name).join(', ')})`)
      for (const c of row) if (phone || c.name !== 'composer-carried') check(near(c.h, hit), `${name}: ${c.name} is ${hit}px tall (${round(c.h)})`)
      const mid = row[0].cy
      for (const c of row) check(near(c.cy, mid), `${name}: ${c.name} on the row's centreline (${round(c.cy)} vs ${round(mid)})`)
      // Between the start and the end lies the field's free width; within each, one gap.
      const all = [...gaps(m.start), ...gaps(m.end)]
      if (phone) for (const g of all) check(near(g, SPACE), `${name}: every gap is one gap (${all.join(', ')})`)
      const rows = kind === 'dev' ? { pills: m.pills, carried: phone ? m.carry : [] } : {}
      if (kind === 'dev') check(m.pills.length === 3 && m.carry.length === (phone ? 1 : 0), `${name}: three pills, and on a phone the carried file above the field`)
      for (const [what, chips] of Object.entries(rows)) {
        for (const p of chips) {
          check(near(p.h, hit), `${name}: ${p.name} stands as tall as the controls (${round(p.h)} vs ${hit})`)
          check(near(p.cy, chips[0].cy), `${name}: ${p.name} on the ${what}' centreline`)
          check(p.radius >= p.h / 2 - 0.5, `${name}: ${p.name} is fully round (${p.radius}px)`)
          check(p.bg === 'rgba(0, 0, 0, 0)', `${name}: ${p.name} has no fill (${p.bg})`)
          check(p.edge === 1, `${name}: ${p.name} wears a hairline (${p.edge}px)`)
        }
        const g = gaps(chips)
        for (const one of g) check(near(one, SPACE), `${name}: the ${what}' gaps are the row's (${g.join(', ')})`)
        if (chips.length) check(near(chips[0].x, m.start[0].x), `${name}: the ${what} start at the controls' edge (${round(chips[0].x)} vs ${round(m.start[0].x)})`)
      }
      check(m.past.length === 0, `${name}: nothing runs past the frame (${m.past.join(', ')})`)
      check(m.scroll <= m.vw, `${name}: no sideways scroll (${m.scroll} > ${m.vw})`)
      check(m.pip?.text === (kind === 'dev' ? 'MAX' : 'A'), `${name}: the effort's level is drawn (${m.pip?.text})`)
      check(m.pip && m.dial && m.pip.x >= m.dial.x - 0.5 && m.pip.r <= m.dial.r + 0.5 && m.pip.y >= m.dial.y - 0.5 && m.pip.b <= m.dial.b + 0.5, `${name}: the level's glyphs sit whole inside the dial`)
      if (phone) check(m.pip && m.gauge && m.pip.x >= m.gauge.r, `${name}: the level stands beside the gauge, clear of it (${round(m.pip?.x)} vs ${round(m.gauge?.r)})`)

      report.push(
        `${name}: row ${row.map((c) => `${c.name.replace('composer-', '')} ${round(c.w)}x${round(c.h)}@${round(c.cy)}`).join(' · ')} | gaps ${all.join(',')}` +
          (kind === 'dev' ? ` | pills ${m.pills.map((p) => `${round(p.w)}x${round(p.h)}@${round(p.cy)} r${p.radius}`).join(' · ')} gaps ${gaps(m.pills).join(',')}` : '') +
          (m.carry.length ? ` | carried ${m.carry.map((p) => `${round(p.w)}x${round(p.h)}@${round(p.cy)}`).join(' · ')}` : '') +
          ` | level "${m.pip?.text}" ${round(m.pip?.w)}x${round(m.pip?.h)}`,
      )

      // The fill: unset, the composer is the glass a plain `.glass` is in the same
      // scope; set, the composer takes it and that glass does not.
      const fill = await tab.evaluate(() => {
        const frame = document.querySelector('[data-slot="composer"]')
        const plain = document.createElement('div')
        plain.className = 'glass'
        frame.parentElement.appendChild(plain)
        const read = (el) => getComputedStyle(el).backgroundColor
        const ground = () => getComputedStyle(document.documentElement).getPropertyValue('--background')
        const before = { composer: read(frame), glass: read(plain), ground: ground() }
        document.documentElement.style.setProperty('--composer-fill', 'rgb(1, 2, 3)')
        const after = { composer: read(frame), glass: read(plain), ground: ground() }
        document.documentElement.style.removeProperty('--composer-fill')
        plain.remove()
        return { before, after }
      })
      check(fill.before.composer === fill.before.glass, `${name}: unset, the composer's fill is the material's (${fill.before.composer} vs ${fill.before.glass})`)
      check(fill.after.composer === 'rgb(1, 2, 3)', `${name}: --composer-fill fills the composer (${fill.after.composer})`)
      check(fill.after.glass === fill.before.glass && fill.after.ground === fill.before.ground, `${name}: and nothing else, nor --background`)
      if (width === 390 && kind === 'chat') report.push(`fill ${theme}: default ${fill.before.composer} = .glass ${fill.before.glass}; set → ${fill.after.composer}; .glass stays ${fill.after.glass}`)

      await tab.screenshot({ path: join(OUT, `${name}.png`) })
      await tab.locator('[data-slot="composer-shell"]').screenshot({ path: join(OUT, `${name}-bar.png`) })
      check(oops.length === 0, `${name}: page errors: ${oops.join(' | ')}`)
      await ctx.close()
    }

await browser.close()
await server.close()

console.log(report.join('\n'))
console.log(`composer: screenshots in ${OUT}`)
if (failures.length) {
  console.error(failures.map((f) => `  ✗ ${f}`).join('\n'))
  process.exit(1)
}
console.log('composer: every case passed')
