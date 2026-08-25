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

    test('one edge, and every exception reads a different token on purpose', async ({ page }) => {
      await load(page, theme)
      // A control that draws `$borderColor` draws design's `--border`, and the
      // browser is the only place that can say so — gui activates a sub-theme
      // per component, so an Input and a Select could read the same token name
      // and land on different colours. They did: measured here at 8.0.100, the
      // Input and Textarea drew `rgb(51,51,51)` and the Button, Switch and the
      // AlertDialog's cancel drew `rgb(69,69,69)`, while the Select — a
      // `<button>`, which activates no sub-theme — already had design's.
      //
      // The exceptions are the four elements that reach for a DIFFERENT token,
      // each named with the one it reads. Anything else appearing here is a
      // control disagreeing with the page about where its edge comes from.
      const EXCEPT = [
        { slot: 'button', attr: 'data-variant', value: 'primary', token: '$color6' },
        { slot: 'toggle-group-item', attr: 'data-state', value: 'on', token: '$color7' },
        { slot: 'switch', attr: 'data-state', value: 'checked', token: '$color12' },
        { slot: 'tooltip-content', attr: null, value: null, token: 'its own light surface' },
      ]
      const stray = await page.evaluate((except) => {
        const out: string[] = []
        for (const el of document.querySelectorAll('*')) {
          const c = getComputedStyle(el)
          if (!parseFloat(c.borderTopWidth)) continue
          const [, , , a = 1] = c.borderTopColor.match(/[\d.]+/g)?.map(Number) ?? []
          if (a === 0 || a < 1) continue // design's edge is the low-alpha one
          const slot = el.getAttribute('data-slot')
          if (except.some((e) => e.slot === slot && (!e.attr || el.getAttribute(e.attr) === e.value))) continue
          out.push(`${slot ?? el.tagName} ${c.borderTopColor}`)
        }
        return [...new Set(out)]
      }, EXCEPT)
      expect(stray, 'an opaque edge that is neither design’s nor a named exception').toEqual([])
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

    /*
     * THERE IS NO FULL-PAGE SCREENSHOT COMPARISON HERE, AND THAT IS DELIBERATE.
     *
     * Four `toHaveScreenshot(gallery-<theme>-<vp>.png, { fullPage: true })`
     * cases used to live at this point. They were removed, with their baselines,
     * because a full-page pixel diff on THIS page cannot tell a defect from its
     * environment.
     *
     * Measured: the CI runner rendered the gallery 6106px tall where the
     * baseline was 5894 (mobile) and 4489 where it was 4437 (desktop), so 27% of
     * pixels differed at mobile — with nothing wrong on the page. The runner
     * simply carries a different font set than the image the baselines were cut
     * in, every line box is a fraction taller, and everything below the first
     * one is shifted. Regenerating elsewhere cannot fix that; only baselines cut
     * ON the runner would match, and they would be invalidated again by the next
     * component added to the gallery, because the gallery's whole job is to grow.
     *
     * It had been red for five days straight — zero passing cicd runs — which
     * means it had stopped being a signal and had become something everyone
     * routes around.
     *
     * What the four cases were meant to protect is asserted directly below
     * instead: measured boxes, from a real browser, that answer whether the
     * LAYOUT is right rather than whether any pixel moved. Those are stable
     * across font sets, they name the thing that broke when they fail, and they
     * do not go stale when a component is added. If you are tempted to add a
     * page screenshot back, add an assertion about the box you actually care
     * about instead.
     */
  })
}

/**
 * Layout primitives — measured, never asserted from the markup.
 *
 * Every defect these exist to kill was invisible to a type checker and to a
 * build, and visible only as a box with the wrong size on a real page. So the
 * questions are asked of a browser: how wide is this track, how tall is that
 * media box, did this control clip its child.
 */
const WIDTHS = [390, 768, 1280] as const

/** Boxes grouped into rows by their y position. */
const rowsOf = (boxes: { x: number; y: number; w: number; h: number }[]) => {
  const rows = new Map<number, typeof boxes>()
  for (const b of boxes) {
    const key = [...rows.keys()].find((y) => Math.abs(y - b.y) < 2) ?? b.y
    rows.set(key, [...(rows.get(key) ?? []), b])
  }
  return [...rows.values()]
}

const boxesIn = (page: Page, sel: string) =>
  page.$$eval(sel, (els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height }
    }),
  )

