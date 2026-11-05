// The composer, measured in a real browser: on a phone (390 and 440 wide) and a
// laptop, dark and light, at a device pixel ratio of 1 and of 2, as Chat hands
// it its slots and as Dev does (three pills, a carried file, the commands, the
// mode).
//
//   the frame   a 16px corner and ONE even 1px edge on whole pixels, nothing
//               inset along its top; its ground `--composer-ground`, or what
//               `--composer-fill` says; the edge brighter on focus; a
//               conversation nothing keeps drops the ground and dashes the edge
//   the field   16/24 type, its text 16px in from the frame's edge, no grip; two
//               lines' room at rest, a line at a time to its ceiling, then it
//               scrolls
//   the row     every control the composer's control size on one centreline,
//               one gap apart, the mic and its chevron one control; the last
//               place voice mode while the draft is empty and send once it has
//               words, in one box so nothing moves
//   under it    the words at the field's text edge on one line, no edge and no
//               fill, the last one ending as far in as the first begins
//
// Nothing runs past the frame or the page. Screenshots at rest, focused with
// three lines, and forgetful, each theme, each ratio.
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
/** The frame's corner, px (Composer.tsx `CORNER`). */
const CORNER = 16
/** Where the words stand in from the frame's outer edge, px (Composer.tsx `TEXT`). */
const TEXT = 16
/** A word's own gutter, px (Composer.tsx `GUTTER`). */
const GUTTER = 5

/** Every box the gates read, in ONE frame. */
const measure = (tab) =>
  tab.evaluate(() => {
    const box = (el) => {
      const b = el.getBoundingClientRect()
      return { x: b.left, r: b.right, y: b.top, b: b.bottom, w: b.width, h: b.height, cy: b.top + b.height / 2 }
    }
    const shown = (el) => getComputedStyle(el.closest('[aria-hidden="true"]') ?? el).opacity !== '0' && !el.closest('[aria-hidden="true"]')
    const shell = document.querySelector('[data-slot="composer-shell"]')
    const frame = shell.querySelector('[data-slot="composer"]')
    const within = (sel) => [...frame.querySelectorAll(sel)]
    // The row's controls, each a box the finger lands on, in reading order; the last place counts once, for what it shows.
    const controls = (group) =>
      [
        ...within(`[data-slot="${group}"] [data-slot="plus"]`),
        ...within(`[data-slot="${group}"] [data-slot="composer-carried"]`),
        ...within(`[data-slot="${group}"] [data-slot="chip-select"]`),
        ...within(`[data-slot="${group}"] [data-slot="dictation"] button`),
        ...within(`[data-slot="${group}"] [data-slot="composer-last"]`),
      ]
        .map((el) => ({ name: el.getAttribute('data-slot') || el.getAttribute('aria-label') || el.tagName, ...box(el) }))
        .sort((a, b) => a.x - b.x)
    const carry = within('[data-slot="composer-carry"] [data-slot="composer-carried"]').map((el) => ({ name: el.textContent, ...box(el) }))
    const words = [
      ...shell.querySelectorAll(
        '[data-slot="composer-foot"] [data-slot="chip-select"], [data-slot="composer-foot"] [data-slot="composer-chip"], [data-slot="composer-foot"] [data-slot="model-picker"], [data-slot="composer-foot"] [data-slot="effort"], [data-slot="composer-foot"] [data-slot="mode"]',
      ),
    ]
      .map((el) => {
        const s = getComputedStyle(el)
        const text = el.querySelector('span') ?? el
        const range = document.createRange()
        range.selectNodeContents(text)
        const ink = range.getBoundingClientRect()
        return { name: el.getAttribute('aria-label') || el.textContent, ...box(el), edge: parseFloat(s.borderTopWidth), bg: s.backgroundColor, ink: { x: ink.left, r: ink.right } }
      })
      .sort((a, b) => a.x - b.x)
    const fr = box(frame)
    const s = getComputedStyle(frame)
    const send = frame.querySelector('[data-slot="composer-send"]')
    const talk = frame.querySelector('[data-slot="composer-talk"]')
    const field = frame.querySelector('[data-slot="composer-field"]')
    const fs = getComputedStyle(field)
    const range = document.createRange()
    range.selectNodeContents(field)
    const inner = { x: fr.x + parseFloat(s.borderLeftWidth), r: fr.r - parseFloat(s.borderRightWidth) }
    const past = [...frame.querySelectorAll('*')]
      .filter((el) => {
        const b = el.getBoundingClientRect()
        return b.width > 0 && (b.left < inner.x - 0.5 || b.right > inner.r + 0.5)
      })
      .map((el) => el.getAttribute('data-slot') || el.tagName)
    const probe = document.createElement('div')
    probe.style.backgroundColor = 'var(--composer-ground)'
    frame.parentElement.appendChild(probe)
    const ground = getComputedStyle(probe).backgroundColor
    probe.remove()
    const icons = [...frame.querySelectorAll('[data-slot="composer-start"] svg, [data-slot="composer-end"] svg')].filter((el) => el.getBoundingClientRect().width > 0)
    return {
      vw: innerWidth,
      scroll: document.documentElement.scrollWidth,
      frame: fr,
      radius: parseFloat(s.borderTopLeftRadius),
      edges: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth, s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor, s.borderTopStyle],
      shadow: s.boxShadow,
      fill: s.backgroundColor,
      image: s.backgroundImage,
      ground,
      send: { shown: shown(send), label: send.getAttribute('aria-label'), off: send.getAttribute('aria-disabled') === 'true', bg: getComputedStyle(send).backgroundColor },
      talk: talk ? { shown: shown(talk) } : null,
      field: { ...box(field), font: fs.fontSize, lh: fs.lineHeight, resize: fs.resize, padX: parseFloat(fs.paddingLeft), scrolls: field.scrollHeight > field.clientHeight + 1 },
      icons: icons.map((el) => ({ w: el.getAttribute('width'), stroke: el.getAttribute('stroke-width'), transform: getComputedStyle(el).transform })),
      start: controls('composer-start'),
      end: controls('composer-end'),
      words,
      carry,
      past,
    }
  })

