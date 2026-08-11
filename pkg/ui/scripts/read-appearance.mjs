// Read computed styles out of .measure.html while each appearance knob moves.
// Written by scripts/measure-appearance.mjs. Separate process on purpose: the
// vite SSR server does not release the event loop, and a measurement that cannot
// finish is a measurement nobody runs.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))
const browser = await chromium.launch()
const p = await browser.newPage()
await p.goto('file://' + join(UI, '.measure.html'))
await p.evaluate(() => document.documentElement.classList.add('t_dark'))

const READ = {
  'type   font-size': ['#type', 'fontSize'],
  'space  padding-top': ['#space', 'paddingTop'],
  'edge   border-color': ['#edge', 'borderTopColor'],
  'loud   background': ['#loud', 'backgroundColor'],
  'ground background': ['#ground', 'backgroundColor'],
  'ground ink': ['#ground > *', 'color'],
}

const read = () => p.evaluate((sel) => {
  const out = {}
  for (const [k, [s, prop]] of Object.entries(sel)) {
    const el = document.querySelector(s)
    out[k] = el ? getComputedStyle(el)[prop] : '(missing)'
  }
  return out
}, READ)

const set = (kv) => p.evaluate((o) => {
  for (const [k, v] of Object.entries(o))
    v === null ? document.documentElement.style.removeProperty(k)
               : document.documentElement.style.setProperty(k, v)
}, kv)

const rows = {}
rows['— baseline —'] = await read()
await set({ '--type-scale': '1.3' })
rows['person: type 1.3'] = await read()
await set({ '--type-scale': null, '--density': '1.15' })
rows['person: density 1.15'] = await read()
await set({ '--density': null, '--primary': '#8b5cf6', '--accent': '#8b5cf6' })
rows['person: accent violet'] = await read()
// The CTO's acceptance test: one component set, N brands, differing only in
// token VALUES. Each palette below is DATA — no component, config or package
// changes between these three rows.
const clear = { '--primary': null, '--accent': null, '--background': null, '--foreground': null, '--border': null }
const BRANDS = {
  'brand HANZO (published)': {},
  'brand LUX  (data only)': { '--background': '#04070d', '--foreground': '#e6f0ff', '--border': 'rgb(120 170 255 / .22)', '--primary': '#3b82f6' },
  'brand ZOO  (data only)': { '--background': '#0b0f06', '--foreground': '#eefbe0', '--border': 'rgb(150 220 120 / .22)', '--primary': '#84cc16' },
}
for (const [label, palette] of Object.entries(BRANDS)) {
  await set({ ...clear, ...palette })
  rows[label] = await read()
}

console.table(rows)
await browser.close()
