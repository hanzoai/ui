// The code surfaces, measured in a real browser: every colour a reader sees on
// CodeBlock, Terminal, Snippet, CodeEditor, JsonTree and a shiki block in
// `codeTheme`, as Chromium computes it, in a dark page and a light one, at 1280
// and 390 wide, and in a right-to-left page at 1280. Each text is held to three
// things: its ink is a grey, its ground is a grey, and the two clear AA (4.5:1).
// A CodeBlock pinned to `light` or `dark` must keep its own scheme's ground on
// either page, and code reads left to right whatever the page's direction. A
// screenshot of every case is written so a person can look.
//
// Run: node scripts/code.mjs [out-dir]   (needs dist/theme.css: `node scripts/compose-theme.mjs`)
//
// jsdom resolves no var() and paints nothing, and every colour here is a var().
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'

import { alias } from './alias.mjs'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))
const OUT = resolve(process.argv[2] ?? join(UI, 'test-results', 'code'))
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
const base = `${server.resolvedUrls.local[0].replace(/\/$/, '')}/test/code.html`

// The shiki block, highlighted here the way ui.hanzo.ai's code.ts does it, with
// the docs site's own shiki: this package ships the theme and no highlighter.
const site = createRequire(join(UI, '..', '..', 'apps', 'ui.hanzo.ai', 'package.json'))
const { createHighlighter } = await import(pathToFileURL(site.resolve('shiki')).href)
const { codeTheme } = await server.ssrLoadModule('/src/code-theme.ts')
const shiki = await createHighlighter({ themes: [codeTheme.dark, codeTheme.light], langs: ['ts'] })
const SHIKI = shiki.codeToHtml(
  `// one client, every model\nconst ai = new Hanzo({ baseURL: "https://api.hanzo.ai/v1" })\nif (!ai) return null`,
  {
    lang: 'ts',
    themes: codeTheme,
    defaultColor: 'light-dark()',
    transformers: [
      {
        pre(node) {
          this.addClassToHast(node, 'code')
          node.properties.dir = 'ltr'
        },
      },
    ],
  },
)

const browser = await chromium.launch()
const failures = []
const check = (ok, what) => {
  if (!ok) failures.push(what)
}

/**
 * Every visible text in each case, with the colour it is painted in and the
 * ground under it, both as a browser computes them: translucent grounds and
 * opacities are composited down to the page, so the pair is what the eye gets.
 */
const read = (tab) =>
  tab.evaluate(() => {
    const rgba = (c) => {
      const srgb = c.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/)
      if (srgb) return [+srgb[1] * 255, +srgb[2] * 255, +srgb[3] * 255, srgb[4] === undefined ? 1 : +srgb[4]]
      const m = c.match(/^rgba?\(([^)]+)\)$/)
      if (!m) return null
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number)
      return [p[0], p[1], p[2], p[3] ?? 1]
    }
    const over = (top, under) => {
      const a = top[3]
      return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1)
    }
    const groundOf = (el) => {
      const layers = []
      for (let e = el; e; e = e.parentElement) {
        const bg = rgba(getComputedStyle(e).backgroundColor)
        if (bg && bg[3] > 0) layers.push(bg)
        if (bg && bg[3] >= 1) break
      }
      let g = [255, 255, 255, 1]
      for (const l of layers.reverse()) g = over(l, g)
      return g
    }
    const opacityOf = (el) => {
      let o = 1
      for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity)
      return o
    }
    const out = []
    for (const box of document.querySelectorAll('[data-code-case]')) {
      const name = box.getAttribute('data-code-case')
      const label = box.firstElementChild
      for (const el of box.querySelectorAll('*')) {
        if (label && label.contains(el)) continue
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
        if (!own || !el.getClientRects().length) continue
        const style = getComputedStyle(el)
        if (style.visibility === 'hidden') continue
        const ground = groundOf(el)
        const ink = rgba(style.color)
        out.push({
          name,
          text: el.textContent.trim().slice(0, 40),
          ink: ink && over([ink[0], ink[1], ink[2], ink[3] * opacityOf(el)], ground),
          ground,
          raw: style.color,
          italic: style.fontStyle === 'italic',
          weight: Number(style.fontWeight),
        })
      }
    }
    const surface = (sel) => {
      const el = document.querySelector(sel)
      return el ? rgba(getComputedStyle(el).backgroundColor) : null
    }
    return {
      texts: out,
      grounds: {
        block: surface('[data-code-case="code-block"] [data-slot="code-block"]'),
        terminal: surface('[data-code-case="terminal"] [data-slot="terminal"]'),
        snippet: surface('[data-code-case="snippet"] [data-slot="snippet"]'),
        shiki: surface('[data-code-case="shiki"] pre'),
        light: surface('[data-code-case="pinned-light"] [data-slot="code-block"]'),
        dark: surface('[data-code-case="pinned-dark"] [data-slot="code-block"]'),
      },
    }
  })