/** The space between each control and the next, px. */
const gaps = (row) => row.slice(1).map((c, i) => +(c.x - row[i].r).toFixed(1))

const round = (n) => Math.round(n * 10) / 10
const report = []
/**
 * Until the composer stops moving: its field's height, the last place's layers and
 * the frame's edge read the same twice running. The eases are 150ms, but a busy
 * machine stretches them, and a read taken mid-ease measures a value on its way.
 */
const settle = (tab) =>
  tab.evaluate(
    () =>
      new Promise((done) => {
        const read = () => {
          const frame = document.querySelector('[data-slot="composer"]')
          if (!frame) return ''
          const field = frame.querySelector('[data-slot="composer-field"]')
          const layers = [...frame.querySelectorAll('[data-slot="composer-last"] > *')].map((el) => getComputedStyle(el).opacity + getComputedStyle(el).transform)
          return [field?.getBoundingClientRect().height, getComputedStyle(frame).borderTopColor, getComputedStyle(frame).backgroundColor, ...layers].join('|')
        }
        let last = read()
        let same = 0
        const tick = () => {
          const now = read()
          same = now === last ? same + 1 : 0
          last = now
          if (same >= 3) done()
          else setTimeout(tick, 60)
        }
        setTimeout(tick, 60)
      }),
  )

