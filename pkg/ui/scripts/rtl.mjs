// Every primitive, read left to right and right to left: is the RTL page the
// mirror image of the LTR one?
//
// `test/rtl.tsx` lays out the primitives a surface is built from — a button
// group, inputs with adornments, select, menu with a submenu, dialog, sheet,
// tabs, table, tooltip, popover, toast, breadcrumb, pagination, a card with an
// icon, a sidebar beside its content — and tags each box worth checking with
// `data-probe`. The page is mounted twice, `dir=ltr` and `dir=rtl`, with the
// same words, and every probe must land where the mirror of its LTR box lands:
// x_rtl = width - x_ltr - w, within 2px, at the same y and size. A side named
// physically anywhere in a component shows up here as a box that stayed put.
//
// Mounted, not server-rendered, for the reason `contain.mjs` gives.
//
// Run: node scripts/rtl.mjs [--shots <dir>]   (after `node scripts/compose-theme.mjs`)
//   --shots writes <scene>-ltr.png, <scene>-rtl.png and <scene>-rtl-ar.png (the
//   same page set in Arabic, for the eye: no geometry check reads it).
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'

import { alias } from './alias.mjs'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))
const at = process.argv.indexOf('--shots')
const shots = at > 0 ? process.argv[at + 1] : null
if (shots) mkdirSync(shots, { recursive: true })

const SCENES = ['main', 'menu', 'select', 'dialog', 'sheet', 'float']
const SLACK = 2

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
const base = `${server.resolvedUrls.local[0].replace(/\/$/, '')}/test/rtl.html`

const browser = await chromium.launch()
const tab = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const oops = []
tab.on('pageerror', (e) => oops.push(String(e)))

async function open(scene, dir, lang = 'en') {
  await tab.goto(`${base}?scene=${scene}&dir=${dir}&lang=${lang}`)
  await tab.waitForSelector('[data-probe]', { timeout: 30_000 })
  if (scene === 'menu') {
    await tab.click('[data-probe="menu-trigger"]')
    await tab.hover('[data-probe="menu-sub-trigger"]')
  }
  // Popper placement, the toast's arrival and the menu's entrance all settle
  // after first paint; a box read mid-flight is a box in the wrong place.
  await tab.waitForTimeout(1200)
  const read = await tab.evaluate(() => {
    // The mirror axis is the body's box, not the window: a modal's scroll lock
    // reserves a gutter, the same one in both directions, and centres its
    // overlays inside what is left.
    const body = document.body.getBoundingClientRect()
    const view = body.left + body.right
    const boxes = {}
    const put = (name, el) => {
      if (!el) return
      const r = el.getBoundingClientRect()
      boxes[name] = { x: r.left, y: r.top, w: r.width, h: r.height }
    }
    for (const el of document.querySelectorAll('[data-probe]')) put(el.getAttribute('data-probe'), el)
    // The moving parts inside a control, which no prop can tag.
    put('slider-thumb', document.querySelector('[data-probe="slider"] [role="slider"]'))
    put('progress-fill', document.querySelector('[data-probe="progress"] [data-slot="progress-indicator"]'))
    put('switch-thumb', document.querySelector('[data-probe="switch"] > *'))
    const flex = getComputedStyle(document.querySelector('[data-probe]')).display
    return { view, boxes, flex, dir: getComputedStyle(document.body).direction }
  })
  if (read.flex !== 'flex') throw new Error(`${scene}/${dir}: gui's base rule never arrived (display ${read.flex})`)
  if (read.dir !== dir) throw new Error(`${scene}/${dir}: the document reads ${read.dir}`)
  if (shots) await tab.screenshot({ path: join(shots, `${scene}-${dir}${lang === 'en' ? '' : `-${lang}`}.png`) })
  return read
}

const rows = []
for (const scene of SCENES) {
  const ltr = await open(scene, 'ltr')
  const rtl = await open(scene, 'rtl')
  if (shots) await open(scene, 'rtl', 'ar')
  for (const [name, a] of Object.entries(ltr.boxes)) {
    const b = rtl.boxes[name]
    if (!b) {
      rows.push({ scene, name, ok: false, why: 'absent under rtl' })
      continue
    }
    const want = ltr.view - a.x - a.w
    const off = Math.round((b.x - want) * 10) / 10
    const ok =
      Math.abs(b.x - want) <= SLACK &&
      Math.abs(b.y - a.y) <= SLACK &&
      Math.abs(b.w - a.w) <= SLACK &&
      Math.abs(b.h - a.h) <= SLACK
    rows.push({
      scene,
      name,
      ok,
      why: ok ? '' : `x ${Math.round(b.x)} want ${Math.round(want)} (${off > 0 ? '+' : ''}${off}), y ${Math.round(a.y)}→${Math.round(b.y)}, w ${Math.round(a.w)}→${Math.round(b.w)}`,
    })
  }
}

await browser.close()
await server.close()

const bad = rows.filter((r) => !r.ok)
for (const r of rows) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.scene.padEnd(6)} ${r.name.padEnd(18)} ${r.why}`)
console.log(`\n${rows.length - bad.length}/${rows.length} boxes mirror`)
if (oops.length) console.log(`page errors:\n  ${[...new Set(oops)].join('\n  ')}`)
if (shots) console.log(`screenshots: ${shots}`)
process.exit(bad.length || oops.length ? 1 : 0)
