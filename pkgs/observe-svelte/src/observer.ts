// The bootstrap. Call createObserver once (a root +layout's onMount) with a
// @hanzo/event client; it starts the framework-agnostic engine from @hanzo/observe
// and wires every captured Interaction through the client to the ONE front door.
//
// The running engine is held as a module singleton so the `observe` action and the
// `stream` store can reach it without threading a reference through Svelte context.

import { observe as engine, wireProps } from '@hanzo/observe'
import type { Interaction, Observer, RedactionPolicy } from '@hanzo/observe'
import type { Analytics } from '@hanzo/event'

let current: Observer | null = null

/** The running engine, or null before createObserver / on the server. */
export function activeObserver(): Observer | null {
  return current
}

export interface SvelteObserveOptions {
  /** Privacy policy (input masking, private attribute, …). */
  redaction?: RedactionPolicy
  /** Capture SPA navigations as $pageview (default true). */
  nav?: boolean
  /** Selector watched for visibility as $view (default "[data-hz-view]"). */
  viewSelector?: string
  /** Ring-buffer size of the playback stream (default 500). */
  bufferSize?: number
}

/** createObserver starts capture and emits through `client`. Idempotent: a second
 *  call stops the previous engine first. SSR-safe (the engine no-ops without a
 *  DOM). */
export function createObserver(client: Analytics, options: SvelteObserveOptions = {}): Observer {
  stopObserver()
  const sink = (i: Interaction) => {
    try {
      if (i.kind === 'nav') {
        client.pageview(typeof i.props?.path === 'string' ? (i.props.path as string) : undefined)
        return
      }
      client.capture(i.name, wireProps(i))
    } catch {
      /* telemetry must never break the app */
    }
  }
  current = engine(sink, options)
  return current
}

/** Stop capture and release the singleton. */
export function stopObserver(): void {
  current?.stop()
  current = null
}
