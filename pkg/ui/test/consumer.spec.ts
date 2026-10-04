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
      // The exceptions are the elements that reach for a DIFFERENT token, each
      // named with the one it reads. Anything else appearing here is a
      // control disagreeing with the page about where its edge comes from.
      const EXCEPT = [
        { slot: 'button', attr: 'data-variant', value: 'primary', token: '$color6' },
        { slot: 'toggle-group-item', attr: 'data-state', value: 'on', token: '$color7' },
        { slot: 'switch', attr: 'data-state', value: 'checked', token: '$color12' },
        { slot: 'tooltip-content', attr: null, value: null, token: 'its own light surface' },
        // A control's boundary must reach 3:1 against the page (WCAG 1.4.11);
        // the hairline does not, so these two read `$bound`.
        { slot: 'checkbox', attr: null, value: null, token: '$bound' },
        { slot: 'radio-group-item', attr: null, value: null, token: '$bound' },
        // The `stopped` register from product/tone.ts: an outline, not a hue.
        { slot: 'step', attr: 'data-status', value: 'error', token: '$faint' },
        { slot: 'failure', attr: null, value: null, token: '$faint' },
        { slot: 'status-dot', attr: null, value: null, token: '$faint, the ring of a hollow dot' },
        { slot: 'connection-badge', attr: null, value: null, token: '$green3' },
        // The one-line composer sits on `$hover` and needs an edge the eye finds.
        { slot: 'composer', attr: 'data-variant', value: 'inline', token: '$rim' },
        // The settings page's chosen chip is outlined in the ink it is written in
        // — the phone's only mark of where you are.
        { slot: 'settings-chip', attr: 'aria-current', value: 'page', token: '$ink' },
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

  test('under a coarse pointer every Button floors at 44, and a mouse keeps 36', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    await load(page, 'dark')
    const heights = await page
      .locator('[data-gallery="button"] [data-slot="button"]')
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)))
    expect(heights.length, 'the gallery drew its buttons').toBeGreaterThan(0)
    expect(Math.min(...heights), 'a Button a thumb can miss').toBeGreaterThanOrEqual(44)
    await ctx.close()
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
    // Scoped to the spinner section: a Spinner used as another component's icon
    // is not one of the four sizes this asserts.
    [...document.querySelectorAll('[data-gallery="spinner"] [data-slot="spinner"]')].map((el) => ({
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

/**
 * A pinned control is where it was pinned — measured as a box, not read off a
 * class.
 *
 * `touch()` writes `position: relative` on web to host its 44px hit area, and
 * every control below had it spread AFTER its own `absolute`. It won, and each
 * one dropped into the flow: the dialog's ✕ drew at the content's bottom-left
 * (half off the screen in a left Sheet), the password eye sat 4px past the
 * field's edge, the slider's knob rode 7px off its track. The unit suites
 * prove the computed `position`; only a browser says where the box lands, so
 * each assertion here is a rectangle inside a rectangle.
 */
test('every dialog draws its close button in its top-right corner', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await load(page, 'dark')
  const offsets = await page.evaluate(() =>
    // The ✕ by its label. DialogTemplate's footer Cancel is a `DialogClose`
    // too and carries the same slot, in flow where it belongs.
    [...document.querySelectorAll('[data-slot="dialog-close"][aria-label="Close"]')].map((el) => {
      const c = el.getBoundingClientRect()
      const p = el.closest('[data-slot="dialog-content"], [data-slot="sheet-content"]')!.getBoundingClientRect()
      return { top: c.top - p.top, right: p.right - c.right, bottom: p.bottom - c.bottom, left: c.left - p.left }
    }),
  )
  expect(offsets.length, 'the gallery rendered no dialog close button').toBeGreaterThan(0)
  for (const o of offsets) {
    // 16px in from the padding edge, plus the 1px border.
    expect(o.top, 'the ✕ is not at the top').toBeGreaterThanOrEqual(0)
    expect(o.top, 'the ✕ is not at the top').toBeLessThanOrEqual(24)
    expect(o.right, 'the ✕ is not at the right').toBeGreaterThanOrEqual(0)
    expect(o.right, 'the ✕ is not at the right').toBeLessThanOrEqual(24)
    expect(o.left, 'the ✕ sits on the left').toBeGreaterThan(o.right)
    expect(o.bottom, 'the ✕ sits at the bottom').toBeGreaterThan(o.top)
  }
})

test('the password eye sits inside its field, at the right', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await load(page, 'dark')
  const { eye, field } = await page.evaluate(() => {
    const el = document.querySelector('[data-gallery="form"] [aria-label="Show password"]')!
    const r = (n: Element) => n.getBoundingClientRect().toJSON() as DOMRect
    return { eye: r(el), field: r(el.parentElement!.querySelector('input')!) }
  })
  expect(eye.left, 'the eye is not in the field’s right half').toBeGreaterThan(field.left + field.width / 2)
  expect(eye.right, 'the eye runs past the field').toBeLessThanOrEqual(field.right)
  expect(eye.top, 'the eye rides above the field').toBeGreaterThanOrEqual(field.top - 1)
  expect(eye.bottom, 'the eye hangs under the field').toBeLessThanOrEqual(field.bottom + 1)
})

test('the slider knob sits on its track, at its value', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await load(page, 'dark')
  // The gallery's Slider is `defaultValue={[40]}` on 0–100. gui keeps the knob
  // inside the track's ends, so its centre lands within a knob's width of 40%.
  // Polled: gui places the knob once it has measured it.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const root = document.querySelector('[data-gallery="form"] [data-slot="slider"]')!
          const k = root.querySelector('[data-slot="slider-thumb"]')!.getBoundingClientRect()
          const t = root.querySelector('[data-slot="slider-track"]')!.getBoundingClientRect()
          const along = Math.abs(k.left + k.width / 2 - (t.left + t.width * 0.4)) <= k.width
          const on = Math.abs(k.top + k.height / 2 - (t.top + t.height / 2)) <= 1
          return along && on
        }),
      { message: 'the knob is not on its track at 40%' },
    )
    .toBe(true)
})