for (const [width, height, ratio] of [
  [390, 844, 2],
  [440, 956, 2],
  [1280, 800, 1],
  [1280, 800, 2],
])
  for (const theme of ['dark', 'light'])
    for (const kind of ['chat', 'dev']) {
      const name = `${kind}-${width}${ratio === 2 ? '@2x' : ''}-${theme}`
      const phone = width < 640
      const hit = phone ? 36 : 32
      const word = phone ? 36 : 28
      const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: ratio, colorScheme: theme, hasTouch: phone })
      const tab = await ctx.newPage()
      const oops = []
      tab.on('pageerror', (e) => oops.push(String(e)))
      await tab.addInitScript((t) => localStorage.setItem('hanzo.appearance', JSON.stringify({ theme: t })), theme)
      // A cold dev server transforms the whole graph on the first load: wait for the composer, not the load event.
      await tab.goto(`${base}?case=${kind}`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
      await tab.waitForSelector('[data-slot="composer-send"]', { state: 'attached', timeout: 120_000 })
      await tab.waitForFunction((t) => document.documentElement.classList.contains(t), theme, { timeout: 10_000 }).catch(() => {})
      await settle(tab)

      const m = await measure(tab)
      const row = [...m.start, ...m.end]
      // +, the mic, its chevron and the last place; Dev adds the commands, and on a laptop the carried file after `+`.
      check(row.length === (kind === 'chat' ? 4 : phone ? 5 : 6), `${name}: the row draws its controls (${row.map((c) => c.name).join(', ')})`)
      for (const c of row) if (c.name !== 'composer-carried') check(near(c.h, hit), `${name}: ${c.name} is ${hit}px tall (${round(c.h)})`)
      for (const c of row) if (!['composer-carried', 'dictation-menu'].includes(c.name)) check(near(c.w, hit), `${name}: ${c.name} is ${hit}px wide (${round(c.w)})`)
      const mid = row[0].cy
      for (const c of row) check(near(c.cy, mid), `${name}: ${c.name} on the row's centreline (${round(c.cy)} vs ${round(mid)})`)
      const end = gaps(m.end)
      const mic = m.end.findIndex((c) => c.name === 'dictation-menu')
      end.forEach((g, i) => check(near(g, i === mic - 1 ? 0 : SPACE), `${name}: the end's gaps are one gap, the mic and its chevron one control (${end.join(', ')})`))
      gaps(m.start).forEach((g) => check(near(g, SPACE), `${name}: the start's gaps are one gap (${gaps(m.start).join(', ')})`))
      // Icons: whole-pixel sizes, one stroke, never scaled.
      for (const i of m.icons) check(Number.isInteger(+i.w) && i.transform === 'none', `${name}: an icon at a whole size, unscaled (${i.w}, ${i.transform})`)

      // The frame: one even edge, on whole pixels, nothing inset.
      check(near(m.radius, CORNER), `${name}: the frame's corner is ${CORNER}px (${m.radius})`)
      check(new Set(m.edges.slice(0, 4)).size === 1 && m.edges[0] === '1px', `${name}: the edge is 1px all round (${m.edges.slice(0, 4).join(' ')})`)
      check(new Set(m.edges.slice(4, 8)).size === 1, `${name}: the edge is one colour all round (${m.edges.slice(4, 8).join(' | ')})`)
      check(!/inset/.test(m.shadow), `${name}: nothing inset along the top (${m.shadow})`)
      check(Number.isInteger(m.frame.x * ratio) && Number.isInteger(m.frame.y * ratio) && Number.isInteger(m.frame.w * ratio), `${name}: the frame on whole device pixels (${m.frame.x}, ${m.frame.y}, ${m.frame.w})`)
      check(m.fill === m.ground, `${name}: the ground is --composer-ground (${m.fill} vs ${m.ground})`)
      check(m.image === 'none', `${name}: no prism along the lip (${m.image})`)

      // The field: 16/24, its text at the frame's text edge, no grip, two lines' room at rest.
      check(m.field.font === '16px' && m.field.lh === '24px', `${name}: the field is 16/24 (${m.field.font}/${m.field.lh})`)
      check(near(m.field.x + m.field.padX - m.frame.x, TEXT), `${name}: the text stands ${TEXT}px in (${round(m.field.x + m.field.padX - m.frame.x)})`)
      check(m.field.resize === 'none', `${name}: the field has no grip (${m.field.resize})`)
      check(near(m.field.h, phone ? 40 : 52), `${name}: the field's room at rest (${round(m.field.h)})`)

      // The last place: voice mode while empty, send hidden.
      check(m.talk?.shown && !m.send.shown, `${name}: at rest the last place is voice mode, send not drawn`)

      // Under the frame: words of one height, no edge, no fill, at the text edge.
      check(m.words.some((w) => /^Effort: /.test(w.name)) && m.words.some((w) => /^Model: /.test(w.name)), `${name}: the model and the effort are words under the frame (${m.words.map((w) => w.name).join(', ')})`)
      if (kind === 'dev') check(m.words.filter((w) => /Where the run runs|Repository|Branch/.test(w.name)).length === 3, `${name}: the pills are words under the frame`)
      for (const w of m.words) {
        check(near(w.h, word), `${name}: ${w.name} is ${word}px tall (${round(w.h)})`)
        check(near(w.cy, m.words[0].cy) || phone, `${name}: ${w.name} on the words' line`)
        check(w.edge === 0 && w.bg === 'rgba(0, 0, 0, 0)', `${name}: ${w.name} has no edge and no fill (${w.edge}, ${w.bg})`)
      }
      if (m.words.length) {
        if (kind === 'dev') check(near(m.words[0].x + GUTTER - m.frame.x, TEXT), `${name}: the first word's letters stand where the field's do (${round(m.words[0].x + GUTTER - m.frame.x)})`)
        check(near(m.frame.r - (m.words.at(-1).r - GUTTER), TEXT), `${name}: the last word ends as far in (${round(m.frame.r - m.words.at(-1).r + GUTTER)})`)
      }
      if (kind === 'dev') check(m.carry.length === (phone ? 1 : 0), `${name}: on a phone the carried file above the field`)
      check(m.past.length === 0, `${name}: nothing runs past the frame (${m.past.join(', ')})`)
      check(m.scroll <= m.vw, `${name}: no sideways scroll (${m.scroll} > ${m.vw})`)

      report.push(
        `${name}: frame ${round(m.frame.w)}x${round(m.frame.h)} r${m.radius} ${m.fill} edge ${m.edges[4]} | row ${row.map((c) => `${c.name.replace('composer-', '')} ${round(c.w)}x${round(c.h)}`).join(' · ')}` +
          ` | words ${m.words.map((w) => `${w.name} ${round(w.w)}x${round(w.h)}`).join(' · ')}`,
      )

      // The fill hook: set, the composer alone takes it, and --background stays.
      const fill = await tab.evaluate(() => {
        const frame = document.querySelector('[data-slot="composer"]')
        const plain = document.createElement('div')
        plain.className = 'glass'
        frame.parentElement.appendChild(plain)
        const read = (el) => getComputedStyle(el).backgroundColor
        const ground = () => getComputedStyle(document.documentElement).getPropertyValue('--background')
        const before = { composer: read(frame), glass: read(plain), ground: ground() }
        frame.style.transition = 'none'
        document.documentElement.style.setProperty('--composer-fill', 'rgb(1, 2, 3)')
        const after = { composer: read(frame), glass: read(plain), ground: ground() }
        document.documentElement.style.removeProperty('--composer-fill')
        frame.style.transition = ''
        plain.remove()
        return { before, after }
      })
      check(fill.after.composer === 'rgb(1, 2, 3)', `${name}: --composer-fill fills the composer (${fill.after.composer})`)
      check(fill.after.glass === fill.before.glass && fill.after.ground === fill.before.ground, `${name}: and nothing else, nor --background`)

      const rest = m.edges[4]
      await settle(tab)
      await tab.screenshot({ path: join(OUT, `${name}.png`) })
      await tab.locator('[data-slot="composer-shell"]').screenshot({ path: join(OUT, `${name}-rest.png`) })

      // Focused, with three lines: the edge brightens, send has the last place, the field three lines tall.
      const field = tab.locator('[data-slot="composer-field"]')
      await field.focus()
      await field.fill('One line of words.\nAnother line of words.\nA third line, and the field grows to hold it.')
      await settle(tab)
      const typed = await measure(tab)
      check(typed.edges[4] !== rest, `${name}: focus brightens the edge (${typed.edges[4]} vs ${rest})`)
      check(typed.send.shown && !typed.send.off && (!typed.talk || !typed.talk.shown), `${name}: with words, send has the last place`)
      check(near(typed.field.h, 3 * 24 + 12), `${name}: three lines, the field three lines tall (${round(typed.field.h)})`)
      check(!typed.field.scrolls, `${name}: below its ceiling the field never scrolls`)
      const tall = [...typed.start, ...typed.end]
      for (const c of tall) check(near(c.cy, tall[0].cy), `${name}: typed, ${c.name} stays on the row's centreline`)
      check(near(typed.end.at(-1).x, m.end.at(-1).x), `${name}: the row does not move as the draft fills`)
      await tab.locator('[data-slot="composer-shell"]').screenshot({ path: join(OUT, `${name}-typed.png`) })
      await field.fill('')
      await settle(tab)
      await tab.locator('[data-slot="composer-shell"]').screenshot({ path: join(OUT, `${name}-focused.png`) })

      // Past the ceiling the field stops growing and scrolls.
      await field.fill(Array.from({ length: 30 }, (_, i) => `Line ${i + 1}`).join('\n'))
      await settle(tab)
      const full = await measure(tab)
      check(near(full.field.h, phone ? 160 : 240) && full.field.scrolls, `${name}: at its ceiling the field scrolls (${round(full.field.h)}, scrolls ${full.field.scrolls})`)

      // A conversation nothing keeps: no ground, no drop, a dashed edge.
      await tab.goto(`${base}?case=${kind}&forgetful`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
      await tab.waitForSelector('[data-slot="composer"][data-forgetful]', { timeout: 120_000 })
      await settle(tab)
      const off = await measure(tab)
      check(off.fill === 'rgba(0, 0, 0, 0)' && off.edges[8] === 'dashed' && off.shadow === 'none', `${name}: forgetful, no ground and a dashed edge (${off.fill}, ${off.edges[8]}, ${off.shadow})`)
      await tab.locator('[data-slot="composer-shell"]').screenshot({ path: join(OUT, `${name}-forgetful.png`) })

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
