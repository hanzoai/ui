// The instrumentation hooks. Native has no delegated capture, so a tap or text
// change is captured by wrapping the component's own handler — press() wraps
// onPress, changeText() wraps onChangeText. Both read the client/stream/scope from
// context and go through the shared emit(), producing the same canonical event as
// a web click. useEventStream mirrors the web hook for session playback.

import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Interaction } from '@hanzo/observe'
import { ClientCtx, RedactionCtx, ScopeCtx, StreamCtx } from './context'
import { emit } from './emit'
import { leafNode, redactText } from './semantic'
import type { NativeMeta } from './types'

type MetaArg = NativeMeta | string
const asMeta = (m: MetaArg): NativeMeta => (typeof m === 'string' ? { name: m } : m)

export interface ObserveApi {
  /** Wrap a press/tap handler so the tap is captured, then the handler runs.
   *  `onPress={press('SaveButton', save)}` */
  press(meta: MetaArg, handler?: (event?: unknown) => void): (event?: unknown) => void
  /** Wrap an RN onChangeText handler: captures a REDACTED change (never the typed
   *  text), then calls the handler. `onChangeText={changeText('email', setEmail)}` */
  changeText(meta: MetaArg, handler?: (text: string) => void): (text: string) => void
  /** Emit a custom named product event with a semantic leaf. */
  event(name: string, meta?: MetaArg, props?: Record<string, unknown>): void
  /** Emit a screen view ($pageview) for a named screen. */
  screen(name: string, props?: Record<string, unknown>): void
}

/** useObserve returns the instrumentation helpers, bound to the surrounding
 *  ObserveProvider/ObserveScope context. */
export function useObserve(): ObserveApi {
  const client = useContext(ClientCtx)
  const stream = useContext(StreamCtx)
  const scope = useContext(ScopeCtx)
  const redaction = useContext(RedactionCtx)

  return useMemo<ObserveApi>(
    () => ({
      press(meta, handler) {
        const m = asMeta(meta)
        return (event?: unknown) => {
          emit(client, stream, { kind: 'click', name: '$click', scope, leaf: leafNode(m, 'button'), props: m.props })
          handler?.(event)
        }
      },
      changeText(meta, handler) {
        const m = asMeta(meta)
        return (text: string) => {
          const value = redactText(text, m, redaction)
          emit(client, stream, { kind: 'change', name: '$change', scope, leaf: leafNode(m, 'textbox'), value, props: m.props })
          handler?.(text)
        }
      },
      event(name, meta, props) {
        const m = meta ? asMeta(meta) : {}
        emit(client, stream, {
          kind: 'click',
          name,
          scope,
          leaf: leafNode(m, 'generic'),
          props: { ...m.props, ...props },
        })
      },
      screen(name, props) {
        emit(client, stream, {
          kind: 'nav',
          name: '$pageview',
          scope,
          leaf: leafNode({ name }, 'screen'),
          props: { path: name, ...props },
        })
      },
    }),
    [client, stream, scope, redaction],
  )
}

export interface NativeEventStream {
  events: Interaction[]
  clear: () => void
}

/** useEventStream subscribes to the shared capture stream — a rolling window of
 *  interactions for a session-playback view. */
export function useEventStream(opts: { limit?: number } = {}): NativeEventStream {
  const stream = useContext(StreamCtx)
  const limit = opts.limit ?? 500
  const [events, setEvents] = useState<Interaction[]>([])

  useEffect(() => {
    if (!stream) return
    setEvents(stream.buffer().slice(-limit))
    return stream.subscribe((i) => {
      setEvents((prev) => {
        const next = prev.length >= limit ? prev.slice(prev.length - limit + 1) : prev.slice()
        next.push(i)
        return next
      })
    })
  }, [stream, limit])

  const clear = useCallback(() => {
    stream?.clear()
    setEvents([])
  }, [stream])

  return { events, clear }
}