/**
 * The shell — hanzo.build's look as the library's default, measured where it
 * matters: at a phone's width and a desktop's, in both themes. Every answer is a
 * box a browser computed; none is read off the markup.
 *
 *   rail     the column from `md` up (open 272, collapsed 56), gone below it
 *   bar      the phone's header below `md`, gone from it up
 *   head     brand over search over New, in flow
 *   account  the name over its second line
 *   home     the question centred on the pane, the composer under it
 *   settings the grouped nav from `md` up, the chips below it, a 760 column
 *   catalog  one card a row on a phone, as many 280px columns as fit on a desktop
 */
const shown = (page: Page, sel: string) =>
  page.$$eval(sel, (els) => els.map((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0))

type Box = { x: number; y: number; w: number; h: number }

/**
 * Every box a test compares, read in ONE frame.
 *
 * The gallery holds a dozen modal surfaces open so each is styled, and as the
 * page loads their focus scopes pass focus down it and the browser scrolls to
 * follow — thousands of pixels, for a second or more after `networkidle`. A box
 * is where it is RELATIVE TO THE VIEWPORT, so two boxes read in two round trips
 * straddle that scroll and disagree about where the page is: CI read a Home mark
 * 151–491px off its own line, and the rail's brand 586px under the search it sits
 * above, on a page whose layout was right (read in one frame, both are 0 off).
 * A comparison is only true of boxes read together.
 */
const frame = async <K extends string>(page: Page, sels: Record<K, string>): Promise<Record<K, Box>> => {
  const got = await page.evaluate((sels) => {
    const out: Record<string, Box | null> = {}
    for (const [k, s] of Object.entries(sels)) {
      const r = document.querySelector(s)?.getBoundingClientRect()
      out[k] = r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null
    }
    return out
  }, sels as Record<string, string>)
  for (const [k, b] of Object.entries(got)) expect(b, `${sels[k as K]} did not render`).toBeTruthy()
  return got as Record<K, Box>
}

for (const theme of THEMES)
  for (const width of [390, 1280] as const) {
    const phone = width < 768
    test.describe(`the shell, ${theme}, ${width}px`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await load(page, theme)
      })

      test(phone ? 'the rail is gone and the bar carries menu, brand and search' : 'the rail is a column and the bar is gone', async ({ page }) => {
        const rails = await shown(page, '[data-rail="shell"] [data-slot="session-rail"]')
        expect(rails, 'the two rails').toEqual(phone ? [false, false] : [true, true])
        const [bar] = await shown(page, '[data-slot="rail-bar"]')
        expect(bar, 'the phone bar').toBe(phone)
        if (phone) {
          const { bar: b } = await frame(page, { bar: '[data-slot="rail-bar"]' })
          expect(Math.round(b.h)).toBe(44)
          const named = await page.$$eval('[data-slot="rail-bar"] [aria-label]', (els) => els.map((e) => e.getAttribute('aria-label')))
          expect(named).toEqual(['Open runs', 'Search runs'])
        } else {
          const widths = (await boxesIn(page, '[data-rail="shell"] [data-slot="session-rail"]')).map((r) => Math.round(r.w))
          expect(widths, 'open and collapsed widths').toEqual([272, 56])
        }
      })

      if (!phone)
        test('the head is in flow: brand over search over New, and the account reads on two lines', async ({ page }) => {
          const rail = '[data-rail="shell"] [data-slot="session-rail"][data-collapsed="false"]'
          const { brand, search, fresh, row, sub, notice } = await frame(page, {
            brand: `${rail} [data-slot="rail-brand"]`,
            search: `${rail} [data-slot="rail-search"]`,
            fresh: `${rail} [data-slot="rail-new"]`,
            row: `${rail} [data-slot="rail-account"]`,
            sub: `${rail} [data-slot="rail-account-sub"]`,
            notice: `${rail} [data-slot="rail-notice"]`,
          })
          expect(brand.y + brand.h, 'the brand sits over the search').toBeLessThanOrEqual(search.y + 1)
          expect(search.y + search.h, 'the search sits over New').toBeLessThanOrEqual(fresh.y + 1)
          expect(Math.round(search.h)).toBe(34)
          const border = await page.$eval(`${rail} [data-slot="rail-search"]`, (e) => parseFloat(getComputedStyle(e).borderTopWidth))
          expect(border, 'the search box is bordered').toBeGreaterThan(0)
          expect(sub.y, 'the org is under the name').toBeGreaterThan(row.y + 8)
          expect(sub.y + sub.h, 'inside the row').toBeLessThanOrEqual(row.y + row.h + 1)
          // The notice sits in the rail, above the account.
          expect(notice.y + notice.h).toBeLessThanOrEqual(row.y)
        })

      test('home centres the question on its pane with the composer under it', async ({ page }) => {
        const { pane, mark, title, field } = await frame(page, {
          pane: '[data-home="demo"] [data-slot="home"]',
          mark: '[data-home="demo"] [data-slot="home-mark"]',
          title: '[data-home="demo"] [data-slot="home-title"]',
          field: '[data-home="demo"] [data-slot="composer"]',
        })
        // The mark and the question are one line, and it is the LINE that is
        // centred: the question alone sits off by half the mark and its gap.
        const start = Math.min(mark.x, title.x)
        const end = Math.max(mark.x + mark.w, title.x + title.w)
        const left = start - pane.x
        const right = pane.x + pane.w - end
        expect(Math.abs(left - right), `the question is centred: ${left} | ${right}`).toBeLessThanOrEqual(2)
        expect(Math.abs(mark.y + mark.h / 2 - (title.y + title.h / 2)), 'the mark sits on the line').toBeLessThanOrEqual(4)
        expect(field.y, 'the composer is under the question').toBeGreaterThan(title.y + title.h - 1)
        expect(field.w, 'the composer spans the column').toBeGreaterThan(Math.min(pane.w - 40, 700))
        const size = await page.$eval('[data-home="demo"] [data-slot="home-title"]', (e) => parseFloat(getComputedStyle(e).fontSize))
        expect(size, 'the question is display-sized').toBeGreaterThanOrEqual(26)
      })

      test(phone ? 'settings lists its sections as chips over the column' : 'settings lists its sections in a grouped column beside a 760 measure', async ({ page }) => {
        const [nav] = await shown(page, '[data-settings="demo"] [data-slot="settings-nav"]')
        const [chips] = await shown(page, '[data-settings="demo"] [data-slot="settings-chips"]')
        expect([nav, chips]).toEqual(phone ? [false, true] : [true, false])
        if (!phone) expect(Math.round((await frame(page, { nav: '[data-settings="demo"] [data-slot="settings-nav"]' })).nav.w)).toBe(220)
        const { body } = await frame(page, { body: '[data-settings="demo"] [data-slot="settings-body"]' })
        expect(body.w, 'the section column is a measure').toBeLessThanOrEqual(760)
        const current = await page.$$eval(
          `[data-settings="demo"] [data-slot="${phone ? 'settings-chip' : 'settings-entry'}"][aria-current="page"]`,
          (els) => els.filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.textContent),
        )
        expect(current).toEqual(['General'])
      })

      test(phone ? 'the catalogue stacks its cards and drops the tab icons' : 'the catalogue lays its cards in as many 280px columns as fit', async ({ page }) => {
        const tiles = await boxesIn(page, '[data-shelf="demo"] [data-slot="tile"]')
        expect(tiles.length).toBe(3)
        // As many 280px tracks as the list holds with its 12px gaps — one on a
        // phone, and on a desktop whatever the gallery's column gives it.
        const { list } = await frame(page, { list: '[data-shelf="demo"] [data-slot="grid"]' })
        const fit = Math.max(1, Math.floor((list.w + 12) / (280 + 12)))
        if (phone) expect(fit).toBe(1)
        else expect(fit, 'a desktop fits more than one card').toBeGreaterThan(1)
        const rows = rowsOf(tiles).sort((a, b) => a[0].y - b[0].y)
        expect(rows[0].length, 'cards in the first row').toBe(Math.min(3, fit))
        const w = tiles.map((t) => Math.round(t.w))
        expect(Math.max(...w) - Math.min(...w), `ragged cards: ${w.join(', ')}`).toBeLessThanOrEqual(1)
        const icons = await page.$$eval('[data-shelf="demo"] [data-slot="shelf-tab"] svg', (els) =>
          els.map((e) => e.getBoundingClientRect().width > 0),
        )
        expect(icons).toEqual(phone ? [false, false] : [true, true])
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, 'the page scrolls sideways').toBeLessThanOrEqual(1)
      })
    })
  }

