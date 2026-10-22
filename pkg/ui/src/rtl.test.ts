/**
 * Every side is named logically, so a page follows `<html dir="rtl">`.
 *
 * Hosts ship the interface in Arabic, Persian, Hebrew, Urdu and the other
 * right-to-left locales. Rows and grids follow `dir` on their own; a side
 * written as left or right does not. This reads every source file for a side of
 * the inline axis named physically — a margin, padding, border, corner radius or
 * text alignment — and fails on one that is not on the list below.
 *
 * The list is the physical uses that are right: symmetric pairs (both sides the
 * same), code and terminals (code reads left to right in any language), device
 * mockups and media controls, a logo's own animation, decoration, and the
 * explicit `left`/`right` options a caller can still ask for. A new entry needs
 * one of those reasons; anything else is a migration to `paddingInlineStart`,
 * `marginInlineEnd`, `borderInlineStartWidth`, `borderStartStartRadius`,
 * `insetInlineEnd` or `align('start')`.
 *
 * `scripts/rtl.mjs` is the other half: it mounts the primitives in both
 * directions in a browser and fails on any box that is not its own mirror.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SRC = dirname(fileURLToPath(import.meta.url))

const PHYSICAL =
  /(^|[^A-Za-z0-9_$.-])(pl|pr|ml|mr|paddingLeft|paddingRight|marginLeft|marginRight|borderLeft[A-Za-z]*|borderRight[A-Za-z]*|btlr|btrr|bblr|bbrr|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius)\s*[=:]|(textAlign|text)\s*[=:]\s*\{?\s*["'](left|right)|(margin|padding|border)-(left|right)|text-align:\s*(left|right)/

/** file -> how many physical lines it may hold, and why. */
const ALLOWED: Record<string, [number, string]> = {
  'gallery.tsx': [1, 'symmetric: ml and mr both auto'],
  'tw.ts': [1, 'symmetric: mx-auto'],
  'masthead/Masthead.tsx': [1, 'symmetric: pl and pr both 12'],
  'backends/gui/select.tsx': [2, 'symmetric: pl and pr both the gutter'],
  'agents/PreviewFrame.tsx': [1, 'symmetric: both borders'],
  'backends/gui/animated-tooltip.tsx': [5, 'symmetric: the arrow triangle'],
  'backends/gui/sheet.tsx': [4, 'the explicit left/right sides a caller may ask for'],
  'product/SlideOver.tsx': [2, 'the explicit left/right sides a caller may ask for'],
  'backends/gui/code-block.tsx': [6, 'code: line marks and numbers read left to right'],
  'backends/gui/code-editor.tsx': [3, 'code: the gutter and cursor'],
  'backends/gui/snippet.tsx': [4, 'code: line marks and numbers'],
  'backends/gui/json-tree.tsx': [2, 'code: JSON indentation'],
  'backends/gui/terminal.tsx': [3, 'code: terminal output'],
  'agents/DiffViewer.tsx': [3, 'code: diff gutters'],
  'backends/gui/video-player.tsx': [1, 'media control'],
  'backends/gui/iphone-15-pro.tsx': [1, 'device mockup'],
  'backends/gui/safari.tsx': [1, 'device mockup'],
  'backends/gui/marquee.tsx': [1, 'decoration: scroll gap'],
  'backends/gui/3d-marquee.tsx': [1, 'decoration: scroll gap'],
  'product/animatedLogo.logic.ts': [3, 'logo animation'],
  'product/AnimatedLogo.tsx': [1, 'logo animation'],
  'backends/gui/positions-list.tsx': [1, 'not a style: profit and loss is named pl'],
}

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name)
    if (d.isDirectory()) return sources(p)
    if (!/\.(tsx?|css)$/.test(d.name) || /\.(test|d)\.tsx?$/.test(d.name)) return []
    if (d.name === 'lang.css') return []
    return [p]
  })
}

const found: Record<string, string[]> = {}
for (const file of sources(SRC)) {
  const name = relative(SRC, file)
  readFileSync(file, 'utf8')
    // block comments blanked, line numbers kept: prose may say "left"
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
    .split('\n')
    .forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return
      if (PHYSICAL.test(line)) (found[name] ??= []).push(`${name}:${i + 1}  ${line.trim().slice(0, 100)}`)
    })
}

describe('logical sides', () => {
  it('no file names a physical inline side it has no reason for', () => {
    const offences = Object.entries(found).flatMap(([name, lines]) =>
      lines.length > (ALLOWED[name]?.[0] ?? 0) ? lines : [],
    )
    expect(offences).toEqual([])
  })

  it('the list holds no entry the source has outgrown', () => {
    // A file that dropped its physical lines takes its allowance with it, so the
    // list only ever shrinks toward zero.
    const stale = Object.entries(ALLOWED)
      .filter(([name, [n]]) => (found[name]?.length ?? 0) < n)
      .map(([name, [n]]) => `${name}: allows ${n}, holds ${found[name]?.length ?? 0}`)
    expect(stale).toEqual([])
  })
})
