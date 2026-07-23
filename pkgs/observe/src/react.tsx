// React bindings for @hanzo/observe — the default-on capture experience.
//
//   'use client'
//   import { AnalyticsProvider } from '@hanzo/event/react'
//   import { ObserveProvider, useEventStream } from '@hanzo/observe/react'
//
//   <AnalyticsProvider config={{ product: 'console' }}>
//     <ObserveProvider>          {/* captures every interaction, semantically */}
//       <App />
//     </ObserveProvider>
//   </AnalyticsProvider>
//
// ObserveProvider reads the @hanzo/event client from context (or takes an explicit
// one), installs the engine, and streams every captured Interaction through it to
// the ONE front door. useEventStream gives a live view of the same stream for a
// session-playback UI. Nothing here throws into the app.

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAnalytics } from '@hanzo/event/react'
import type { Analytics } from '@hanzo/event'
import { Observer } from './observer'
import { wireProps } from './wire'
import type { Interaction, RedactionPolicy } from './types'

const ObserveCtx = createContext<Observer | null>(null)

export interface ObserveProviderProps {
  /** The @hanzo/event client to emit through. Defaults to the one from
   *  AnalyticsProvider (via useAnalytics). */
  client?: Analytics
  /** Privacy policy passed to the engine (input masking, private attribute, …). */
  redaction?: RedactionPolicy
  /** Turn capture off (e.g. opt-out / DNT). Default on. */
  enabled?: boolean
  /** Capture SPA navigations as $pageview (default true). */
  nav?: boolean
  /** Selector watched for visibility as $view (default "[data-hz-view]"). */
  viewSelector?: string
  /** Ring-buffer size of the playback stream (default 500). */
  bufferSize?: number
  children: ReactNode
}

/** ObserveProvider installs the capture engine for its subtree and wires it to the
 *  @hanzo/event client. Default-on: mounting it is the whole setup. */
export function ObserveProvider(props: ObserveProviderProps): ReactNode {
  const { client, redaction, enabled = true, nav = true, viewSelector, bufferSize, children } = props
  const ctxClient = useAnalytics()
  const clientRef = useRef<Analytics>(client ?? ctxClient)
  clientRef.current = client ?? ctxClient
  const [observer, setObserver] = useState<Observer | null>(null)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    const sink = (i: Interaction) => {
      try {
        const c = clientRef.current
        if (i.kind === 'nav') {
          c.pageview(typeof i.props?.path === 'string' ? (i.props.path as string) : undefined)
          return
        }
        c.capture(i.name, wireProps(i))
      } catch {
        /* never surface a telemetry error into render */
      }
    }
    const engine = new Observer({ sink, redaction, enabled: true, nav, viewSelector, bufferSize })
    engine.start()
    setObserver(engine)
    return () => {
      engine.stop()
      setObserver(null)
    }
    // Config is read once at mount; changing it remounts the provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, nav, viewSelector, bufferSize])

  return createElement(ObserveCtx.Provider, { value: observer }, children)
}

/** useObserver returns the engine (or null outside a provider) — reach for its
 *  `.stream` to build custom playback/inspection tools. */
export function useObserver(): Observer | null {
  return useContext(ObserveCtx)
}

export interface EventStream {
  /** The retained, live-updating interaction history (oldest→newest). */
  events: Interaction[]
  /** Drop the retained history. */
  clear: () => void
}

/** useEventStream subscribes to the live capture stream and returns a rolling
 *  window of interactions — the data behind a session-playback timeline. */
export function useEventStream(opts: { limit?: number } = {}): EventStream {
  const observer = useContext(ObserveCtx)
  const limit = opts.limit ?? 500
  const [events, setEvents] = useState<Interaction[]>([])

  useEffect(() => {
    if (!observer) return
    setEvents(observer.stream.buffer().slice(-limit))
    const off = observer.stream.subscribe((i) => {
      setEvents((prev) => {
        const next = prev.length >= limit ? prev.slice(prev.length - limit + 1) : prev.slice()
        next.push(i)
        return next
      })
    })
    return off
  }, [observer, limit])

  const clear = useCallback(() => {
    observer?.stream.clear()
    setEvents([])
  }, [observer])

  return { events, clear }
}