const lum = ([r, g, b]) => {
  const c = (v) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4)
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b)
}
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const grey = (c) => !!c && Math.abs(c[0] - c[1]) <= 1 && Math.abs(c[1] - c[2]) <= 1
const rgba = (c) => c.match(/^rgba?\(([^)]+)\)$/)?.[1].split(/[\s,/]+/).filter(Boolean).map(Number) ?? null
const hex = (c) => (c ? `#${c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}` : String(c))

/** The two code grounds, by scheme: design's neutral 900 and 100. */
const GROUND = { dark: '#171717', light: '#f5f5f5' }
const report = {}

const RUNS = [
  ...[1280, 390].flatMap((width) => ['dark', 'light'].map((theme) => ({ width, theme, dir: 'ltr' }))),
  ...['dark', 'light'].map((theme) => ({ width: 1280, theme, dir: 'rtl' })),
]

for (const { width, theme, dir } of RUNS) {
  const name = `${width}-${theme}-${dir}`
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, deviceScaleFactor: 1 })
  const tab = await ctx.newPage()
  const oops = []
  tab.on('pageerror', (e) => oops.push(String(e)))
  await tab.addInitScript(
    ([t, html]) => {
      localStorage.setItem('hanzo.appearance', JSON.stringify({ theme: t }))
      window.__shiki = html
    },
    [theme, SHIKI],
  )
  await tab.goto(`${base}?dir=${dir}`)
  await tab.waitForSelector('[data-code-case="pinned-dark"] [data-slot="code-block"]', { timeout: 60_000 })
  await tab.waitForSelector('[data-code-case="editor"] .cm-line', { timeout: 30_000 })
  await tab.waitForFunction((t) => document.documentElement.classList.contains(t), theme, { timeout: 10_000 }).catch(() => {})
  await tab.evaluate(() => document.fonts.ready)
  check(await tab.evaluate((t) => document.documentElement.classList.contains(t), theme), `${name}: the page is ${theme}`)

  // Colours settle after the stored theme repaints the page, through its transitions:
  // read until two reads a frame apart agree.
  let seen = ''
  let texts, grounds
  for (let i = 0; i < 50; i++) {
    ;({ texts, grounds } = await read(tab))
    const now = JSON.stringify([texts, grounds])
    if (now === seen) break
    seen = now
    await tab.waitForTimeout(100)
  }
  check(texts.length > 60, `${name}: read ${texts.length} texts`)

  for (const [surface, colour] of Object.entries(grounds)) check(grey(colour), `${name}: ${surface} ground ${hex(colour)} is not a grey`)
  check(hex(grounds.block) === GROUND[theme], `${name}: CodeBlock ground ${hex(grounds.block)}, want ${GROUND[theme]}`)
  check(hex(grounds.terminal) === GROUND[theme], `${name}: Terminal ground ${hex(grounds.terminal)}, want ${GROUND[theme]}`)
  check(hex(grounds.shiki) === GROUND[theme], `${name}: shiki ground ${hex(grounds.shiki)}, want ${GROUND[theme]}`)
  check(hex(grounds.light) === GROUND.light, `${name}: CodeBlock pinned light ${hex(grounds.light)}, want ${GROUND.light}`)
  check(hex(grounds.dark) === GROUND.dark, `${name}: CodeBlock pinned dark ${hex(grounds.dark)}, want ${GROUND.dark}`)

  const low = {}
  for (const t of texts) {
    const where = `${name} ${t.name} "${t.text}"`
    check(grey(t.ink), `${where}: ink ${t.raw} is not a grey`)
    check(grey(t.ground), `${where}: ground ${hex(t.ground)} is not a grey`)
    if (!t.ink) continue
    const r = ratio(t.ink, t.ground)
    check(r >= 4.5, `${where}: ${hex(t.ink)} on ${hex(t.ground)} is ${r.toFixed(2)}:1, under AA`)
    low[t.name] = Math.min(low[t.name] ?? Infinity, r)
  }
  report[name] = Object.fromEntries(Object.entries(low).map(([k, v]) => [k, Number(v.toFixed(2))]))

  // Tokens are told apart by slant and weight, as a reader sees them.
  const shikiText = (s) => texts.find((t) => t.name === 'shiki' && t.text.startsWith(s))
  check(shikiText('// one client')?.italic, `${name}: the shiki comment is italic`)
  check((shikiText('const')?.weight ?? 0) >= 700, `${name}: the shiki keyword is bold`)
  const error = texts.find((t) => t.name === 'terminal' && t.text === 'Command not found: deploy')
  check((error?.weight ?? 0) >= 700, `${name}: the terminal's error line is bold`)
  const literal = texts.find((t) => t.name === 'editor' && t.text === 'true')
  check((literal?.weight ?? 0) >= 700, `${name}: a JSON literal is bold`)

  // Code reads left to right in a page of either direction, and a marked line's
  // edge is drawn at the start of the line.
  const order = await tab.evaluate(() => {
    const x = (sel) => document.querySelector(sel)?.getBoundingClientRect().left ?? NaN
    const line = document.querySelector('[data-code-case="code-block"] [data-mark="highlight"]')
    const cs = line && getComputedStyle(line)
    const plain = getComputedStyle(document.querySelector('[data-code-case="code-block"] [data-slot="code-block-line"]:not([data-mark])'))
    return {
      page: getComputedStyle(document.documentElement).direction,
      number: x('[data-code-case="code-block"] [data-line="1"] [data-slot="code-block-text"]'),
      code: x('[data-code-case="code-block"] [data-line="1"] [data-slot="code-block-text"]:last-child'),
      prompt: x('[data-code-case="terminal"] [data-slot="terminal-command"] [data-slot="terminal-text"]'),
      command: x('[data-code-case="terminal"] [data-slot="terminal-command"] [data-slot="terminal-text"] + [data-slot="terminal-text"]'),
      edge: cs && [cs.borderLeftWidth, cs.borderLeftStyle, cs.borderLeftColor],
      // An unmarked line draws no rule on any side: its start edge is there, transparent.
      plain: [plain.borderTopWidth, plain.borderRightWidth, plain.borderBottomWidth, plain.borderLeftColor],
      directions: ['[data-slot="code-block"] [data-i18n-ltr]', '[data-slot="terminal"]', '.cm-editor', '[data-slot="json-tree-body"]', 'pre.code'].map(
        (sel) => {
          const el = document.querySelector(`[data-code-case] ${sel}`)
          return el ? getComputedStyle(el).direction : `no ${sel}`
        },
      ),
    }
  })
  check(order.page === dir, `${name}: the page reads ${order.page}`)
  check(order.number < order.code, `${name}: a CodeBlock line number sits left of its code (${order.number} vs ${order.code})`)
  check(order.prompt < order.command, `${name}: the terminal prompt sits left of its command (${order.prompt} vs ${order.command})`)
  check(order.directions.every((d) => d === 'ltr'), `${name}: code surfaces read ltr: ${order.directions}`)
  check(
    order.plain.slice(0, 3).every((w) => w === '0px') && order.plain[3] === 'rgba(0, 0, 0, 0)',
    `${name}: an unmarked line draws no rule: ${order.plain}`,
  )
  check(order.edge?.[0] === '2px' && order.edge?.[1] === 'solid' && grey(rgba(order.edge[2])), `${name}: a highlighted line's edge is a 2px grey line at its start: ${order.edge}`)

  check(oops.length === 0, `${name}: page errors: ${oops.join(' | ')}`)
  await tab.screenshot({ path: join(OUT, `${name}.png`), fullPage: true })
  await ctx.close()
}

await browser.close()
await server.close()

console.log(`code: screenshots in ${OUT}`)
console.log('code: lowest contrast per case (ink on its ground, WCAG 2):')
for (const [name, cases] of Object.entries(report)) console.log(`  ${name}  ${JSON.stringify(cases)}`)
if (failures.length) {
  console.error(failures.map((f) => `  ✗ ${f}`).join('\n'))
  process.exit(1)
}
console.log('code: every case passed')