test.describe('layout', () => {
  for (const width of WIDTHS)
    test(`a 7-card auto grid is even and never overflows at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await load(page, 'dark')

      const cards = await boxesIn(page, '[data-grid="auto"] > [data-slot="card"]')
      expect(cards.length, 'the 7-card grid did not render').toBe(7)

      // Equal widths WITHIN a row. Not across rows: a last row with fewer items
      // still has full-width tracks, which is correct auto-fill behaviour.
      for (const row of rowsOf(cards)) {
        const w = row.map((b) => Math.round(b.w))
        expect(Math.max(...w) - Math.min(...w), `ragged row: ${w.join(', ')}`).toBeLessThanOrEqual(1)
      }

      // The `min(Npx, 100%)` half of the track formula. A bare minmax(240px,1fr)
      // forces a 240px track into a 390px viewport with a gutter and pushes the
      // document wider than the window.
      // Includes data-grid="wide", whose 900px min is larger than this viewport.
      const overflow = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }))
      expect(overflow.scroll, 'the page scrolls horizontally').toBeLessThanOrEqual(overflow.client + 1)

      // The media boxes. Zero-height media is the defect AspectRatio exists for,
      // and it is invisible in markup — the <img> is right there in the DOM.
      const media = await boxesIn(page, '[data-grid="auto"] [data-slot="card-media"]')
      expect(media.length).toBe(7)
      for (const m of media) expect(m.h, 'a media box has no height').toBeGreaterThan(20)
    })

  test('one unbreakable string cannot widen its own column', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await load(page, 'dark')
    // The `minmax(0, 1fr)` proof. With a bare `1fr` the middle card's 48-M
    // string sets its track's min-content floor and the row goes lopsided.
    // Two mechanisms defend this row and they are deliberately redundant:
    // `minmax(0, 1fr)` in the track, and `min-width: 0` on the item. Either one
    // alone holds the row even, which is why breaking just one leaves this test
    // green — proven by mutation, and the reason the mutation script disables
    // BOTH to show the guard has teeth.
    const cards = await boxesIn(page, '[data-grid="fixed"] > [data-slot="card"]')
    expect(cards.length).toBe(3)
    const w = cards.map((b) => Math.round(b.w))
    expect(Math.max(...w) - Math.min(...w), `lopsided: ${w.join(', ')}`).toBeLessThanOrEqual(1)
  })

  test('a card grows with its content instead of pinning a height', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await load(page, 'dark')
    // Deliberately NOT inside a Grid: a grid row stretches every item to the
    // tallest, which is the behaviour you want on a page and which also makes
    // "did this card grow" impossible to measure. Flex-start, so each card is
    // exactly its own content.
    const [lean] = await boxesIn(page, '[data-card="lean"]')
    const [fat] = await boxesIn(page, '[data-card="fat"]')
    expect(fat.h, 'four times the content did not make the card taller').toBeGreaterThan(lean.h)
  })

  test('an image fills its ratio box rather than setting its own size', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await load(page, 'dark')
    const fit = await page.evaluate(() => {
      const box = document.querySelector('[data-grid="auto"] [data-slot="card-media"]')!
      const img = box.querySelector('img')!
      const b = box.getBoundingClientRect()
      const i = img.getBoundingClientRect()
      return { bw: b.width, bh: b.height, iw: i.width, ih: i.height, fit: getComputedStyle(img).objectFit }
    })
    // The swatch is intrinsically 120x40. Filling means it matches the BOX, not
    // its own pixels — without the fill rule it renders 120x40 inside a wider,
    // shorter frame and the ratio the caller asked for means nothing.
    expect(fit.fit).toBe('cover')
    expect(Math.round(fit.iw), 'image does not fill its box width').toBe(Math.round(fit.bw))
    expect(Math.round(fit.ih), 'image does not fill its box height').toBe(Math.round(fit.bh))
  })

  test('a Button given a block child grows instead of clipping it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await load(page, 'dark')
    // The shipped defect, exactly: a 119px thumbnail inside a Button that pins
    // height:36 renders as a sliver. With a minHeight floor the control keeps
    // its size for ordinary text and grows only when it must.
    const { button, child } = await page.evaluate(() => {
      const el = document.querySelector('[data-button="block-child"]')!
      const kid = el.querySelector('[data-block-child]')!
      return { button: el.getBoundingClientRect().height, child: kid.getBoundingClientRect().height }
    })
    expect(child, 'the block child was collapsed').toBeGreaterThanOrEqual(119)
    expect(button, 'the Button clipped its child').toBeGreaterThanOrEqual(child)
  })

  test('an ordinary Button still measures exactly its size token', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await load(page, 'dark')
    // The other half of the minHeight change: a floor must not make ordinary
    // controls taller. default is 36.
    const h = await page
      .locator('[data-gallery="button"] [data-slot="button"]')
      .first()
      .evaluate((el) => el.getBoundingClientRect().height)
    expect(Math.round(h)).toBe(36)
  })

  test('a Band centres a measure and keeps its gutter', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await load(page, 'dark')
    const { outer, inner } = await page.evaluate(() => {
      const o = document.querySelector('[data-section="demo"]')!.getBoundingClientRect()
      const i = document.querySelector('[data-section="demo"] [data-slot="band-inner"]')!.getBoundingClientRect()
      return { outer: { x: o.x, w: o.width }, inner: { x: i.x, w: i.width } }
    })
    expect(inner.w, 'the measure is not capped').toBeLessThanOrEqual(600)
    // Centred: equal slack on both sides of the inner column.
    const left = inner.x - outer.x
    const right = outer.x + outer.w - (inner.x + inner.w)
    expect(Math.abs(left - right), 'the measure is not centred').toBeLessThanOrEqual(1)
  })

  test('$mono resolves to a real monospace face', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await load(page, 'dark')
    const fam = await page
      .locator('[data-type="mono"]')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily)
    // The failure this catches is silent: an undefined font token makes gui emit
    // no class, so the element inherits the UI sans and nothing anywhere says so.
    expect(fam.toLowerCase(), `fontFamily="$mono" resolved to ${fam}`).toMatch(/mono|ui-monospace|menlo|consolas/)
  })

  test('an interactive card is reachable and operable by keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await load(page, 'dark')
    const card = page.locator('[data-card="interactive"]')
    expect(await card.getAttribute('role')).toBe('button')
    expect(await card.getAttribute('tabindex')).toBe('0')
  })
})

/**
 * design's token names are design's. gui must not shadow them.
 *
 * @hanzo/design declares --background/--black/--white on `:root` and `.light`
 * — specificity (0,1,0). gui's generated theme classes declared the same three
 * on `:root.t_dark`/`:root.t_light` — (0,2,0). SPECIFICITY BEATS SOURCE ORDER,
 * so gui won in every app that wires the theme class onto <html>, and design's
 * palette was silently replaced by gui's default grey.
 *
 * The wiring is the whole test. Without a theme class on <html> the shadow
 * cannot fire and the page looks correct — which is exactly why this shipped,
 * and why "re-import design's colors.css last" appeared to fix it. That
 * workaround loses to specificity the moment themes are wired properly: a fix
 * that expires on being fixed.
 */
/**
 * design's declared values, per theme, copied from its own blocks. Equality with
 * these exact strings is the point: billing measured gui winning even where the
 * two AGREE in intent — dark grounded at #141414 (gui) instead of #0a0a0a
 * (design), a drift invisible to a contrast gate and visible as "why is our
 * black slightly grey". A threshold would have passed it. Equality does not.
 */
const DESIGN = {
  t_dark: { background: '#0a0a0a', black: '#000000', white: '#fafafa' },
  // Softened off pure white deliberately: a #ffffff page reads as a lightbox.
  // These are design's declared values; if design moves, this must move WITH it —
  // that is the test doing its job, not an obstacle.
  t_light: { background: '#f7f7f7', black: '#0a0a0a', white: '#ffffff' },
}

for (const [themeClass, expected] of Object.entries(DESIGN))
  test(`design owns its token names under ${themeClass}`, async ({ page }) => {
    await load(page, themeClass === 't_dark' ? 'dark' : 'light')
    const got = await page.evaluate((cls) => {
      // The condition the defect needs: gui's theme class ON <html>. Set by hand
      // so the assertion holds whether or not the app wires it at the root.
      document.documentElement.classList.add(cls)
      // Chromium serialises a custom property's value, so design's `#000000`
      // comes back as `#000`. Expanding the short form compares VALUES rather
      // than spellings — the alternative is a test that fails on a browser
      // formatting choice and teaches everyone to ignore it.
      const read = (n) => {
        const v = getComputedStyle(document.documentElement).getPropertyValue(n).trim().toLowerCase()
        const m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v)
        return m ? `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}` : v
      }
      return { background: read('--background'), black: read('--black'), white: read('--white') }
    }, themeClass)
    // --background is the one that provably moves (billing diffed every design
    // token it consumes under forced gui classes; only this one differs).
    expect(got.background.toLowerCase(), `--background under ${themeClass}`).toBe(expected.background)
    // Declared but unread in both measured apps. Covered because they are the
    // complete set gui redeclared, not because a bug was seen.
    expect(got.black.toLowerCase(), `--black under ${themeClass}`).toBe(expected.black)
    expect(got.white.toLowerCase(), `--white under ${themeClass}`).toBe(expected.white)
  })

