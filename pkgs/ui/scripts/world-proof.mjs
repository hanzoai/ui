// Render proof for @hanzo/ui/world — SSRs the REAL compiled components
// (from dist/world) with sample data and writes a static HTML page.
// Usage: node scripts/world-proof.mjs
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import {
  NewsStream,
  MarketTicker,
  InstabilityScore,
  PredictionMarket,
} from '../dist/world/index.mjs'

const h = React.createElement
const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const now = Date.now()
const news = [
  { title: 'Central bank holds rates, signals one cut before year-end', source: 'Reuters', category: 'macro', severity: 'info', location: 'Frankfurt', timestamp: now - 3 * 60_000, url: 'https://example.com/a' },
  { title: 'Undersea cable fault disrupts regional connectivity', source: 'Bloomberg', category: 'infra', severity: 'high', location: 'Red Sea', timestamp: now - 22 * 60_000, url: 'https://example.com/b' },
  { title: 'Border clashes escalate; observers report troop movement', source: 'AP', category: 'conflict', severity: 'critical', location: 'Eastern front', timestamp: now - 61 * 60_000, url: 'https://example.com/c' },
  { title: 'Grid operator restores power to 2.1M after outage', source: 'AFP', severity: 'normal', location: 'Texas, US', timestamp: now - 5 * 3600_000, url: 'https://example.com/d' },
]

const markets = [
  { symbol: 'SPX', name: 'S&P 500', price: 5432.11, change: 0.82, sparkline: [12, 12.4, 12.1, 12.9, 13.2, 13.0, 13.6, 13.9] },
  { symbol: 'BTC', name: 'Bitcoin', price: 61230.5, change: -2.14, sparkline: [64, 63.2, 63.6, 62.1, 61.8, 62.0, 61.2, 61.2] },
  { symbol: 'VIX', name: 'Volatility', price: 14.22, change: -3.9, currency: '', sparkline: [17, 16.2, 15.8, 15.1, 14.9, 14.6, 14.3, 14.2] },
  { symbol: 'GC', name: 'Gold (front)', price: 2338.4, change: 0.31, sparkline: [23.1, 23.3, 23.2, 23.35, 23.4, 23.3, 23.36, 23.38] },
]

const prediction = [
  { title: 'Fed cuts rates by Q3 2026?', yesPrice: 63, volume: 1_240_000, url: 'https://example.com/m1' },
  { title: 'Ceasefire agreement signed this quarter?', yesPrice: 28, volume: 486_000, url: 'https://example.com/m2' },
  { title: 'Incumbent wins re-election?', yesPrice: 91, volume: 3_100_000, url: 'https://example.com/m3' },
]

const ukraine = { code: 'UA', name: 'Ukraine', score: 82, level: 'critical', trend: 'rising', change24h: 4, components: { unrest: 68, conflict: 94, security: 80, information: 72 } }
const brazil = { code: 'BR', name: 'Brazil', score: 37, trend: 'falling', change24h: -3, components: { unrest: 44, conflict: 12, security: 41, information: 39 } }

function Card({ title, children }) {
  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
    h('div', { style: { fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#666', fontFamily: 'var(--world-font-mono)' } }, title),
    children,
  )
}

const body = renderToStaticMarkup(
  h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, alignItems: 'start' } },
    h(Card, { title: '<NewsStream />' }, h(NewsStream, { title: 'Live intel', items: news, maxHeight: '360px' })),
    h(Card, { title: '<MarketTicker /> — list' }, h(MarketTicker, { title: 'Markets', items: markets })),
    h(Card, { title: '<MarketTicker variant="strip" />' }, h(MarketTicker, { variant: 'strip', items: markets })),
    h(Card, { title: '<PredictionMarket />' }, h(PredictionMarket, { title: 'Prediction markets', items: prediction })),
    h(Card, { title: '<InstabilityScore /> — critical' }, h(InstabilityScore, { data: ukraine })),
    h(Card, { title: '<InstabilityScore /> — moderate' }, h(InstabilityScore, { data: brazil })),
    h(Card, { title: '<NewsStream loading />' }, h(NewsStream, { title: 'Loading', items: [], loading: true })),
  ),
)

writeFileSync(join(root, 'scripts/.world-proof.body.html'), body)

// Assertions on the real rendered output (fail loudly if data didn't render).
const checks = [
  ['news title', body.includes('Undersea cable fault')],
  ['market price', body.includes('$61,231') && body.includes('$5,432')],
  ['change color up', body.includes('--world-up')],
  ['instability score', body.includes('>82<')],
  ['level pill', body.toLowerCase().includes('critical')],
  ['prediction yes%', body.includes('Yes 63%') || body.includes('63%')],
  ['mono font var', body.includes('var(--world-font-mono)')],
]
let ok = true
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}`)
  if (!pass) ok = false
}

const tokens = readFileSync(join(root, 'src/world/tokens.css'), 'utf8')
const bodyPath = join(root, 'scripts/.world-proof.body.html')

// Compile the REAL Tailwind utilities used by the components so the page
// renders with the true Geist/black look (no hand-written CSS).
const postcss = (await import('postcss')).default
const tailwindcss = (await import('@tailwindcss/postcss')).default
const twInput = `@import "tailwindcss";\n@source "${bodyPath}";`
const tw = await postcss([tailwindcss()]).process(twInput, { from: join(root, 'scripts/.world-proof.in.css') })

const html = `<!doctype html>
<html data-theme="dark"><head><meta charset="utf-8"><title>@hanzo/ui/world — render proof</title>
<style>${tokens}
${tw.css}
body{background:var(--world-bg);color:var(--world-text);font-family:var(--world-font-sans);margin:0;padding:32px;}
h1{font-size:14px;font-weight:500;color:var(--world-text-muted);margin:0 0 24px;letter-spacing:-0.01em;}
</style></head>
<body><h1>@hanzo/ui/world — flagship components (SSR of the compiled dist bundle, real Tailwind + Geist/black tokens)</h1>
${body}</body></html>`
writeFileSync(join(root, 'scripts/.world-proof.html'), html)
console.log('wrote scripts/.world-proof.html')
console.log(ok ? '\nSSR RENDER OK' : '\nSSR RENDER FAILED')
process.exit(ok ? 0 : 1)
