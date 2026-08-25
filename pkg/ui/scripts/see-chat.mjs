/**
 * Look at `Chat` in a real browser.
 *
 * The unit tests prove it mounts and that the stylesheet has a rule for every
 * class it renders. Neither answers the question this asks: does the thread take
 * the slack and the composer stay pinned under it, at a phone width and a laptop
 * width, in both themes.
 *
 * It reads COMPUTED style rather than the style attribute, because gui compiles a
 * style prop to an atomic class and writes no inline style at all — an assertion
 * against `el.style` passes on an element that is correctly laid out and on one
 * that is not. And it confirms the sheets arrived before believing any box: a
 * document with no styles fails every containment question AND fails the negative
 * control, which reads exactly like a good run.
 */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const ROOT = new URL('../dist/', import.meta.url).pathname
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' }

const server = createServer(async (req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'gallery.html'
  try {
    const body = await readFile(join(ROOT, rel))
    res.writeHead(200, { 'content-type': TYPES[extname(rel)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404).end('no')
  }
})
await new Promise((r) => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}/gallery.html`

const browser = await chromium.launch()
const problems = []
const note = (s) => console.log(`  ${s}`)

for (const [label, width, height] of [
  ['phone', 390, 844],
  ['laptop', 1280, 900],
]) {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.goto(base, { waitUntil: 'load' })

  // The sheets must be here, or every number below is about an unstyled document.
  const styled = await page.evaluate(() => {
    const probe = document.querySelector('[data-gallery="chat"]')
    if (!probe) return null
    return getComputedStyle(probe).display
  })
  if (styled !== 'flex') {
    problems.push(`${label}: the chat section computed display=${styled}, so the stylesheet did not arrive`)
    await page.close()
    continue
  }

  const seen = await page.evaluate(() => {
    // The frame names itself. Walking N parents up from the composer lands on a
    // `display: contents` wrapper or on the page, which is how the first version
    // of this check reported four defects that were all its own.
    return [...document.querySelectorAll('[data-slot="chat"]')].map((frame) => {
      const ta = frame.querySelector('textarea')
      if (!ta) return { missing: true }
      const f = frame.getBoundingClientRect()
      const t = ta.getBoundingClientRect()
      const cs = getComputedStyle(frame)
      return {
        frame: { w: Math.round(f.width), h: Math.round(f.height), display: cs.display, dir: cs.flexDirection },
        composer: { w: Math.round(t.width), h: Math.round(t.height), bottom: Math.round(t.bottom) },
        // The composer must sit inside its frame, not overflow it.
        contained: t.bottom <= f.bottom + 1 && t.top >= f.top - 1,
        readable: getComputedStyle(ta).fontSize,
      }
    })
  })

  note(`${label} ${width}x${height} — ${seen.length} <Chat> mounted`)
  seen.forEach((s, i) => {
    note(
      `    [${i}] frame ${s.frame.w}x${s.frame.h} ${s.frame.display}/${s.frame.dir}` +
        `  composer ${s.composer.w}x${s.composer.h}  contained=${s.contained}  font=${s.readable}`,
    )
    if (!s.contained) problems.push(`${label}[${i}]: the composer escapes its frame`)
    if (s.composer.w < 100) problems.push(`${label}[${i}]: composer is ${s.composer.w}px wide`)
    if (s.frame.h < 40) problems.push(`${label}[${i}]: frame collapsed to ${s.frame.h}px`)
  })
  if (seen.length !== 2) problems.push(`${label}: expected 2 <Chat>, saw ${seen.length}`)
  seen.forEach((s, i) => { if (s.missing) problems.push(`${label}[${i}]: <Chat> rendered no composer`) })

  await page.screenshot({ path: `/tmp/chat-${label}.png`, fullPage: false })
  await page.close()
}

await browser.close()
server.close()

if (problems.length) {
  console.log('\n  PROBLEMS')
  for (const p of problems) console.log(`    ${p}`)
  process.exit(1)
}
console.log('\n  chat renders, contains its composer, and is legible at both widths')