/**
 * The drawer hands focus back to what opened it — measured in a real browser,
 * because that is the only place it can fail. gui's Dialog is a native
 * `<dialog>`, and Chromium moves focus into one as it opens, before any effect
 * runs: an opener read in an effect was already the drawer's first row, and
 * every close — Escape, a recent, an account row — left focus on `<body>`
 * while the unit suite, on jsdom's inert `<dialog>`, stayed green.
 *
 * `?page=phone` is `Phone` from the gallery module: the bar and the drawer on a
 * page with nothing else open. The host counts the closes it is told of; each
 * way out must tell it exactly once.
 */
for (const theme of THEMES)
  test(`${theme}: the drawer hands focus back to the bar and closes once, by Escape, a recent and an account row`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/?page=phone&theme=${theme}`, { waitUntil: 'networkidle' })
    const opener = page.locator('[data-phone="demo"] [aria-label="Open runs"]')
    await opener.waitFor()
    const drawer = page.locator('[data-slot="session-rail-drawer"]')
    const open = async () => {
      await opener.focus()
      await page.keyboard.press('Enter')
      await drawer.waitFor()
      // Focus is inside the drawer, where the dialog put it.
      await expect.poll(() => drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    }
    const back = async (how: string) => {
      await expect(drawer, how).toHaveCount(0)
      await expect.poll(() => opener.evaluate((el) => el === document.activeElement), { message: `${how}: focus is back on the bar's menu button` }).toBe(true)
      expect(await page.getAttribute('[data-phone="demo"]', 'data-closes'), `${how}: closes told to the host`).toBe('1')
    }

    await open()
    await page.keyboard.press('Escape')
    await back('Escape')

    await open()
    await drawer.locator('[data-slot="rail-session"]').first().focus()
    await page.keyboard.press('Enter')
    await back('a recent, by Enter')

    await open()
    await drawer.locator('[data-slot="rail-account"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-slot="rail-menu"] [role="menuitem"]').first()).toBeFocused()
    await page.keyboard.press('Enter')
    await back('an account row, by Enter')

    await open()
    await drawer.locator('[data-slot="rail-account"]').focus()
    await page.keyboard.press('Enter')
    // The menu's focus scope moves focus in once it is idle; End is pressed in it.
    await expect(page.locator('[data-slot="rail-menu"] [role="menuitem"]').first()).toBeFocused()
    await page.keyboard.press('End')
    await expect(page.locator('[data-slot="rail-menu"] [role="menuitem"]').last()).toBeFocused()
    await page.keyboard.press('Enter')
    await back('sign out, by Enter')

    await open()
    // The overlay, right of the 86%-wide drawer.
    await page.mouse.click(380, 420)
    await back('a tap on the overlay')

    expect(errors, 'the page threw').toEqual([])
  })
