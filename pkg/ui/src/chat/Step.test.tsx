// @vitest-environment jsdom

/** Step and Failure, asserted on the markup: that the disclosure is a real
 *  disclosure, that a failure interrupts, and that the controls take a
 *  keyboard. */
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { Code, Composer, Failure, Message, Sources, Step, Thread } from './index'

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
    // An untruncated command wraps the header and moves the chevron.
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
    // Reads the glyph's own path data: the states have to be told apart, not
    // merely all render an svg.
    expect(html(<Step name="s" status={status} />)).toContain(signature)
  })

  it('marks a failed step with an edge, never a colour', () => {
    // `product/tone.ts` marks `stopped` with a border, so it survives a brand
    // that retunes the ramp.
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
    // A `role="button"` View takes focus and then ignores Enter and Space.
    const markup = html(<Failure onRetry={() => {}}>x</Failure>)
    expect(markup).toMatch(/<button[^>]*data-slot="failure-retry"/)
  })
})

describe('the module is open', () => {
  // A surface addresses turns by id and finds them by class; both have to reach
  // the element.
  it.each([
    ['Message', <Message key="m" role="user" id="turn-1" className="message-render" />],
    ['Composer', <Composer key="c" value="" onChange={() => {}} onSend={() => {}} id="turn-1" className="message-render" />],
    ['Code', <Code key="k" id="turn-1" className="message-render">x</Code>],
    ['Step', <Step key="s" name="n" id="turn-1" className="message-render" />],
    ['Failure', <Failure key="f" id="turn-1" className="message-render">x</Failure>],
    ['Sources', <Sources key="o" id="turn-1" className="message-render" sources={[{ id: 'a', title: 'A' }]} />],
    ['Thread', <Thread key="t" id="turn-1" className="message-render" />],
  ])('%s passes an id and a class through to its element', (_name, node) => {
    const markup = html(node)
    expect(markup).toContain('id="turn-1"')
    expect(markup).toContain('message-render')
  })

  it('lets a caller restyle the bubble without rebuilding the turn', () => {
    const markup = html(
      <Message role="user" body={{ className: 'glass', bg: '$color5' }}>
        hi
      </Message>,
    )
    expect(markup).toContain('glass')
    expect(markup).toContain('_bg-color5')
  })

  it('names the turn a hover group, so an action strip can reveal itself', () => {
    expect(html(<Message role="assistant" actions={<Code>c</Code>} />)).toContain('t_group')
  })
})
