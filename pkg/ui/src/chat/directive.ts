/**
 * The control channel: three tools the model calls to drive the interface.
 *
 * A model already knows how to call a tool, so generative UI needs no second
 * protocol beside tool use. `TOOLS` are ordinary Anthropic tools a caller hands
 * to `messages.stream`; the client executes them by DRAWING rather than by
 * computing, and answers each with a `tool_result` exactly as it would any
 * other. That is the whole design — no new wire, no parallel channel, nothing
 * for a model to learn.
 *
 *     feel({ emotion })                    the persona's mood
 *     show({ title, kind, markup })        a generated interface, rendered
 *     report({ summary, inputs, outputs }) the run, in the side panel
 *
 * ONE WORD EACH, and no dots. A tool name is `[a-zA-Z0-9_-]` — `persona.set`
 * is rejected by the API before the model ever sees it — so a namespace has to
 * be spelled some other way or not at all. Not at all: three verbs the model
 * reads without a legend beat three compounds that only look organised.
 *
 * `stage` is the fold from the stream to what is on screen. It takes the raw
 * `content_block_*` events, so the persona moves even in a turn that calls
 * nothing — thinking while the model thinks, speaking on the first word — and a
 * `feel` directive overrides that reading until the model changes its mind.
 * One fold, one state, three components read it.
 *
 * Nothing here imports `@hanzo/ai`. `Frame` is structural and open, the way
 * `words`'s `Part` is open: it reads the wire, and the wire is not ours to
 * close. An `AnthropicStreamEvent` satisfies it with no dependency in either
 * direction, and `directive.test.ts` pins that assignability both ways.
 */
import type { ArtifactKind } from '../agents/Pane'
import type { MessagePart } from './Parts'
import type { Emotion } from './Persona'

/* ---------------------------------------------------------------- vocabulary */

/** What the model asked the interface to do. `name` is the tool it called, so
 *  the discriminant and the wire are the same word. */
export type Directive =
  /** Move the persona. Holds until the model says otherwise. */
  | { name: 'feel'; id: string; emotion: Emotion }
  /** Draw an interface the model wrote. `markup` is HTML, rendered inert. */
  | { name: 'show'; id: string; title: string; kind: ArtifactKind; markup: string }
  /** Fill the side panel with the run's own account of itself. */
  | { name: 'report'; id: string; summary: string; inputs?: Facts; outputs?: Facts }

/** Name → value. What a run was given, and what it produced. */
export type Facts = Record<string, unknown>

/** A `report` directive's payload, without the envelope. */
export interface Report {
  summary: string
  inputs?: Facts
  outputs?: Facts
}

/**
 * A tool definition, structurally.
 *
 * A `type` alias and not an `interface` on purpose: only a type literal gets an
 * implicit index signature, and without one this is NOT assignable to
 * `AnthropicTool` (which carries `[key: string]: unknown`). An interface here
 * would typecheck in this package and fail at every call site.
 */
export type Tool = {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

/** The moods a persona can be asked for — `Emotion`, as a schema enum. */
const MOODS: Emotion[] = [
  'idle',
  'listening',
  'thinking',
  'speaking',
  'happy',
  'sad',
  'surprised',
]

const KINDS: ArtifactKind[] = ['canvas', 'code', 'view']

/**
 * The three tools, ready to pass to `messages.stream`.
 *
 * Descriptions say WHEN to call, not just what the tool is: a model reaches for
 * a tool on its trigger condition, and a description that only names the tool
 * is the common way to get a tool that never fires.
 */
export const TOOLS: Tool[] = [
  {
    name: 'feel',
    description:
      'Set the mood of the on-screen persona. Call it when what you are doing changes — before a long piece of work, when you reach an answer, when something goes wrong. The mood holds until you change it, so call it again rather than leaving a stale one.',
    input_schema: {
      type: 'object',
      properties: {
        emotion: { type: 'string', enum: MOODS, description: 'The mood to hold.' },
      },
      required: ['emotion'],
    },
  },
  {
    name: 'show',
    description:
      'Render an interface inline for the person to look at. Call it whenever a layout, a screen, a chart or a mockup would answer better than prose. `markup` is a self-contained HTML document including its own <style>; it is displayed with scripting disabled, so write markup and CSS, never script.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'A short name for the thing.' },
        kind: {
          type: 'string',
          enum: KINDS,
          description: 'view for a rendered interface, canvas for a document, code for source.',
        },
        markup: { type: 'string', description: 'A self-contained HTML document.' },
      },
      required: ['title', 'kind', 'markup'],
    },
  },
  {
    name: 'report',
    description:
      'Fill the side panel with an account of this run. Call it once you know what the run did: a one-paragraph summary, what you were given, and what you produced. The panel is what the person reads to check your work, so name real values rather than describing them.',
    input_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'One paragraph: what happened.' },
        inputs: { type: 'object', description: 'Name to value, what the run was given.' },
        outputs: { type: 'object', description: 'Name to value, what the run produced.' },
      },
      required: ['summary'],
    },
  },
]