/**
 * CommandDialog forwards the palette's own props to the Command inside it.
 *
 * It used to render `<Command>` bare, so `onValueChange` never reached a host
 * and the highlighted row was unreachable from outside. A two-pane palette —
 * list on the left, preview of the highlighted row on the right — was therefore
 * impossible with the stock component, and hanzo.app rebuilt the dialog by hand
 * around the bare `Command` primitive. Its file still carries the reason.
 *
 * Two props, two failure modes, both asserted: selection has to escape
 * (onValueChange) and filtering has to happen (shouldFilter).
 */
/**
 * A spinner that does not spin is a stray line, and nothing says so.
 *
 * hanzo.app had 83 call sites where the rotation was an opt-in class the caller
 * was trusted to remember; one of the 83 did. So this asserts the MOTION, not
 * the markup — and it asserts it here rather than in jsdom, because the
 * keyframes come from react-native-web's own stylesheet at runtime and jsdom
 * computes no animation at all.
 */
test('a Spinner spins, at the size it was asked for', async ({ page }) => {
  await load(page, 'dark')
  const spinners = await page.evaluate(() =>
    [...document.querySelectorAll('[data-slot="spinner"]')].map((el) => ({
      spun: [...el.querySelectorAll('*')].some((n) => {
        const c = getComputedStyle(n)
        return c.animationName !== 'none' && c.animationIterationCount === 'infinite'
      }),
      // offsetWidth, NOT getBoundingClientRect: the rect is the TRANSFORMED box,
      // and this element is mid-rotation — a 12px spinner measured 14.6 there,
      // which reads exactly like a size that failed to arrive.
      w: (el as HTMLElement).offsetWidth,
      h: (el as HTMLElement).offsetHeight,
    })),
  )
  expect(spinners.map((s) => s.spun)).toEqual([true, true, true, true])
  // The gallery renders 12/16/20/32 — the enum upstream types cannot say any of
  // them, and the box is how you tell a number arrived.
  expect(spinners.map((s) => s.w)).toEqual([12, 16, 20, 32])
  expect(spinners.map((s) => s.h)).toEqual([12, 16, 20, 32])
})

