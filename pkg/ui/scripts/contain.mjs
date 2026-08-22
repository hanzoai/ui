// Every shell that pins something, given LESS room than its content.
//
// `responsive.mjs` already asks whether anything escapes the RIGHT edge, and it
// asks one hardcoded question about the bottom: does the composer sit above the
// thread. That question is the general one written down for a single pair, so
// the same defect in the sidebar, the drawer and the workbench went unasked.
//
// The page is MOUNTED, not server-rendered. Both style systems in play register
// their rules from the running app — react-native-web appends a <style> element
// when it is imported, gui inserts an atomic rule the first time a prop renders
// — so a page built from `renderToStaticMarkup` plus a hand-picked list of
// stylesheets has neither, and every box on it measures as unstyled block-level
// HTML. `probe` below refuses to report a number until it has confirmed the
// styling arrived.
//
// Run: node scripts/contain.mjs   (after `pnpm build`)
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'

import { alias } from './alias.mjs'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))

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
const url = `${server.resolvedUrls.local[0].replace(/\/$/, '')}/test/stress.html`

const browser = await chromium.launch()
const tab = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const oops = []
tab.on('pageerror', (e) => oops.push(String(e)))
await tab.goto(url)
await tab.waitForSelector('[data-frame]', { timeout: 30_000 })
await tab.waitForTimeout(500)

// Is the instrument switched on. An unstyled document fails every containment
// question AND the negative control, which reads exactly like a good run — so
// this is checked first and nothing else is believed until it holds.
const probe = await tab.evaluate(() => {
  const read = (k) => {
    const el = document.querySelector(`[data-probe="${k}"]`)?.firstElementChild
    if (!el) return null
    const s = getComputedStyle(el)
    return { display: s.display, minHeight: s.minHeight, minWidth: s.minWidth }
  }
  return { rnw: read('rnw'), gui: read('gui') }
})

for (const [k, v] of Object.entries(probe)) {
  if (v?.display !== 'flex') {
    console.error(
      `the ${k} stylesheet never reached the page — its base rule reads ` +
        `${JSON.stringify(v)}, and a document without it measures nothing.`,
    )
    await browser.close()
    await server.close()
    process.exit(1)
  }
}
console.log(
  `instrument ok — rnw View ${JSON.stringify(probe.rnw)}, gui YStack ${JSON.stringify(probe.gui)}\n`,
)

const rows = await tab.evaluate(() => {
  // What a PERSON sees, not what the box model records. Content scrolled out of
  // an `overflow: auto` region still reports a rect below the fold; counting
  // that as an escape calls a working scroller broken.
  const shown = (el, stop) => {
    let r = el.getBoundingClientRect()
    r = { top: r.top, bottom: r.bottom, left: r.left, right: r.right }
    let a = el.parentElement
    while (a && a !== stop.parentElement) {
      const s = getComputedStyle(a)
      if (s.overflow !== 'visible' || s.overflowY !== 'visible' || s.overflowX !== 'visible') {
        const c = a.getBoundingClientRect()
        r = {
          top: Math.max(r.top, c.top),
          bottom: Math.min(r.bottom, c.bottom),
          left: Math.max(r.left, c.left),
          right: Math.min(r.right, c.right),
        }
        if (r.bottom <= r.top || r.right <= r.left) return null
      }
      a = a.parentElement
    }
    return { ...r, height: r.bottom - r.top, width: r.right - r.left }
  }

  // Three numbers, three different failures:
  //   escape  VISIBLE content past the frame's bottom edge — it paints over
  //           whatever follows.
  //   cut     content the box model puts past that edge which clipping hides.
  //           Harmless if something scrolls to it; silent truncation if not.
  //   scrolls what can actually be scrolled.
  const measure = (host, name, top, bottom, right) => {
    let low = top
    let raw = top
    let far = 0
    let worst = null
    let widest = null
    for (const el of host.querySelectorAll('*')) {
      const box = el.getBoundingClientRect()
      if (box.height >= 1 && box.bottom > raw) raw = box.bottom
      const r = shown(el, host)
      if (!r || r.height < 1 || r.width < 1) continue
      if (r.bottom > low) {
        low = r.bottom
        worst = el.getAttribute('data-slot') || el.tagName.toLowerCase()
      }
      // The same defect turned ninety degrees: a row item that cannot shrink
      // below its content pushes its siblings past the edge.
      if (right != null && r.right - right > far) {
        far = r.right - right
        widest = el.getAttribute('data-slot') || el.tagName.toLowerCase()
      }
    }
    const scrolls = [...host.querySelectorAll('*')]
      .filter((el) => {
        const s = getComputedStyle(el)
        return /auto|scroll/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1
      })
      .map((el) => el.getAttribute('data-slot') || el.tagName.toLowerCase())
    return {
      frame: name,
      box: Math.round(bottom - top),
      escape: Math.round(low - bottom),
      cut: Math.round(raw - bottom),
      wide: Math.round(far),
      worst,
      widest,
      scrolls,
    }
  }

  const out = []
  for (const f of document.querySelectorAll('[data-frame]')) {
    const r = f.getBoundingClientRect()
    out.push({
      ...measure(f, f.getAttribute('data-frame'), r.top, r.bottom, r.right),
      expect: f.getAttribute('data-expect'),
    })
  }
  // A fixed drawer's frame is the VIEWPORT; no wrapper can bound it.
  for (const f of document.querySelectorAll('[data-fixed]'))
    out.push(measure(f, f.getAttribute('data-fixed'), 0, innerHeight, innerWidth))
  return out
})

await browser.close()
await server.close()

for (const e of oops) console.error(`page error: ${e}`)

let bad = 0
for (const r of rows) {
  // Overflowing content has to be REACHABLE: either something scrolls to it, or
  // the shell was never over-filled. Escaping is wrong either way, on both axes.
  const contained = r.escape <= 1 && r.wide <= 1 && (r.cut <= 1 || r.scrolls.length > 0)
  // A negative control has to FAIL. One that starts passing means the gate
  // stopped measuring, which is the failure that hides every other one.
  const ok = r.expect === 'fail' ? !contained : contained
  if (!ok) bad++
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${r.frame.padEnd(13)} box=${String(r.box).padStart(4)}px ` +
      `down=${String(r.escape).padStart(5)}px cut=${String(r.cut).padStart(5)}px ` +
      `across=${String(r.wide).padStart(4)}px ` +
      (r.expect === 'fail'
        ? `control, must not contain: ${contained ? 'CONTAINED — gate is blind' : 'escapes as expected'}`
        : r.wide > 1
          ? `pushedBy=${r.widest}`
          : `scrolls=[${r.scrolls.join(', ') || 'NOTHING'}]`),
  )
}
console.log(
  bad
    ? `\n${bad} of ${rows.length} shells do not contain their content`
    : `\n${rows.length} shells contain their content`,
)
process.exit(bad || oops.length ? 1 : 0)