/* -------------------------------------------------------------------- reading */

/** One field off an untrusted object. The wire is a boundary; nothing below
 *  trusts a shape it has not checked. */
const str = (value: unknown, key: string): string | undefined => {
  const x = (value as Record<string, unknown> | null | undefined)?.[key]
  return typeof x === 'string' ? x : undefined
}

const facts = (value: unknown, key: string): Facts | undefined => {
  const x = (value as Record<string, unknown> | null | undefined)?.[key]
  return x != null && typeof x === 'object' && !Array.isArray(x) ? (x as Facts) : undefined
}

const one = <T extends string>(value: unknown, key: string, set: T[]): T | undefined => {
  const x = str(value, key)
  return set.includes(x as T) ? (x as T) : undefined
}

/**
 * A tool call, narrowed to a directive — or `undefined` for anything else.
 *
 * `undefined` is not a failure. Most tool calls in a turn are the caller's own
 * tools, and those belong in the transcript as steps; this answers only "is
 * this one of ours, and is it well-formed". A directive missing a required
 * field is not ours either — a half-read `show` would draw an empty frame.
 */
export function read(name: string, id: string, input: unknown): Directive | undefined {
  switch (name) {
    case 'feel': {
      const emotion = one(input, 'emotion', MOODS)
      return emotion ? { name, id, emotion } : undefined
    }
    case 'show': {
      const title = str(input, 'title')
      const markup = str(input, 'markup')
      const kind = one(input, 'kind', KINDS) ?? 'view'
      return title && markup ? { name, id, title, kind, markup } : undefined
    }
    case 'report': {
      const summary = str(input, 'summary')
      return summary
        ? { name, id, summary, inputs: facts(input, 'inputs'), outputs: facts(input, 'outputs') }
        : undefined
    }
    default:
      return undefined
  }
}

/** What a directive is answered with. Drawing IS the execution, so the result
 *  is a confirmation — but it has to be sent, or the turn never continues. */
export const answer = (directive: Directive) => ({
  type: 'tool_result' as const,
  tool_use_id: directive.id,
  content: SAID[directive.name],
})

const SAID = {
  feel: 'The persona is showing it.',
  show: 'Rendered for the person to see.',
  report: 'The panel is showing it.',
} satisfies Record<Directive['name'], string>

/* --------------------------------------------------------------------- stream */

/**
 * One event off the model's stream.
 *
 * Open, and `type` is the only field it insists on — which is also what keeps
 * every `@hanzo/ai` event assignable to it. `content_block` and `delta` are
 * `unknown` deliberately: their shape varies per block and per provider, a
 * narrower spelling makes half the union unassignable, and this is a boundary
 * where reading defensively is the correct habit anyway.
 */
export interface Frame {
  type: string
  /** Which content block, on the three events that name one. */
  index?: number
  /** `content_block_start`'s block. */
  content_block?: unknown
  /** `content_block_delta`'s delta. */
  delta?: unknown
}

/** A tool call still arriving. Its `input` is JSON split across deltas and is
 *  not parseable until the block stops. */
interface Call {
  id: string
  name: string
  json: string
}

/** What the model has made of the interface. */
export interface Stage {
  /** What the persona is doing — the mood to draw. */
  emotion: Emotion
  /** The mood a `feel` directive fixed. While set, the stream does not move the
   *  persona; the model's word outranks the reading. */
  held?: Emotion
  /** The turn, as parts. Directives that draw produce one; the rest do not. */
  parts: readonly MessagePart[]
  /** The side panel's content, once `report` has landed. */
  report?: Report
  /** Every directive this turn, in order. `ran.map(answer)` is the reply. */
  ran: readonly Directive[]
  /** Tool blocks still arriving, by index. */
  open: Readonly<Record<number, Call>>
}

/** A stage with nothing on it. The starting value for a turn. */
export const EMPTY: Stage = { emotion: 'idle', parts: [], ran: [], open: {} }

/** Adjacent prose, kept as one part. `join` does this at render time too, but
 *  a fold that appends per delta would hand it thousands of fragments. */
