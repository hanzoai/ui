'use client'

/**
 * Parts — a streamed turn, drawn by what each piece of it IS.
 *
 * A completion's content is a list of parts, and until now this package had one
 * answer for all of them: `words` flattens the list to prose and DROPS every
 * part that is not text. An image, a tool call, a citation, an artifact — all of
 * it arrived on the wire and none of it reached the screen. Six surfaces wrote
 * six switch statements over the same union to get it back.
 *
 * `MessagePart` is that union, closed, and `Parts` is the dispatcher over it.
 * Closed is the decision: `words`'s `Part` stays OPEN because it reads the wire
 * and must survive a type it has never heard of, while this one is the CANON —
 * the set a surface can exhaustively handle, and the set this package promises
 * to draw. A part whose `type` is outside it still contributes its text, exactly
 * as `words` does, so an unknown part degrades to prose instead of vanishing.
 *
 * Nothing here is new furniture. Every branch dispatches to a piece this package
 * already had: `Code` for a tool's arguments and its output, `Step` for the call
 * itself, `Failure` for an error, `Sources` for citations, `ArtifactCard` for a
 * produced thing. That is the whole reason a typed renderer belongs here rather
 * than in each surface — the parts were already drawn, one per surface, with no
 * agreement about which part got which drawing.
 *
 * MARKDOWN IS STILL NOT HERE. `prose` is where a surface's pipeline enters, and
 * with none supplied the words render plainly. The plugin set is per-surface —
 * nine plugins, one plugin, or a regex under a bundle ceiling that cannot afford
 * a parser — so this package ships no parser and takes the rendered nodes.
 */
import { Image, SizableText, XStack, YStack } from '@hanzo/gui'
import { Paperclip } from '@hanzogui/lucide-icons-2'
import type { ComponentProps, ReactNode } from 'react'

import { ArtifactCard, type ArtifactKind } from '../agents/Pane'
import { ink } from '../backends/gui/ink'
import { slot } from '../backends/gui/slot'
import { Code } from './Code'
import { Failure } from './Failure'
import { Sources, type Source } from './Sources'
import { Step, type Ran } from './Step'
import type { Part } from './words'

/**
 * One piece of a turn — the canonical set.
 *
 * Every member carries `type` and an optional `text`, which is what keeps
 * `MessagePart[]` assignable to `words`'s `Part[]`: the same list answers "what
 * was said" and "what is on screen" with no conversion between them.
 *
 * `toolCall` and `toolResult` are two states of one thing, not two things that
 * arrive together — a streaming turn UPDATES the part in place as the result
 * lands. A surface that appends both instead will see two steps, which is an
 * honest picture of what it appended.
 */
export type MessagePart =
  /** Prose. */
  | { type: 'text'; text: string }
  /** Prose the model wrote while working, shown quieter than the answer. */
  | { type: 'reasoning'; text: string }
  /** A tool the model asked for, and what it asked with. */
  | { type: 'toolCall'; name: string; id?: string; args?: unknown; text?: string }
  /** What the tool answered. `status` says how it went; absent means it landed. */
  | { type: 'toolResult'; name: string; id?: string; status?: Ran; result?: unknown; text?: string }
  | { type: 'image'; url: string; alt?: string; text?: string }
  | { type: 'file'; name: string; url?: string; mime?: string; size?: number; text?: string }
  /** What the answer was drawn from. */
  | { type: 'citation'; sources: Source[]; text?: string }
  /** Something the turn produced and the surface can open. */
  | { type: 'artifact'; title: string; kind: ArtifactKind; id?: string; text?: string }
  /**
   * A resource the model offers as an interface.
   *
   * Named and shown as source, never RUN. Executing a remote document inside the
   * host page is the whole of cross-site scripting, and a component library
   * cannot make that call for its consumers — a surface with a sandbox to run it
   * in renders it itself, which is a decision it takes where its policy lives.
   */
  | { type: 'uiResource'; uri: string; mime?: string; text?: string }
  /** The turn did not arrive. */
  | { type: 'error'; text: string }

/**
 * Adjacent prose, put back together.
 *
 * The wire splits a sentence across parts — and mid-word, which is why `words`
 * joins with no separator — so drawing each text part as its own block would
 * break one paragraph into a dozen and hand a markdown parser fragments that are
 * not markdown. Runs of `text` and runs of `reasoning` each collapse to one;
 * everything else passes through untouched and in order.
 *
 * This is what makes `Parts` a strict improvement on `words` rather than a
 * different-looking one: an all-text turn renders exactly the string `words`
 * would have produced.
 */
export function join(parts: readonly MessagePart[]): MessagePart[] {
  const out: MessagePart[] = []
  for (const part of parts) {
    const last = out[out.length - 1]
    if (
      (part.type === 'text' || part.type === 'reasoning') &&
      last &&
      last.type === part.type
    ) {
      out[out.length - 1] = { type: part.type, text: last.text + part.text }
      continue
    }
    out.push(part)
  }
  return out
}

/**
 * What a tool was asked, or answered, as text.
 *
 * The wire sends JSON, so a caller holding the parsed object should not have to
 * re-serialise it at every call site — that is six copies of two lines. The
 * fallback exists because this takes `unknown` and a value that cannot be
 * serialised must not take the page down with it.
 */
