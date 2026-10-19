// @vitest-environment jsdom

/**
 * Status renders a real slot with the right variant and dot, asserted on
 * compiled markup — @hanzo/gui drops an unrecognised prop with no throw, so
 * "the label rendered" alone proves nothing about the variant reaching it.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Status, STATUS_HUE } from './status'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('Status', () => {
  it('defaults to the default variant with a dot', () => {
    const markup = html(<Status>Draft</Status>)

    expect(tag(markup, 'status')).toContain('data-variant="default"')
    expect(tag(markup, 'status-dot')).not.toBe('')
    expect(markup).toContain('Draft')
  })

  it('carries each documented variant onto the slot', () => {
    for (const variant of ['success', 'warning', 'error', 'info', 'gray'] as const) {
      const markup = html(<Status variant={variant}>{variant}</Status>)
      expect(tag(markup, 'status')).toContain(`data-variant="${variant}"`)
    }
  })

  it('drops the dot when dot is false', () => {
    const markup = html(<Status dot={false}>Quiet</Status>)

    expect(tag(markup, 'status-dot')).toBe('')
    expect(markup).toContain('Quiet')
  })

  it('gives each variant its own dot color, distinct from the default', () => {
    const dotColor = (markup: string) => {
      const dot = tag(markup, 'status-dot')
      return (dot.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).find((c) => c.startsWith('_bg-'))
    }

    const base = dotColor(html(<Status>d</Status>))
    const success = dotColor(html(<Status variant="success">s</Status>))
    const error = dotColor(html(<Status variant="error">e</Status>))

    expect(base).toBeTruthy()
    expect(success).toBeTruthy()
    expect(error).toBeTruthy()
    expect(success).not.toBe(base)
    expect(error).not.toBe(success)
  })
})

describe('Status in a data hue', () => {
  it('a variant renders as before', () => {
    expect(tag(html(<Status variant="success">ok</Status>), 'status')).toContain('data-variant="success"')
  })

  it('a colour is a 20px pill in the hue, its dot 4px in the ink', () => {
    const markup = html(<Status color="teal">Importing</Status>)
    const el = tag(markup, 'status')
    expect(el).toContain('data-color="teal"')
    expect(el).toContain('--tone-3:var(--data-teal-3)')
    expect(el).toMatch(/_height-20px/)
    expect(tag(markup, 'status-dot')).toMatch(/_width-4px/)
  })

  it('the semantic names alias onto hues', () => {
    expect(STATUS_HUE).toEqual({ default: 'gray', gray: 'gray', success: 'green', warning: 'orange', error: 'red', info: 'blue' })
    expect(tag(html(<Status color="warning">x</Status>), 'status')).toContain('data-color="orange"')
    expect(tag(html(<Status color="chartreuse">x</Status>), 'status')).toContain('data-color="gray"')
  })

  it('loading busies the pill and narrows its end gutter', () => {
    const el = tag(html(<Status color="teal" loading>x</Status>), 'status')
    expect(el).toContain('aria-busy="true"')
    expect(el).toMatch(/_pr-c-space-1/)
  })
})
