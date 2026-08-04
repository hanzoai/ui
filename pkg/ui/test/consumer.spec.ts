/**
 * The consumer test. This is the proof; everything else is a proxy for it.
 *
 * It runs against an app OUTSIDE this repo that installed the packed tarball —
 * `npm pack`, then `npm i ./hanzo-ui-*.tgz`. A workspace link resolves through
 * the source tree and would hide every packaging defect at once: a file missing
 * from `files`, a subpath missing from `exports`, a `workspace:*` that never got
 * rewritten (8.0.17 and 8.0.19 shipped that way), a stylesheet that is generated
 * but never shipped.
 *
 * The app imports `@hanzo/ui` and renders. It does not import CSS, build a gui
 * config, or run a generator. What is asserted is what a browser COMPUTED, not
 * what the markup claims.
 */
import { expect, test, type Page } from '@playwright/test'

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
] as const
const THEMES = ['dark', 'light'] as const

/** rgb()/rgba() -> channels. Playwright reports computed colours in that form. */
const rgba = (v: string) => {
  const n = v.match(/[\d.]+/g)?.map(Number) ?? []
  return { r: n[0] ?? 0, g: n[1] ?? 0, b: n[2] ?? 0, a: n[3] ?? 1 }
}

const load = async (page: Page, theme: string) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`/?theme=${theme}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-gallery="button"] [data-slot="button"]')
  await page.evaluate(() => document.fonts.ready)
  expect(errors, 'the page threw').toEqual([])
}

for (const theme of THEMES) {
  test.describe(`${theme} theme`, () => {
    test('every class the markup references has a rule behind it', async ({ page }) => {
      await load(page, theme)
      const { referenced, withRules, sample } = await page.evaluate(() => {
        const used = new Set<string>()
        for (const el of document.querySelectorAll('*'))
          for (const c of el.classList) if (c.startsWith('_')) used.add(c)

        const defined = new Set<string>()
        const walk = (rules: CSSRuleList) => {
          for (const rule of rules) {
            if ((rule as CSSGroupingRule).cssRules) walk((rule as CSSGroupingRule).cssRules)
            const sel = (rule as CSSStyleRule).selectorText
            if (sel) for (const m of sel.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) defined.add(m[1])
          }
        }
        for (const sheet of document.styleSheets) {
          try {
            walk(sheet.cssRules)
          } catch {
            /* cross-origin sheet; none here */
          }
        }
        const missing = [...used].filter((c) => !defined.has(c))
        return { referenced: used.size, withRules: used.size - missing.length, sample: missing.slice(0, 20) }
      })

      // hanzo.app shipped 103 `_bg-` classes against zero `_bg-` rules. This is
      // the assertion that says so out loud.
      expect(referenced, 'no gui atomic classes rendered at all').toBeGreaterThan(100)
      expect(sample, `${referenced - withRules} of ${referenced} classes have no rule`).toEqual([])
    })

    test('components are actually styled, not just present', async ({ page }) => {
      await load(page, theme)
      const button = page.locator('[data-gallery="button"] [data-slot="button"]').first()
      const box = await button.boundingBox()
      expect(box!.height).toBeGreaterThan(24)
      expect(box!.width).toBeGreaterThan(24)

      const style = await button.evaluate((el) => {
        const c = getComputedStyle(el)
        return { bg: c.backgroundColor, radius: c.borderTopLeftRadius, px: c.paddingLeft, display: c.display }
      })
      // An unstyled <button> is transparent, square-cornered and 0-padded. Each
      // of these is a style the gallery's default Button declares.
      expect(rgba(style.bg).a).toBeGreaterThan(0)
      expect(parseFloat(style.radius)).toBeGreaterThan(0)
      expect(parseFloat(style.px)).toBeGreaterThan(0)

      const card = page.locator('[data-gallery="card"] [data-slot="card"]').first()
      expect(parseFloat(await card.evaluate((el) => getComputedStyle(el).borderTopWidth))).toBeGreaterThan(0)
    })

    test('every border is a hairline, and nothing wears the browser chrome', async ({ page }) => {
      await load(page, theme)
      const { chalk, chrome } = await page.evaluate(() => {
        const chalk: string[] = []
        const chrome: string[] = []
        for (const el of document.querySelectorAll('*')) {
          const c = getComputedStyle(el)
          const name = `${el.getAttribute('data-slot') ?? el.tagName}`

          // A native <button> is #efefef with a 2px OUTSET border. `outset` is
          // never authored; it means the UA is styling this element and we are
          // not — which is what put a white bar across a dark page where the
          // Collapsible trigger should have been. `unstyled` has to mean "no
          // chrome", not "the browser's chrome".
          if (c.borderTopStyle === 'outset' || c.borderTopStyle === 'inset') chrome.push(`${name} ${c.border}`)

          if (parseFloat(c.borderTopWidth) === 0 && parseFloat(c.borderBottomWidth) === 0) continue
          for (const side of ['borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor'] as const) {
            const [r, g, b, a = 1] = c[side].match(/[\d.]+/g)?.map(Number) ?? []
            // Solid white is the @hanzo/design defect (`border-card:
            // var(--white…)`) — a chalk line on black. A hairline is low-alpha
            // white or a near-background grey. The Slider thumb ringed itself
            // in `$color12`, which resolves to #fff on dark.
            if (r === 255 && g === 255 && b === 255 && a > 0.35) chalk.push(`${name} ${side}=${c[side]}`)
          }
        }
        return { chalk: chalk.slice(0, 10), chrome: chrome.slice(0, 10) }
      })
      expect(chalk, 'solid white borders on a themed surface').toEqual([])
      expect(chrome, 'elements wearing the UA button border').toEqual([])
    })

    test('a text child renders at a height greater than zero', async ({ page }) => {
      await load(page, theme)
      // `<TabsTrigger>Label</TabsTrigger>` rendered EMPTY on a green build: the
      // markup was right, the element collapsed to 0px, and nothing failed.
      const collapsed = await page.evaluate(() => {
        const bad: string[] = []
        for (const el of document.querySelectorAll('[data-slot]')) {
          const text = [...el.childNodes].some(
            (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '',
          )
          if (!text) continue
          // A closed Select keeps its options in the DOM under `display: none`.
          // Deliberately hidden is not collapsed, and flagging it would train
          // everyone to ignore this test.
          if (!el.checkVisibility()) continue
          const r = el.getBoundingClientRect()
          if (r.height === 0 || r.width === 0)
            bad.push(`${el.getAttribute('data-slot')} "${(el.textContent ?? '').slice(0, 24)}" ${r.width}x${r.height}`)
        }
        return bad
      })
      expect(collapsed, 'elements with text but no box').toEqual([])
    })

    for (const vp of VIEWPORTS)
      test(`looks the same at ${vp.width}px`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await load(page, theme)
        await expect(page).toHaveScreenshot(`gallery-${theme}-${vp.name}.png`, { fullPage: true })
      })
  })
}