const add = (parts: readonly MessagePart[], part: MessagePart): MessagePart[] => {
  const last = parts[parts.length - 1]
  if ((part.type === 'text' || part.type === 'reasoning') && last?.type === part.type) {
    return [...parts.slice(0, -1), { type: part.type, text: last.text + part.text }]
  }
  return [...parts, part]
}

/** The mood the stream implies, unless the model has fixed one. */
const move = (prev: Stage, emotion: Emotion): Emotion => prev.held ?? emotion

/** Apply a directive. */
const apply = (prev: Stage, d: Directive): Stage => {
  const ran = [...prev.ran, d]
  switch (d.name) {
    case 'feel':
      return { ...prev, ran, held: d.emotion, emotion: d.emotion }
    case 'show':
      return {
        ...prev,
        ran,
        parts: add(prev.parts, {
          type: 'artifact',
          title: d.title,
          kind: d.kind,
          id: d.id,
          markup: d.markup,
        }),
      }
    case 'report':
      return {
        ...prev,
        ran,
        report: { summary: d.summary, inputs: d.inputs, outputs: d.outputs },
      }
  }
}

/**
 * The stream, folded into what is on screen.
 *
 * Pure, and total over the wire: an event this does not recognise returns the
 * stage unchanged rather than throwing, because a stream carries `ping` and
 * `message_delta` and whatever it gains next.
 */
export function stage(prev: Stage, frame: Frame): Stage {
  switch (frame.type) {
    // A new turn reads fresh. Only the held mood clears — the parts and the
    // report belong to whoever is keeping them.
    case 'message_start':
      return { ...prev, held: undefined, emotion: 'thinking' }

    case 'content_block_start': {
      const kind = str(frame.content_block, 'type')
      if (kind === 'tool_use') {
        const id = str(frame.content_block, 'id') ?? ''
        const name = str(frame.content_block, 'name') ?? ''
        return {
          ...prev,
          emotion: move(prev, 'thinking'),
          open: { ...prev.open, [frame.index ?? 0]: { id, name, json: '' } },
        }
      }
      if (kind === 'thinking') return { ...prev, emotion: move(prev, 'thinking') }
      if (kind === 'text') return { ...prev, emotion: move(prev, 'speaking') }
      return prev
    }

    case 'content_block_delta': {
      const kind = str(frame.delta, 'type')
      if (kind === 'text_delta') {
        const text = str(frame.delta, 'text') ?? ''
        return {
          ...prev,
          emotion: move(prev, 'speaking'),
          parts: add(prev.parts, { type: 'text', text }),
        }
      }
      if (kind === 'thinking_delta') {
        const text = str(frame.delta, 'thinking') ?? ''
        return {
          ...prev,
          emotion: move(prev, 'thinking'),
          parts: add(prev.parts, { type: 'reasoning', text }),
        }
      }
      if (kind === 'input_json_delta') {
        const at = frame.index ?? 0
        const call = prev.open[at]
        if (!call) return prev
        const json = call.json + (str(frame.delta, 'partial_json') ?? '')
        return { ...prev, open: { ...prev.open, [at]: { ...call, json } } }
      }
      return prev
    }

    case 'content_block_stop': {
      const at = frame.index ?? 0
      const call = prev.open[at]
      if (!call) return prev
      const { [at]: _closed, ...open } = prev.open
      const next = { ...prev, open }
      const directive = read(call.name, call.id, parse(call.json))
      if (directive) return apply(next, directive)
      // Somebody else's tool. It belongs in the transcript as a step.
      return {
        ...next,
        parts: add(next.parts, {
          type: 'toolCall',
          name: call.name,
          id: call.id,
          args: parse(call.json),
        }),
      }
    }

    // The turn is over. The mood the model chose survives it — a turn that
    // ended happy rests happy; one that said nothing rests idle.
    case 'message_stop':
      return { ...prev, emotion: prev.held ?? 'idle' }

    case 'error':
      return { ...prev, emotion: move(prev, 'sad') }

    default:
      return prev
  }
}

/** A tool's arguments. An empty block sends no deltas at all, and a truncated
 *  turn leaves a fragment; neither should take the page down. */
const parse = (json: string): unknown => {
  if (!json) return undefined
  try {
    return JSON.parse(json)
  } catch {
    return undefined
  }
}

/**
 * What the turn produced, for the panel.
 *
 * Prose is the answer and belongs in the thread; everything else is evidence —
 * what ran, what came back, what was made — and that is what the panel is for.
 */
export const made = (from: Stage): MessagePart[] =>
  from.parts.filter((part) => part.type !== 'text' && part.type !== 'reasoning')
