'use client'

/**
 * Chat — the thread and its composer, as one component.
 *
 * `Thread`, `Message` and `Composer` are the parts, and every surface that has
 * ever shown a conversation has written the same twenty lines to put them
 * together: map the turns, hold the draft, clear it on send, pass `busy`. Six
 * surfaces, six copies, and they drifted — which is what this is.
 *
 * It takes the thread and does not own it. That distinction is the whole reason
 * the previous attempt could not be adopted: a widget holding its own `useChat`
 * gives a surface no way to read the conversation, so a page that wants to know
 * whether anything has been said yet has to run a SECOND `useChat` and ends up
 * with two threads. Here the surface holds it and passes it down, so
 * `@hanzo/ai`'s `useChat` result spreads straight in:
 *
 * ```tsx
 * const chat = useChat({ model: 'enso' })   // @hanzo/ai/react — the state
 * <Chat {...chat} />                        // @hanzo/ui/chat  — the picture
 * ```
 *
 * What it DOES own is the draft, because a half-typed message is a fact about
 * this screen and nothing outside it: it does not survive navigation, no other
 * component reads it, and lifting it would put a keystroke through the surface's
 * state on every letter.
 *
 * No transport, no store, no routing — `@hanzo/ui` stays fetch-free, so nothing
 * here imports `@hanzo/ai`. `messages` is read structurally, which is what lets
 * that hold while the two packages still compose exactly.
 */
import { YStack } from '@hanzo/gui'
import { useCallback, useState, type ReactNode } from 'react'

import { ink } from '../backends/gui/ink'
import { slot } from '../backends/gui/slot'
import { Composer, type ComposerProps } from './Composer'
import { Message, type Role } from './Message'
import { Thread, type ThreadProps } from './Thread'
import { words, type Said } from './words'

/**
 * One turn, as little of it as a picture needs: who spoke, what they said, and
 * an identity to key the list on.
 *
 * Structural on purpose — `@hanzo/ai`'s `ChatMessage` satisfies it without
 * either package importing the other, and a surface with its own richer turn
 * type satisfies it too.
 */
export interface Turn {
  id: string
  role: Role
  /**
   * What was said — a string, or the wire's parts.
   *
   * This was `string` alone, which is the same mistake `Role` made one field
   * over: a completion's content is `string | ContentPart[]` (text beside an
   * image), so a turn holding an attachment could not be handed to this at all.
   * Narrowing the wire in a component fed BY the wire just relocates the
   * mismatch to every caller. `words` is the flattener.
   */
  content?: Said
}

export interface ChatProps extends Omit<ThreadProps, 'children' | 'ref'> {
  /** The conversation, oldest first. */
  messages: Turn[]
  /** A turn is arriving: the last one carries the caret and the composer stops. */
  streaming?: boolean
  /**
   * Send the draft. The composer clears itself once this is called.
   *
   * Named `send`, not `onSend`, and the distinction is the reason this component
   * is usable at all. A leaf control announces an event that happened TO it, so
   * `Composer` takes `onSend`. This is a container handed a whole conversation,
   * and the thing it is handed is a hook result whose actions are verbs —
   * `useChat` answers `{ messages, streaming, send, stop }`. Spelling these
   * `onSend`/`onStop` meant `<Chat {...useChat(…)} />` did not typecheck, which
   * is the ONE call this exists to make work.
   */
  send: (text: string) => void
  /** End the turn in flight. Absent, the composer offers no stop. */
  stop?: () => void
  /**
   * Render a turn's body. Defaults to its text.
   *
   * A surface with a markdown pipeline passes it here — the plugin set is
   * per-surface (nine plugins, one plugin, or a regex under a bundle ceiling
   * that cannot afford a parser), so this package ships none and renders the
   * words plainly until someone says otherwise.
   */
  body?: (turn: Turn) => ReactNode
  /** Shown instead of the thread while nothing has been said. */
  empty?: ReactNode
  /** The composer's own props — placeholder, hint, the send control, the field. */
  composer?: Partial<ComposerProps>
}

export function Chat({
  messages,
  streaming = false,
  send: onSend,
  stop: onStop,
  body,
  empty,
  composer,
  ...thread
}: ChatProps) {
  const [draft, setDraft] = useState('')

  // Clearing here rather than in an effect on `messages` is what keeps a send
  // from racing the answer: the draft is gone the moment it is sent, and a
  // surface that rejects the turn does not get a cleared box back.
  const send = useCallback(() => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    onSend(text)
  }, [draft, onSend])

  const last = messages.length - 1

  // No `minHeight: 0` on the frame: rnw's View base and gui's stack base both
  // set it already, measured on the rendered element — and gui publishes no
  // such prop, so writing it type-errors rather than silently doing nothing,
  // which is the one member of that family this substrate catches for you.
  // The frame is marked, like every other component here. It is not decoration:
  // `data-slot` is what `componentName()` reads for analytics, and it is the only
  // way a browser check can find this frame — a probe that walks N parents up
  // from the composer lands on a `display: contents` wrapper or on the page,
  // and then reports a component that is fine as broken, or one that is broken
  // as fine.
  return (
    <YStack flex={1} width="100%" {...slot('chat')}>
      {messages.length === 0 && empty ? (
        empty
      ) : (
        <Thread flex={1} {...thread}>
          {messages.map((turn, i) => (
            <Message
              key={turn.id}
              role={turn.role}
              busy={streaming && i === last && turn.role === 'assistant'}
            >
              {body ? body(turn) : ink(words(turn.content))}
            </Message>
          ))}
        </Thread>
      )}
      <Composer
        value={draft}
        onChange={setDraft}
        onSend={send}
        busy={streaming}
        {...(onStop ? { onStop } : {})}
        {...composer}
      />
    </YStack>
  )
}
