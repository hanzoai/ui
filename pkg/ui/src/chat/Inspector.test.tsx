// @vitest-environment jsdom

/**
 * The panel, and the one thing it must never do: report absence as presence.
 *
 * A section that renders its heading over nothing reads as "the run produced
 * no outputs" when the truth is "nothing was reported" — the two are different
 * facts and the pane is the surface people check work against. So an empty
 * section is asserted GONE, heading and all.
 *
 * Everything else here is composition: the sections' bodies are `Parts`, so
 * whatever a run produced draws the same way it draws in the thread, and one
 * panel serves a chat turn, a coding run and a research run without three
 * copies of this file.
 */
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { EMPTY, made, stage, type Frame } from './directive'
import { Inspector } from './Inspector'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root

const mount = (ui: ReactNode) => {
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })
}

const text = () => host.textContent ?? ''
const count = (slot: string) => host.querySelectorAll(`[data-slot='${slot}']`).length

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

describe('Inspector', () => {
  it('leads with the summary', () => {
    mount(<Inspector summary="Priced three tiers and drew the page." />)
    expect(count('inspector-summary')).toBe(1)
    expect(text()).toContain('Priced three tiers')
  })

  it('draws a record as name and value', () => {
    mount(
      <Inspector
        sections={[{ name: 'Inputs', facts: { audience: 'developers', tiers: 3 } }]}
      />,
    )
    expect(count('inspector-facts')).toBe(1)
    expect(text()).toContain('audience')
    expect(text()).toContain('developers')
    // A number is not a string, so it goes through `Code` — still readable,
    // which is the only thing being claimed.
    expect(text()).toContain('tiers')
    expect(text()).toContain('3')
  })

  it('drops a section with nothing in it, heading and all', () => {
    // The failure this prevents: an "Outputs" heading over blank space, which
    // reads as "produced nothing" rather than "not reported".
    mount(
      <Inspector
        summary="Ran."
        sections={[
          { name: 'Inputs', facts: { q: 1 } },
          { name: 'Outputs', facts: {} },
          { name: 'Produced', parts: [] },
          { name: 'Nothing at all' },
        ]}
      />,
    )
    expect(count('inspector-section')).toBe(1)
    expect(text()).toContain('Inputs')
    expect(text()).not.toContain('Outputs')
    expect(text()).not.toContain('Nothing at all')
  })

  it('says so when there is nothing yet', () => {
    mount(<Inspector placeholder="Nothing to inspect yet." sections={[{ name: 'Outputs' }]} />)
    expect(text()).toContain('Nothing to inspect yet.')
    expect(count('inspector-section')).toBe(0)
  })

  it('draws what a run produced through Parts', () => {
    // One panel, whatever the run was: a chat turn's steps and artifacts, a
    // coding run's files and console, a research run's sources — all of them
    // are already `MessagePart`s, so none of them needs a second panel.
    mount(
      <Inspector
        sections={[
          {
            name: 'Produced',
            parts: [
              { type: 'toolCall', name: 'search', args: { q: 'pricing' } },
              { type: 'file', name: 'pricing.tsx', size: 2048 },
              {
                type: 'citation',
                sources: [{ id: 's1', title: 'Docs', href: 'https://hanzo.ai' }],
              },
            ],
          },
        ]}
      />,
    )
    expect(count('step')).toBe(1)
    expect(count('file')).toBe(1)
    expect(text()).toContain('pricing.tsx')
    expect(text()).toContain('Docs')
  })

  it('takes a folded turn with no glue in between', () => {
    // The wiring a surface actually writes: fold the stream, hand the pieces
    // over. If this needs a translation step, the fold is the wrong shape.
    const turn: Frame[] = [
      { type: 'message_start' },
      { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 't1', name: 'report' } },
      {
        type: 'content_block_delta',
        index: 0,
        delta: {
          type: 'input_json_delta',
          partial_json: '{"summary":"Drew the page.","inputs":{"brief":"pricing"},"outputs":{"page":"/pricing"}}',
        },
      },
      { type: 'content_block_stop', index: 0 },
      { type: 'content_block_start', index: 1, content_block: { type: 'tool_use', id: 't2', name: 'show' } },
      {
        type: 'content_block_delta',
        index: 1,
        delta: {
          type: 'input_json_delta',
          partial_json: '{"title":"Pricing","kind":"view","markup":"<b>Pricing</b>"}',
        },
      },
      { type: 'content_block_stop', index: 1 },
      { type: 'message_stop' },
    ]
    const s = turn.reduce(stage, EMPTY)

    mount(
      <Inspector
        summary={s.report?.summary}
        sections={[
          { name: 'Inputs', facts: s.report?.inputs },
          { name: 'Outputs', facts: s.report?.outputs },
          { name: 'Produced', parts: made(s) },
        ]}
      />,
    )

    expect(text()).toContain('Drew the page.')
    expect(text()).toContain('brief')
    expect(text()).toContain('/pricing')
    expect(count('inspector-section')).toBe(3)
    expect(host.querySelector('iframe')?.getAttribute('srcdoc')).toBe('<b>Pricing</b>')
  })
})
