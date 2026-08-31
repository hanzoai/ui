// @vitest-environment jsdom

/**
 * The dispatcher, and the two things about it that can break silently.
 *
 * A part reaching the WRONG piece is loud — you see a code block where an image
 * belongs. A part reaching NO piece is not: it renders nothing, the build is
 * green, and the turn merely looks shorter than it was. That is exactly the
 * failure this component exists to end, so every arm is asserted by the
 * `data-slot` its piece stamps rather than by reading the switch.
 *
 * The other one is the non-regression that lets `Chat` route a list here at all:
 * an all-text turn must render the identical string `words` produced, or every
 * existing consumer's paragraphs quietly break into fragments.
 */
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { Chat, Parts, join, words, type MessagePart } from './index'
// Not on the barrel: it is the rule the two tool arms share, not public API.
import { show } from './Parts'

const html = (node: ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const draw = (parts: MessagePart[]) => html(<Parts parts={parts} />)

describe('join', () => {
  it('welds a run of prose back into one block', () => {
    // The wire splits mid-word, so anything between two text parts lands inside
    // a word — and a markdown parser handed the halves parses neither.
    expect(join([{ type: 'text', text: 'un' }, { type: 'text', text: 'even' }])).toEqual([
      { type: 'text', text: 'uneven' },
    ])
  })

  it('welds reasoning to reasoning and never across the two', () => {
    expect(
      join([
        { type: 'reasoning', text: 'we' },
        { type: 'reasoning', text: 'igh' },
        { type: 'text', text: 'answer' },
      ]),
    ).toEqual([
      { type: 'reasoning', text: 'weigh' },
      { type: 'text', text: 'answer' },
    ])
  })

  it('keeps everything else in the order it arrived', () => {
    const parts: MessagePart[] = [
      { type: 'text', text: 'a' },
      { type: 'image', url: '/x.png' },
      { type: 'text', text: 'b' },
    ]
    // Not merged ACROSS the image: the words are on either side of a picture,
    // and joining them would move the picture to the end.
    expect(join(parts).map((p) => p.type)).toEqual(['text', 'image', 'text'])
  })
})

describe('every part reaches its own piece', () => {
  const arms: [string, MessagePart, string][] = [
    ['text', { type: 'text', text: 'ship it' }, 'ship it'],
    ['reasoning', { type: 'reasoning', text: 'weighing' }, 'data-slot="reasoning"'],
    ['toolCall', { type: 'toolCall', name: 'search', args: { q: 'lux' } }, 'data-slot="step"'],
    ['toolResult', { type: 'toolResult', name: 'search', result: [1] }, 'data-slot="step"'],
    ['image', { type: 'image', url: '/beluga.png', alt: 'a beluga' }, 'data-slot="image"'],
    ['file', { type: 'file', name: 'notes.md', size: 2048 }, 'data-slot="file"'],
    [
      'citation',
      { type: 'citation', sources: [{ id: '1', title: 'A paper', host: 'arxiv.org' }] },
      'data-slot="sources"',
    ],
    [
      'artifact',
      { type: 'artifact', title: 'Chart', kind: 'canvas' },
      'data-slot="artifact-card"',
    ],
    ['uiResource', { type: 'uiResource', uri: 'ui://form', mime: 'text/html' }, 'data-slot="step"'],
    ['error', { type: 'error', text: 'the turn did not arrive' }, 'data-slot="failure"'],
  ]

  for (const [name, part, mark] of arms) {
    it(`draws ${name}`, () => {
      expect(draw([part])).toContain(mark)
    })
  }

  it('draws all ten at once, and none of them swallows a neighbour', () => {
    const markup = draw(arms.map(([, part]) => part))
    for (const [name, , mark] of arms) expect(markup, name).toContain(mark)
  })
})

describe('what each piece is told', () => {
  it('serialises a tool call rather than making the caller do it', () => {
    // Six surfaces would otherwise each write the same two lines, and one of
    // them would forget the indent. Read off `show` rather than the markup: a
    // step is CLOSED by default, so its body is not in a static render at all.
    expect(show({ q: 'lux' })).toBe('{\n  "q": "lux"\n}')
    expect(show('already text')).toBe('already text')
    expect(show(undefined)).toBe('')
    // A value that cannot be serialised must not take the page down with it.
    const loop: Record<string, unknown> = {}
    loop.self = loop
    expect(show(loop)).toBe('[object Object]')
  })

  it('opens a step only when there is something inside it', () => {
    // A disclosure that reveals nothing is a keyboard stop that does not answer.
    expect(draw([{ type: 'toolCall', name: 'search', args: { q: 'lux' } }])).toContain(
      'data-slot="collapsible-trigger"',
    )
    expect(draw([{ type: 'toolCall', name: 'search' }])).not.toContain(
      'data-slot="collapsible-trigger"',
    )
  })

  it('reports a tool call as running and its result as landed', () => {
    expect(draw([{ type: 'toolCall', name: 'search' }])).toContain('data-status="running"')
    expect(draw([{ type: 'toolResult', name: 'search' }])).toContain('data-status="done"')
    expect(draw([{ type: 'toolResult', name: 'search', status: 'error' }])).toContain(
      'data-status="error"',
    )
  })

  it('carries an image url and a size a person can read', () => {
    expect(draw([{ type: 'image', url: '/beluga.png' }])).toContain('/beluga.png')
    expect(draw([{ type: 'file', name: 'notes.md', size: 2048 }])).toContain('2.0 KB')
  })

  it('offers no retry until the surface says what retrying does', () => {
    // A control that does nothing is worse than no control: it reads as a
    // product that ignores you.
    expect(draw([{ type: 'error', text: 'gone' }])).not.toContain('data-slot="failure-retry"')
    expect(
      html(<Parts parts={[{ type: 'error', text: 'gone' }]} onRetry={() => {}} />),
    ).toContain('data-slot="failure-retry"')
  })
})

describe('the open wire meets the closed union', () => {
  it('renders a part it has never heard of as its text', () => {
    // Same answer `words` gives, so routing a list through here cannot lose
    // anything that used to arrive.
    const odd = { type: 'somethingNew', text: 'still readable' } as unknown as MessagePart
    expect(draw([odd])).toContain('still readable')
  })

  it('draws an all-text turn as the identical string words produced', () => {
    const parts: MessagePart[] = [
      { type: 'text', text: 'ship' },
      { type: 'text', text: ' it' },
    ]
    expect(draw(parts)).toContain(words(parts))
    expect(words(parts)).toBe('ship it')
  })
})

describe('Chat routes a list of parts here', () => {
  const send = () => {}

  it('draws the parts of a turn whose content is a list', () => {
    const markup = html(
      <Chat
        send={send}
        messages={[
          {
            id: '1',
            role: 'assistant',
            content: [
              { type: 'text', text: 'here it is' },
              { type: 'image', url: '/beluga.png' },
            ] as MessagePart[],
          },
        ]}
      />,
    )
    expect(markup).toContain('data-slot="parts"')
    expect(markup).toContain('/beluga.png')
    expect(markup).toContain('here it is')
  })

  it('still draws a string turn as prose, with no parts column', () => {
    const markup = html(
      <Chat send={send} messages={[{ id: '1', role: 'user', content: 'ask' }]} />,
    )
    expect(markup).toContain('ask')
    expect(markup).not.toContain('data-slot="parts"')
  })

  it('lets body override the whole thing, as it always did', () => {
    const markup = html(
      <Chat
        send={send}
        body={() => <span data-slot="mine">rendered by the surface</span>}
        messages={[
          { id: '1', role: 'assistant', content: [{ type: 'text', text: 'ignored' }] },
        ]}
      />,
    )
    expect(markup).toContain('data-slot="mine"')
    expect(markup).not.toContain('ignored')
  })
})
