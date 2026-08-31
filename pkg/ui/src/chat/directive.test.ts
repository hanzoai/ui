/**
 * The control channel, and the four ways it can break without anyone noticing.
 *
 * A tool the API REJECTS never reaches the model, and the rejection names the
 * request rather than the name — so the legal-name check is first here, and it
 * is a regex rather than a spelling opinion.
 *
 * A `Frame` the wire cannot satisfy is a compile error at every CALL SITE and
 * none here, which is why this file re-declares `@hanzo/ai`'s event and tool
 * types verbatim and assigns across them. Those assignments are the test; they
 * are checked by `tsc`, not by vitest, and they are the whole reason this
 * package can read that package's stream while depending on nothing.
 *
 * A persona stuck on one mood looks deliberate. So the emotional loop is
 * asserted as a SEQUENCE — thinking, speaking, rest — and separately proven to
 * yield to a `feel` directive and to survive the end of the turn.
 *
 * And a tool call whose JSON arrives in fragments parses to `undefined` if it
 * is parsed per delta; the model then said something and nothing happened.
 */
import { describe, expect, it } from 'vitest'

import { EMPTY, TOOLS, answer, made, read, stage, type Frame, type Stage, type Tool } from './directive'

/* ------------------------------------------------------------ the wire, typed */

/** `@hanzo/ai`'s `AnthropicTool`, restated. If `Tool` stops satisfying it, this
 *  file goes red instead of every caller. */
