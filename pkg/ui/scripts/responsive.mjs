// Every component, at every width a product ships at, under every density a
// person can choose. Fails the build on a layout defect.
//
// This exists because the three defects it now guards were all invisible to the
// suite that already ran: a green build, correct markup, passing class coverage,
// and a surface that looked wrong the moment a human opened it.
//
//   · `<Button isLoading>` rendered 389×309, because gui's Spinner drops
//     `size="small"` on web and the indicator takes its container (300×305). One
//     button, wider than a phone.
//   · The chat demo was framed at a fixed 520×320 while the thread renders ~976px
//     of turns, so the turns painted over the composer instead of scrolling.
//   · The thread did not clip at all — a ScrollView with `overflow: visible`.
//
// What it asserts, per combination:
//   hscroll   the document is never wider than the viewport
//   past      no component escapes the right edge (elements inside a deliberate
//             overflow-x strip are exempt — scrolling there is the feature)
//   squashed  nothing with text renders under 4px tall
//   collide   the composer never sits above the thread's bottom edge
//
// Run: node scripts/responsive.mjs   (after `pnpm build`)
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))
const PAGE = join(UI, 'dist/gallery.html')

if (!existsSync(PAGE)) {
  console.error('dist/gallery.html is missing. Run: pnpm build')
  process.exit(1)
}

// Phone through a wide desktop. 390 is the narrowest phone still shipped; 1920
// is where a fluid layout stops being tested by anything narrower.
const WIDTHS = [390, 768, 1024, 1440, 1920]

// The two ends a person can actually ask for, and the middle. `consumer` is the
// large-type end; `compact` is the dense end a business tool wants.
const PRESETS = [
  ['consumer', { '--density': '1.35', '--type-scale': '1.2', '--radius-scale': '1.4' }],
  ['default', {}],
  ['compact', { '--density': '0.8', '--type-scale': '0.9', '--radius-scale': '0.55' }],
]

const audit = () => {
  const vw = document.documentElement.clientWidth

  // A component inside an overflow-x container is SUPPOSED to be able to exceed
  // it. Counting those reports the feature as a bug — the first version of this
  // check called six false positives at 390px.
  const scrollable = (el) => {
    let a = el.parentElement
    while (a && a !== document.body) {
      if (/auto|scroll|hidden/.test(getComputedStyle(a).overflowX)) return true
      a = a.parentElement
    }
    return false
  }

  const past = []
  const squashed = []
  for (const el of document.querySelectorAll('[data-slot]')) {
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue
    if (r.right > vw + 1 && !scrollable(el)) past.push(el.getAttribute('data-slot'))
    if ((el.textContent || '').trim() && r.height < 4) squashed.push(el.getAttribute('data-slot'))
  }

  const thread = document.querySelector('[data-slot="thread"]')
  const composer = document.querySelector('[data-slot="composer"]')
  const collide =
    thread && composer
      ? composer.getBoundingClientRect().top < thread.getBoundingClientRect().bottom - 1
      : false

  return {
    hscroll: document.documentElement.scrollWidth > vw + 1,
    past: [...new Set(past)],
    squashed: [...new Set(squashed)],
    collide,
  }
}

const browser = await chromium.launch()
let failed = 0

for (const [preset, vars] of PRESETS) {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } })
    await page.goto(`file://${PAGE}`)
    await page.waitForTimeout(600)
    await page.evaluate((v) => {
      for (const [k, val] of Object.entries(v)) document.documentElement.style.setProperty(k, val)
    }, vars)
    await page.waitForTimeout(350)

    const r = await page.evaluate(audit)
    const ok = !r.hscroll && !r.past.length && !r.squashed.length && !r.collide
    if (!ok) {
      failed++
      console.error(
        `FAIL ${preset} @${width}` +
          (r.hscroll ? ' · document scrolls sideways' : '') +
          (r.past.length ? ` · past the right edge: ${r.past.join(', ')}` : '') +
          (r.squashed.length ? ` · rendered flat: ${r.squashed.join(', ')}` : '') +
          (r.collide ? ' · composer overlaps the thread' : ''),
      )
    } else {
      console.log(`ok   ${preset} @${width}`)
    }
    await page.close()
  }
}

await browser.close()
console.log(
  failed
    ? `\n${failed} of ${PRESETS.length * WIDTHS.length} combinations have layout defects`
    : `\n${PRESETS.length * WIDTHS.length} combinations, no layout defects`,
)
process.exit(failed ? 1 : 0)