test('CommandDialog reports the highlighted row and filters as you type', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await load(page, 'dark')

  // Scoped to THIS palette. The gallery keeps three dialogs open at once so each
  // gets styled, and gui 8.1.0's focus-scope fix changed which of them owns the
  // keyboard — so an unscoped `[role="dialog"] input` is a coin flip between
  // them. That is a property of the harness, not of the component: the thing
  // under test is whether CommandDialog hands its props to Command, not how a
  // browser arbitrates focus between stacked dialogs.
  // Identified by what it CONTAINS, not by an attribute: CommandDialog spreads
  // leftover props onto Dialog, which portals, so a marker put there does not
  // reliably land on a rendered node.
  const palette = page.locator('[role="dialog"]').filter({ hasText: 'alpha' }).first()
  const input = palette.locator('input').first()
  await input.waitFor({ state: 'visible' })

  // Selection escapes. Arrow down moves off `alpha`; the host callback writes
  // the new value onto a node it owns, which is what a preview panel would do.
  // Dispatched at the palette's own input for the reason above.
  await input.evaluate((el) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })),
  )
  await expect
    .poll(async () => page.getAttribute('[data-palette-selected]', 'data-palette-selected'))
    .not.toBe('')

  const afterArrow = await page.getAttribute('[data-palette-selected]', 'data-palette-selected')
  expect(afterArrow, 'onValueChange never reached the host').toBeTruthy()

  // Filtering happens. `gamma` matches, the other two do not, and filtered-out
  // items are hidden rather than unmounted — so visibility is the question.
  await input.fill('gamma')
  await expect
    .poll(async () => palette.locator('[data-slot="command-item"]:visible').count())
    .toBeLessThan(3)
  const visibleText = await palette.locator('[data-slot="command-item"]:visible').allInnerTexts()
  expect(visibleText.join(' ').toLowerCase(), 'typing did not narrow the list').toContain('gamma')
})

/**
 * The column cap. `min` alone cannot say "2 on a phone, 4 on a desktop": 2-up at
 * 390px needs a ~170px floor, and that same floor yields six columns at 1280.
 * `max` raises the floor to one-Mth of the row so auto-fill cannot fit an
 * (M+1)th track, while leaving the small-screen behaviour untouched.
 */
for (const [width, want] of [[390, 2], [1280, 4]] as const)
  test(`a capped grid is ${want}-up at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await load(page, 'dark')
    const boxes = await boxesIn(page, '[data-grid="capped"] > [data-slot="card"]')
    expect(boxes.length, 'the capped grid did not render').toBe(6)
    // Items sharing a y are one row. The first row is the column count.
    const first = rowsOf(boxes).sort((a, b) => a[0].y - b[0].y)[0]
    expect(first.length, `expected ${want} columns at ${width}px`).toBe(want)
    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    expect(overflow.scroll, 'the page scrolls horizontally').toBeLessThanOrEqual(overflow.client + 1)
  })