interface AnthropicTool {
  name: string
  description?: string
  input_schema: {
    type: 'object'
    properties?: Record<string, unknown>
    required?: string[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

/** `@hanzo/ai`'s stream event union, restated — the members `stage` reads, plus
 *  the two it must tolerate. */
type AnthropicStreamEvent =
  | { type: 'message_start'; message: { id: string; content: unknown[] } }
  | {
      type: 'content_block_start'
      index: number
      content_block:
        | { type: 'text'; text: string }
        | { type: 'thinking'; thinking: string; signature?: string }
        | { type: 'tool_use'; id: string; name: string; input: unknown }
    }
  | {
      type: 'content_block_delta'
      index: number
      delta:
        | { type: 'text_delta'; text: string }
        | { type: 'thinking_delta'; thinking: string }
        | { type: 'input_json_delta'; partial_json: string }
        | { type: 'signature_delta'; signature: string }
    }
  | { type: 'content_block_stop'; index: number }
  | {
      type: 'message_delta'
      delta: { stop_reason?: string | null; stop_sequence?: string | null }
      usage?: { output_tokens: number }
    }
  | { type: 'message_stop' }
  | { type: 'ping' }

describe('the wire', () => {
  it('gives the model tools the API will accept', () => {
    // `[a-zA-Z0-9_-]{1,64}`. A dotted name — `persona.set`, the obvious
    // spelling — is refused by the API before the model sees the request, and
    // nothing downstream of that failure mentions the tool.
    for (const tool of TOOLS) {
      expect(tool.name).toMatch(/^[a-zA-Z0-9_-]{1,64}$/)
      expect(tool.description.length).toBeGreaterThan(40)
      expect(tool.input_schema.required?.length).toBeGreaterThan(0)
    }
    expect(TOOLS.map((t) => t.name)).toEqual(['feel', 'show', 'report'])
  })

  it('is passable to messages.stream with no conversion', () => {
    // Structural, and load-bearing: `Tool` is a type ALIAS so it carries an
    // implicit index signature. Written as an `interface` it compiles here and
    // fails on this line, which is the failure this assignment exists to catch.
    const tools: AnthropicTool[] = TOOLS
    expect(tools).toHaveLength(3)
    const back: Tool[] = TOOLS
    expect(back[0]?.name).toBe('feel')
  })

  it('takes every event the stream emits', () => {
    // Every member, including the two `stage` ignores. A union that is only
    // PARTLY assignable fails at the call site's `for await`, not here.
    const events: AnthropicStreamEvent[] = [
      { type: 'message_start', message: { id: 'msg_1', content: [] } },
      { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'hi' } },
      { type: 'content_block_stop', index: 0 },
      { type: 'message_delta', delta: { stop_reason: 'end_turn' } },
      { type: 'ping' },
      { type: 'message_stop' },
    ]
    const frames: Frame[] = events
    expect(frames.reduce(stage, EMPTY).emotion).toBe('idle')
  })
})

/* ------------------------------------------------------------------- reading */

describe('read', () => {
  it('narrows each directive', () => {
    expect(read('feel', 'a', { emotion: 'happy' })).toEqual({
      name: 'feel',
      id: 'a',
      emotion: 'happy',
    })
    expect(read('show', 'b', { title: 'T', kind: 'view', markup: '<p>x</p>' })).toEqual({
      name: 'show',
      id: 'b',
      title: 'T',
      kind: 'view',
      markup: '<p>x</p>',
    })
    expect(read('report', 'c', { summary: 'did a thing', inputs: { q: 1 } })).toEqual({
      name: 'report',
      id: 'c',
      summary: 'did a thing',
      inputs: { q: 1 },
      outputs: undefined,
    })
  })

  it('refuses a half-read directive rather than drawing an empty one', () => {
    // Each of these is a model that called the tool and got the payload wrong.
    // Answering `undefined` sends it to the transcript as a step, where it is
    // visible, instead of onto the canvas as a blank.
    expect(read('feel', 'a', { emotion: 'smug' })).toBeUndefined()
    expect(read('feel', 'a', {})).toBeUndefined()
    expect(read('show', 'b', { title: 'T' })).toBeUndefined()
    expect(read('show', 'b', { markup: '<p/>' })).toBeUndefined()
    expect(read('report', 'c', { inputs: {} })).toBeUndefined()
    expect(read('feel', 'a', undefined)).toBeUndefined()
    expect(read('feel', 'a', 'not an object')).toBeUndefined()
  })

  it('defaults a show with no kind rather than dropping it', () => {
    // `kind` picks an icon. Losing a rendered interface over a missing enum
    // would be the schema punishing the person looking at the screen.
    expect(read('show', 'b', { title: 'T', markup: '<p/>' })).toMatchObject({ kind: 'view' })
  })

  it('leaves somebody else’s tool alone', () => {
    expect(read('search', 'x', { q: 'weather' })).toBeUndefined()
  })
})

describe('answer', () => {
  it('closes the round trip on the block that opened it', () => {
    const reply = answer({ name: 'feel', id: 'toolu_7', emotion: 'happy' })
    expect(reply).toEqual({
      type: 'tool_result',
      tool_use_id: 'toolu_7',
      content: expect.any(String),
    })
  })
})

/* --------------------------------------------------------------------- fold */

const run = (frames: Frame[], from: Stage = EMPTY): Stage => frames.reduce(stage, from)

const block = (index: number, content_block: unknown): Frame => ({
  type: 'content_block_start',
  index,
  content_block,
})

const json = (index: number, partial_json: string): Frame => ({
  type: 'content_block_delta',
  index,
  delta: { type: 'input_json_delta', partial_json },
})

const stop = (index: number): Frame => ({ type: 'content_block_stop', index })

describe('the emotional loop', () => {
  it('moves with the stream even when the model calls nothing', () => {
    // The whole point: a turn with no directives still animates, so a persona
    // is alive by default rather than only when the model remembers it.
    const moods: string[] = []
    const frames: Frame[] = [
      { type: 'message_start' },
      block(0, { type: 'thinking', thinking: '' }),
      { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: 'hm' } },
      stop(0),
      block(1, { type: 'text', text: '' }),
      { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: 'Hello' } },
      stop(1),
      { type: 'message_stop' },
    ]
    frames.reduce((s, f) => {
      const next = stage(s, f)
      moods.push(next.emotion)
      return next
    }, EMPTY)

    expect(moods[0]).toBe('thinking')
    expect(moods[1]).toBe('thinking')
    expect(moods[4]).toBe('speaking')
    expect(moods[moods.length - 1]).toBe('idle')
  })

  it('yields to the model, and holds what it was told', () => {
    const told = run([
      { type: 'message_start' },
      block(0, { type: 'tool_use', id: 't1', name: 'feel', input: {} }),
      json(0, '{"emotion":"happy"}'),
      stop(0),
    ])
    expect(told.emotion).toBe('happy')

    // Text would ordinarily read as `speaking`. It does not overrule the model.
    const after = run(
      [
        block(1, { type: 'text', text: '' }),
        { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: 'hi' } },
      ],
      told,
    )
    expect(after.emotion).toBe('happy')

    // And the mood survives the end of the turn: a turn that ended happy rests
    // happy. Resetting to idle here would flatten every deliberate ending.
    expect(run([{ type: 'message_stop' }], after).emotion).toBe('happy')
  })

