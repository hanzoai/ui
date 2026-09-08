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
import { Status } from './status'

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
