// @vitest-environment jsdom

/**
 * Alert's markup contract: the role, the variant reaching every part as a
 * compiled class, the icon's absolute placement, the text column's indent, and
 * which child counts as the icon — asserted on compiled markup, never on a
 * rendered color, because gui compiles style props to atomic classes and a
 * color assertion would only prove a class hash exists.
 *
 * Imports `./alert` directly rather than the backend barrel, so this test
 * cannot fail because an unrelated component's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Alert, AlertDescription, AlertTitle } from './alert'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

/** The elements alone — gui's accumulated stylesheet also names every class. */
const elements = (markup: string) => markup.replace(/<style[\s\S]*?<\/style>/g, '')

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

/** The compiled class for one style property, e.g. cls(el, 'col'). */
const cls = (el: string, prop: string) =>
  (el.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).find((c) => c.startsWith(`_${prop}-`)) ?? ''

const banner = (variant?: 'default' | 'destructive') => (
  <Alert variant={variant}>
    <svg data-testid="icon" />
    <AlertTitle>Heads up!</AlertTitle>
    <AlertDescription>You can add components using the cli.</AlertDescription>
  </Alert>
)

describe('Alert', () => {
  it('renders as an alert region with the title and description slots', () => {
    const markup = html(banner())

    expect(tag(markup, 'alert')).toMatch(/role="alert"/)
    expect(tag(markup, 'alert')).toContain('data-variant="default"')
    expect(tag(markup, 'alert-title').startsWith('<h5')).toBe(true)
    expect(tag(markup, 'alert-description').startsWith('<div')).toBe(true)
    expect(markup).toContain('Heads up!')
    expect(markup).toContain('You can add components using the cli.')
  })

  // The title and description are Text hosts themselves; a second host inside
  // them would restate the default size and color and win the cascade, so the
  // string has to sit directly in the slot for the variant to be visible.
  it('sets the title and description type on the slot itself, with no inner host', () => {
    const markup = html(banner())
    const title = tag(markup, 'alert-title')
    const description = tag(markup, 'alert-description')

    expect(markup).toMatch(/data-slot="alert-title"[^>]*>Heads up!<\/h5>/)
    expect(markup).toMatch(/data-slot="alert-description"[^>]*>You can add components using the cli\.<\/div>/)
    expect(cls(title, 'fw')).toBe('_fw-500')
    expect(cls(description, 'fs')).toBe('_fs-f-size-2')
    expect(cls(description, 'col')).toBe('_col-quiet')
  })

  it('carries the destructive variant onto the frame, icon, title and description', () => {
    const plain = html(banner())
    const markup = html(banner('destructive'))

    expect(tag(markup, 'alert')).toContain('data-variant="destructive"')
    for (const part of ['alert', 'alert-icon', 'alert-title', 'alert-description']) {
      const prop = part === 'alert' ? 'btc' : 'col'
      expect(cls(tag(markup, part), prop), part).not.toBe('')
      expect(cls(tag(markup, part), prop), part).not.toBe(cls(tag(plain, part), prop))
    }
  })

  it('lifts a leading icon out of the flow and indents the text column to clear it', () => {
    const markup = html(banner())
    const icon = tag(markup, 'alert-icon')

    expect(markup).toContain('data-testid="icon"')
    expect(cls(icon, 'pos')).toBe('_pos-absolute')
    expect(markup.indexOf('data-slot="alert-icon"')).toBeLessThan(markup.indexOf('data-slot="alert-title"'))
    // The column after the icon, and only then, indents past it.
    expect(elements(markup)).toContain('_pl-28px')
    expect(elements(html(<Alert><AlertTitle>t</AlertTitle></Alert>))).not.toContain('_pl-28px')
  })

  it('treats only the first child as the icon, so a trailing action stays in the flow', () => {
    const markup = html(
      <Alert>
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>Update your billing details.</AlertDescription>
        <button type="button">Retry</button>
      </Alert>,
    )

    expect(tag(markup, 'alert-icon')).toBe('')
    expect(markup.indexOf('<button')).toBeGreaterThan(markup.indexOf('data-slot="alert-description"'))
  })

  it('gives a bare string child a Text host', () => {
    const markup = html(<Alert>plain</Alert>)

    expect(markup).toMatch(/<span[^>]*data-slot="sizable-text"[^>]*>plain<\/span>/)
  })
})
