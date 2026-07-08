/*
 * Canonical-token resolution proof.
 *
 * Loads the REAL css (style/tokens.css + hanzo-default-colors.css bridge +
 * world/dash alias bodies) in a headless browser and reads *computed* colours
 * through the full alias chain: hz -> shadcn, hz-ui, world, dash.
 * getComputedStyle on a custom property does NOT substitute var(), so every
 * probe applies the token to a REAL property (background-color / font-family)
 * and we read the resolved value. Asserts dark (default) + light (.light).
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(root, p), 'utf8')
const stripImport = (s) => s.replace(/@import\s+['"][^'"]+tokens\.css['"];?/g, '')

// Concatenate the real token layers in load order.
const css = [
  read('style/tokens.css'),
  read('style/hanzo-default-colors.css'),
  stripImport(read('src/world/tokens.css')),
  stripImport(read('src/dash/tokens.css')),
].join('\n')

// One probe per token: apply to a real property so var() resolves.
const bgProbes = {
  hz_bg: '--hz-bg',
  shadcn_background: '--background',
  shadcn_card: '--card',
  shadcn_border: '--border',
  shadcn_muted_fg: '--muted-foreground',
  shadcn_primary: '--primary',
  legacy_bg0: '--hz-ui-bg-0',
  legacy_secondary: '--hz-ui-secondary',
  world_bg: '--world-bg',
  world_border: '--world-border',
  dash_surface: '--dash-surface',
  dash_primary: '--dash-primary',
}

const probesHtml =
  Object.entries(bgProbes)
    .map(([id, v]) => `<div id="${id}" style="background-color:var(${v})"></div>`)
    .join('') + `<div id="font" style="font-family:var(--hz-font-sans)"></div>`

const html = `<!doctype html><html><head><style>${css}</style></head><body>${probesHtml}</body></html>`

const rgb = { black: 'rgb(0, 0, 0)', white: 'rgb(255, 255, 255)' }
const hex = (r, g, b) => `rgb(${r}, ${g}, ${b})`

// Expected resolved colours.
const DARK = {
  hz_bg: rgb.black,
  shadcn_background: rgb.black,
  shadcn_card: hex(10, 10, 10),      // #0a0a0a  (was oklch grey card)
  shadcn_border: hex(31, 31, 31),    // #1f1f1f
  shadcn_muted_fg: hex(136, 136, 136), // #888
  shadcn_primary: rgb.white,
  legacy_bg0: rgb.black,
  legacy_secondary: hex(10, 10, 10), // #0a0a0a  (was purple 266deg)
  world_bg: rgb.black,
  world_border: hex(31, 31, 31),
  dash_surface: hex(10, 10, 10),     // #0a0a0a  (was tinted #141419)
  dash_primary: rgb.white,           // was blue #3b82f6
}
const LIGHT = {
  hz_bg: rgb.white,
  shadcn_background: rgb.white,
  shadcn_card: hex(248, 249, 250),   // #f8f9fa
  shadcn_border: hex(228, 228, 231), // #e4e4e7
  shadcn_primary: rgb.black,
  world_bg: rgb.white,
  dash_surface: hex(248, 249, 250),
  dash_primary: rgb.black,
}

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'load' })

const readAll = () =>
  page.evaluate((ids) => {
    const out = {}
    for (const id of ids) out[id] = getComputedStyle(document.getElementById(id)).backgroundColor
    out.font = getComputedStyle(document.getElementById('font')).fontFamily
    return out
  }, Object.keys(bgProbes))

let fails = 0
const check = (theme, expected, got) => {
  for (const [k, want] of Object.entries(expected)) {
    const ok = got[k] === want
    if (!ok) fails++
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${theme.padEnd(5)}  ${k.padEnd(20)} ${got[k]}${ok ? '' : `  (expected ${want})`}`)
  }
}

const dark = await readAll()
check('dark', DARK, dark)
console.log(`      font  --hz-font-sans -> ${dark.font}`)
if (!/geist/i.test(dark.font)) { fails++; console.log('FAIL  font is not Geist') }

await page.evaluate(() => document.documentElement.classList.add('light'))
const light = await readAll()
check('light', LIGHT, light)

await browser.close()
console.log(fails === 0 ? '\nALL TOKEN ALIAS CHAINS RESOLVE TO CANON ✓' : `\n${fails} FAILURES`)
process.exit(fails === 0 ? 0 : 1)
