// @vitest-environment jsdom

/**
 * A field wears design's focus ring, and suppresses nothing.
 *
 * `gui-config.test.ts` holds the other half — that `$outlineColor` IS
 * `var(--ring, …)` in every theme and clears 3:1. A ring nothing draws still
 * measures 3:1, so that test passes just as well on a field with no indicator at
 * all; this one reads the rules the field actually compiles.
 *
 * The three declarations are asserted by VALUE rather than by class name,
 * because gui's atomic names encode the declaration and asserting the name would
 * pass on a rule that says something else under a familiar spelling.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Input, Textarea } from './index'

const markup = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const classes = (html: string) =>
  new Set(
    [...html.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter(Boolean),
  )

/**
 * What the field's own classes declare about `outline-*` when it is
 * keyboard-focused, as `property -> value`.
 *
 * Read out of `config.getCSS()` — the rules gui accumulated while rendering —
 * and filtered to selectors that carry BOTH one of this element's classes and
 * `:focus-visible`, so a neighbour's rule in the same sheet cannot answer for it.
 */
const ring = (html: string) => {
  const own = classes(html)
  const found: Record<string, string> = {}
  for (const rule of config.getCSS().split('}')) {
    const [selector, body] = rule.split('{')
    if (!body || !selector.includes(':focus-visible')) continue
    const named = [...selector.matchAll(/\.(_[A-Za-z0-9_-]+)/g)].map((m) => m[1])
    if (!named.length || !named.some((c) => own.has(c))) continue
    for (const [, prop, value] of body.matchAll(/([a-z-]*outline[a-z-]*)\s*:\s*([^;!]+)/g))
      found[prop.trim()] = value.trim()
  }
  return found
}

describe.each([
  ['Input', <Input />],
  ['Textarea', <Textarea />],
])('%s: focus is design’s ring', (_name, node) => {
  const declared = ring(markup(node))

  // 2px solid var(--ring) — design's `:focus-visible` rule, arriving through
  // gui's `$outlineColor`. `outline-offset` is deliberately absent: gui emits
  // none, so design's own `outline-offset: 2px` is what applies.
  it('draws a 2px solid ring in the theme’s outline colour', () => {
    expect(declared).toMatchObject({
      'outline-width': '2px',
      'outline-style': 'solid',
      'outline-color': 'var(--outlineColor)',
    })
  })

  // The failure this file exists for. gui compiles a field's own
  // `focusVisibleStyle` to `:root:root:root:root … !important`, so a zero width
  // or a `none` style here is not a quieter ring — it is the indicator deleted
  // on every consuming surface, past any stylesheet that tries to restore it.
  it('suppresses nothing', () => {
    expect(declared['outline-width']).not.toBe('0px')
    expect(declared['outline-style']).not.toBe('none')
  })
})
