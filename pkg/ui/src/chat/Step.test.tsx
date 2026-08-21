// @vitest-environment jsdom

/**
 * What a step and a failure promise, asserted on the markup rather than on the
 * source. Both are arrangements the surfaces had each drawn by hand, so the
 * things worth pinning are the ones a hand-drawn copy got wrong: whether the
 * disclosure is a real disclosure, whether a failure interrupts, and whether
 * the controls answer a keyboard.
 */
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { Failure, Step } from './index'

const html = (node: ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  ).replace(/<style[\s\S]*?<\/style>/g, '')

describe('Step', () => {
  it('names what ran and the one line beside it', () => {
    const markup = html(<Step name="shell" detail="git status --porcelain" />)
    expect(markup).toContain('shell')
    expect(markup).toContain('git status --porcelain')
    expect(markup).toContain('data-slot="step"')
  })

  it('clamps both header strings to one line', () => {
    // An untruncated command wraps the header and moves the chevron, which is
    // why the app cuts its own to 50 characters at the call site. Here the
    // clamp is the component's, so no caller has to remember.
    const markup = html(<Step name="shell" detail={'x'.repeat(400)} />)
    expect([...markup.matchAll(/_ws-nowrap/g)]).toHaveLength(2)
  })

  it('is a real disclosure when it has a body', () => {
    const markup = html(
      <Step name="write" defaultOpen>
        body
      </Step>,
    )
    // From the primitive, not from us: the trigger is a <button>, it says what
    // it controls, and it says whether that thing is open.
    expect(markup).toMatch(/<button[^>]*aria-expanded="true"/)
    expect(markup).toMatch(/<button[^>]*aria-controls="/)
    expect(markup).toContain('data-slot="step-body"')
  })

  it('offers no control when there is nothing to open', () => {
    // A chevron over an empty body is a keyboard stop that does not answer.
    const markup = html(<Step name="plan" />)
    expect(markup).not.toContain('<button')
    expect(markup).not.toContain('data-slot="step-body"')
  })

  it.each([
    ['running', 'progressbar'],
    ['done', 'M20 6 9 17l-5-5'],
    ['error', 'm21.73 18-8-14'],
    ['cancelled', 'm4.9 4.9 14.2 14.2'],
  ] as const)('draws its own mark for %s', (status, signature) => {
    // Each state has to be TOLD APART, so this reads the glyph's own path data
    // rather than merely asserting that some svg rendered.
    expect(html(<Step name="s" status={status} />)).toContain(signature)
  })

  it('marks a failed step with an edge, never a colour', () => {
    // `product/tone.ts`: "this system has no colour to spend". `stopped` is set
    // apart by a border, and a step that errored is set apart the same way, so
    // it survives a brand that retunes the ramp.
    expect(html(<Step name="s" status="error" />)).toContain('_btc-color9')
    expect(html(<Step name="s" status="done" />)).toContain('_btc-borderColor')
  })

  it('states its status on the element, for a surface that styles past us', () => {
    expect(html(<Step name="s" status="cancelled" />)).toContain('data-status="cancelled"')
  })
})

describe('Failure', () => {
  it('interrupts, because the reader is waiting on prose that is not coming', () => {
    const markup = html(<Failure>It broke.</Failure>)
    expect(markup).toContain('role="alert"')
    expect(markup).toContain('aria-live="assertive"')
    expect(markup).toContain('It broke.')
  })

  it('wraps a bare string in a text host', () => {
    expect(html(<Failure>It broke.</Failure>)).toMatch(
      /<span[^>]*data-slot="sizable-text"[^>]*>It broke\.</,
    )
  })

  it('carries the same failure edge as a failed step', () => {
    expect(html(<Failure>x</Failure>)).toContain('_btc-color9')
  })

  it('offers retry only when there is something to retry', () => {
    expect(html(<Failure>x</Failure>)).not.toContain('data-slot="failure-retry"')
    expect(html(<Failure onRetry={() => {}}>x</Failure>)).toContain('Try again')
  })

  it('gives retry a real button, so a keyboard can reach it', () => {
    // A `role="button"` View takes focus and then ignores Enter and Space —
    // activation belongs to the element, not the attribute. The one control on
    // a failed turn is the last one that should be pointer-only.
    const markup = html(<Failure onRetry={() => {}}>x</Failure>)
    expect(markup).toMatch(/<button[^>]*data-slot="failure-retry"/)
  })
})
