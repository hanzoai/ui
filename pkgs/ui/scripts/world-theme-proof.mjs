// Theming proof: the SAME compiled components re-skinned three ways, purely by
// overriding --world-* custom properties (no component/prop changes).
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import postcss from 'postcss'
import tailwindcss from '@tailwindcss/postcss'
import { NewsStream, MarketTicker, InstabilityScore } from '../dist/world/index.mjs'

const h = React.createElement
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const news = [
  { title: 'Central bank holds rates, signals one cut before year-end', source: 'Reuters', category: 'macro', severity: 'info', timestamp: Date.now() - 3 * 60_000, url: 'https://example.com/a' },
  { title: 'Border clashes escalate; observers report troop movement', source: 'AP', category: 'conflict', severity: 'critical', timestamp: Date.now() - 61 * 60_000, url: 'https://example.com/c' },
]
const markets = [
  { symbol: 'SPX', name: 'S&P 500', price: 5432.11, change: 0.82, sparkline: [12, 12.4, 12.1, 12.9, 13.2, 13.0, 13.6, 13.9] },
  { symbol: 'BTC', name: 'Bitcoin', price: 61230.5, change: -2.14, sparkline: [64, 63.2, 63.6, 62.1, 61.8, 62.0, 61.2, 61.2] },
]
const score = { code: 'UA', name: 'Ukraine', score: 82, trend: 'rising', change24h: 4, components: { unrest: 68, conflict: 94 } }

function trio() {
  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
    h(NewsStream, { title: 'Live intel', items: news }),
    h(MarketTicker, { title: 'Markets', items: markets }),
    h(InstabilityScore, { data: score, compact: true }),
  )
}

// Column 1: default (Geist/black). Column 2: light theme (data-theme=light).
// Column 3: a fictitious customer brand — override --world-* to inherit host tokens.
const brand = [
  '--world-surface:#101725', '--world-bg:#0b0f1a', '--world-border:#22304a',
  '--world-text:#e6edf7', '--world-text-muted:#8aa0c0', '--world-text-dim:#5b7096',
  '--world-accent:#4f8cff', '--world-up:#22c55e', '--world-down:#f43f5e',
  '--world-radius:0.9rem', "--world-font-sans:'Inter',system-ui,sans-serif",
].join(';')

const body = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 28 } },
  h('div', null, h('div', { className: 'lbl' }, 'default — Geist / black (world.hanzo.ai)'), h('div', {}, trio())),
  h('div', { 'data-theme': 'light', style: { background: 'var(--world-bg)', padding: 12, borderRadius: 12 } },
    h('div', { className: 'lbl' }, 'data-theme="light" — inherits light mode'), h('div', {}, trio())),
  h('div', { style: { cssText: '' } },
    h('div', { className: 'lbl' }, 'host brand — override --world-*'),
    h('div', { style: styleObj(brand) }, trio())),
)

function styleObj(css) {
  const o = {}
  for (const decl of css.split(';')) {
    const [k, v] = decl.split(/:(.+)/)
    if (k && v) o[k.trim()] = v.trim()
  }
  return o
}

const rendered = renderToStaticMarkup(body)
const bodyPath = join(root, 'scripts/.world-theme.body.html')
writeFileSync(bodyPath, rendered)

const tokens = readFileSync(join(root, 'src/world/tokens.css'), 'utf8')
const tw = await postcss([tailwindcss()]).process(`@import "tailwindcss";\n@source "${bodyPath}";`, { from: join(root, 'scripts/.world-theme.in.css') })
const html = `<!doctype html><html data-theme="dark"><head><meta charset="utf-8"><style>${tokens}\n${tw.css}
body{background:#000;color:#e8e8e8;font-family:var(--world-font-sans);margin:0;padding:28px}
.lbl{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#777;margin-bottom:10px;font-family:var(--world-font-mono,monospace)}
[data-theme=light]{color:var(--world-text)}
</style></head><body>${rendered}</body></html>`
const htmlPath = join(root, 'scripts/.world-theme.html')
writeFileSync(htmlPath, html)

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1280, height: 620 }, deviceScaleFactor: 2 })
await p.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' })
await p.screenshot({ path: 'scripts/.world-theme.png', fullPage: true })
await b.close()
console.log('theme proof written')