  it('lets the next turn read fresh', () => {
    const held = run([
      block(0, { type: 'tool_use', id: 't1', name: 'feel', input: {} }),
      json(0, '{"emotion":"sad"}'),
      stop(0),
    ])
    expect(held.held).toBe('sad')
    const fresh = stage(held, { type: 'message_start' })
    expect(fresh.held).toBeUndefined()
    expect(fresh.emotion).toBe('thinking')
  })

  it('reads an error as an error', () => {
    expect(run([{ type: 'error' }]).emotion).toBe('sad')
  })
})

describe('the fold', () => {
  it('parses a tool input once, not per delta', () => {
    // Each fragment is invalid JSON on its own. Parsing per delta yields
    // `undefined`, the directive never forms, and the turn silently does
    // nothing — the failure this concatenation exists to prevent.
    const s = run([
      block(0, { type: 'tool_use', id: 't1', name: 'show', input: {} }),
      json(0, '{"title":"Pricing",'),
      json(0, '"kind":"view",'),
      json(0, '"markup":"<h1>Pricing</h1>"}'),
      stop(0),
    ])
    expect(s.parts).toEqual([
      { type: 'artifact', title: 'Pricing', kind: 'view', id: 't1', markup: '<h1>Pricing</h1>' },
    ])
    expect(s.ran).toHaveLength(1)
  })

  it('keeps prose in one part rather than one per token', () => {
    const s = run([
      block(0, { type: 'text', text: '' }),
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hel' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'lo ' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'there' } },
    ])
    expect(s.parts).toEqual([{ type: 'text', text: 'Hello there' }])
  })

  it('fills the panel from a report, and draws nothing in the thread for it', () => {
    const s = run([
      block(0, { type: 'tool_use', id: 't1', name: 'report', input: {} }),
      json(0, '{"summary":"Priced three tiers.","inputs":{"tiers":3},"outputs":{"page":"/pricing"}}'),
      stop(0),
    ])
    expect(s.report).toEqual({
      summary: 'Priced three tiers.',
      inputs: { tiers: 3 },
      outputs: { page: '/pricing' },
    })
    expect(s.parts).toEqual([])
  })

  it('sends somebody else’s tool to the transcript as a step', () => {
    const s = run([
      block(0, { type: 'tool_use', id: 't9', name: 'search', input: {} }),
      json(0, '{"q":"weather"}'),
      stop(0),
    ])
    expect(s.parts).toEqual([
      { type: 'toolCall', name: 'search', id: 't9', args: { q: 'weather' } },
    ])
    expect(s.ran).toEqual([])
  })

  it('survives a truncated turn', () => {
    // A stream cut mid-block leaves a JSON fragment. It must not throw.
    const s = run([
      block(0, { type: 'tool_use', id: 't1', name: 'show', input: {} }),
      json(0, '{"title":"Half'),
      stop(0),
    ])
    expect(s.parts).toEqual([{ type: 'toolCall', name: 'show', id: 't1', args: undefined }])
  })

  it('ignores an event it has never heard of', () => {
    const s = run([{ type: 'ping' }, { type: 'message_delta' }, { type: 'nonsense' }])
    expect(s).toEqual(EMPTY)
  })

  it('never mutates the stage it was given', () => {
    const before = run([
      block(0, { type: 'text', text: '' }),
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'a' } },
    ])
    const snapshot = JSON.stringify(before)
    stage(before, { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'b' } })
    expect(JSON.stringify(before)).toBe(snapshot)
    expect(EMPTY.parts).toEqual([])
    expect(EMPTY.ran).toEqual([])
  })
})

describe('made', () => {
  it('gives the panel the evidence and leaves the answer in the thread', () => {
    const s = run([
      block(0, { type: 'text', text: '' }),
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Here it is.' } },
      stop(0),
      block(1, { type: 'tool_use', id: 't1', name: 'show', input: {} }),
      json(1, '{"title":"Card","kind":"view","markup":"<b>hi</b>"}'),
      stop(1),
    ])
    expect(s.parts).toHaveLength(2)
    expect(made(s).map((p) => p.type)).toEqual(['artifact'])
  })
})