export const show = (value: unknown): string => {
  if (value == null) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

/** A size a person can read. Every surface writes this one; here it is once. */
const weigh = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i += 1
  }
  return `${i === 0 ? n : n.toFixed(1)} ${units[i]}`
}

/** The controls a part can offer. Callbacks-out, as everything here is: the part
 *  is data and knows nothing about what opening it means. */
export interface PartActions {
  /** Render prose. Absent, the words render plainly. */
  prose?: (text: string, part: MessagePart) => ReactNode
  /** Run the turn again — an `error` part's control. Absent, none renders. */
  onRetry?: () => void
  /** Open an `artifact` part. */
  onOpen?: (part: Extract<MessagePart, { type: 'artifact' }>) => void
  /** Open one of a `citation` part's sources. */
  onSource?: (source: Source) => void
}

export interface PieceProps extends PartActions {
  part: MessagePart
}

/**
 * One part.
 *
 * It spreads no residual props and owns no box, which is the one place this
 * package's house rule does not apply: a piece IS whichever component its type
 * names, and giving it a wrapper of its own would put an anonymous div between
 * every part and the column that spaces them. `Parts` is the box.
 *
 * Named `Piece` and not `Part` because `Part` is already the name of `words`'s
 * open wire type on this barrel, and a module cannot export one name as both a
 * type and a value.
 */
export function Piece({ part, prose, onRetry, onOpen, onSource }: PieceProps) {
  switch (part.type) {
    case 'text':
      return <>{prose ? prose(part.text, part) : ink(part.text)}</>

    case 'reasoning':
      // Dimmed rather than recoloured: a surface's markdown paints its own
      // colours, and a token on the container would not reach inside them.
      return (
        <YStack {...slot('reasoning')} opacity={0.72}>
          {prose ? prose(part.text, part) : ink(part.text)}
        </YStack>
      )

    case 'toolCall':
      return (
        <Step name={part.name} status="running" detail={part.id}>
          {part.args == null ? undefined : <Code language="json">{show(part.args)}</Code>}
        </Step>
      )

    case 'toolResult':
      return (
        <Step name={part.name} status={part.status ?? 'done'} detail={part.id}>
          {part.result == null ? undefined : <Code language="json">{show(part.result)}</Code>}
        </Step>
      )

    case 'image':
      return (
        <YStack
          {...slot('image')}
          maxW={420}
          rounded="$4"
          overflow="hidden"
          borderWidth={1}
          borderColor="$borderColor"
        >
          {/* `src`, not react-native's `source`: gui's Image renders a real
              <img> on web and forwards what it does not recognise straight to
              the DOM, so a `source` object arrives as an attribute and the
              element has no url at all. `alt=""` where none was given says
              decorative, which is the honest reading of an unlabelled one. */}
          <Image
            src={part.url}
            alt={part.alt ?? ''}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </YStack>
      )

    case 'file':
      return (
        <XStack
          {...slot('file')}
          items="center"
          gap="$2"
          maxW={420}
          px="$2.5"
          py="$2"
          rounded="$4"
          borderWidth={1}
          borderColor="$borderColor"
          bg="$panel"
        >
          <Paperclip size={13} color="$quiet" />
          <SizableText size="$2" color="$ink" numberOfLines={1} flex={1}>
            {part.name}
          </SizableText>
          {part.size == null ? null : (
            <SizableText size="$1" color="$quiet">
              {weigh(part.size)}
            </SizableText>
          )}
        </XStack>
      )

    case 'citation':
      return <Sources sources={part.sources} onOpen={onSource} />

    case 'artifact':
      return (
        <ArtifactCard
          title={part.title}
          kind={part.kind}
          onOpen={onOpen ? () => onOpen(part) : undefined}
        />
      )

    case 'uiResource':
      return (
        <Step name={part.uri} detail={part.mime}>
          {part.text ? <Code language={part.mime ?? 'text'}>{part.text}</Code> : undefined}
        </Step>
      )

    case 'error':
      return <Failure onRetry={onRetry}>{part.text}</Failure>

    default: {
      // The union is closed and the WIRE is not, which is the one place those
      // two facts have to meet. A part this does not know contributes its text
      // and nothing else — the same answer `words` gives, so nothing a surface
      // sends can go missing without also having been missing before.
      const unknown = part as Part
      return <>{unknown.text ? ink(unknown.text) : null}</>
    }
  }
}

export interface PartsProps
  extends PartActions,
    Omit<ComponentProps<typeof YStack>, 'children'> {
  parts: readonly MessagePart[]
}

/** A turn's parts, in order, spaced. Goes in a `Message`'s children — `Chat`
 *  puts it there for a turn whose content is a list. */
export function Parts({ parts, prose, onRetry, onOpen, onSource, ...props }: PartsProps) {
  return (
    <YStack {...slot('parts')} width="100%" gap="$2" {...props}>
      {join(parts).map((part, i) => (
        <Piece
          key={`${part.type}-${i}`}
          part={part}
          prose={prose}
          onRetry={onRetry}
          onOpen={onOpen}
          onSource={onSource}
        />
      ))}
    </YStack>
  )
}
