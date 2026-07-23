// The Tauri desktop bridge — react-free, imported via '@hanzo/observe-native/tauri'.
//
// A Tauri window renders a webview, so the DOM lives: bindTauri runs the
// @hanzo/observe DOM engine to capture the in-webview UI exactly like the web, AND
// forwards Tauri's native window/app events. Both arrive as canonical @hanzo/event
// events at the ONE front door. Calling it outside a Tauri runtime is safe — the
// native bridge simply no-ops (the DOM capture still runs in any webview).

import { observe as domEngine, wireProps } from '@hanzo/observe'
import type { Interaction, Observer, RedactionPolicy } from '@hanzo/observe'
import type { Analytics } from '@hanzo/event'

export interface TauriOptions {
  /** Privacy policy for the in-webview DOM capture. */
  redaction?: RedactionPolicy
  /** Run in-webview DOM capture (default true). */
  dom?: boolean
  /** Tauri event names forwarded as `$app` events. Defaults to the window/app set. */
  events?: string[]
}

export interface TauriBridge {
  /** The in-webview DOM capture engine, if started. */
  observer: Observer | null
  /** Stop DOM capture and remove the native listeners. */
  stop(): void
}

const DEFAULT_EVENTS = [
  'tauri://focus',
  'tauri://blur',
  'tauri://resize',
  'tauri://move',
  'tauri://close-requested',
  'tauri://window-created',
  'tauri://menu',
]

export function bindTauri(client: Analytics, options: TauriOptions = {}): TauriBridge {
  let observer: Observer | null = null
  if (options.dom !== false && typeof document !== 'undefined') {
    observer = domEngine(
      (i: Interaction) => {
        try {
          if (i.kind === 'nav') {
            client.pageview(typeof i.props?.path === 'string' ? (i.props.path as string) : undefined)
          } else {
            client.capture(i.name, wireProps(i))
          }
        } catch {
          /* fail-soft */
        }
      },
      { redaction: options.redaction },
    )
  }

  const unlisten: Array<() => void> = []
  let stopped = false
  void bridgeNative(client, options.events ?? DEFAULT_EVENTS, unlisten, () => stopped)

  return {
    observer,
    stop() {
      stopped = true
      observer?.stop()
      for (const off of unlisten.splice(0)) {
        try {
          off()
        } catch {
          /* no-op */
        }
      }
    },
  }
}

/** Listen to Tauri native events via a guarded, runtime-only import — no build-time
 *  dependency on @tauri-apps/api, and a graceful no-op when not in Tauri. */
async function bridgeNative(
  client: Analytics,
  events: string[],
  unlisten: Array<() => void>,
  isStopped: () => boolean,
): Promise<void> {
  try {
    const spec = '@tauri-apps/api/event'
    const mod = (await import(/* @vite-ignore */ spec).catch(() => null)) as {
      listen?: (event: string, handler: (e: unknown) => void) => Promise<() => void>
    } | null
    if (!mod?.listen) return
    for (const name of events) {
      const off = await mod.listen(name, () => {
        try {
          client.capture('$app', { $event: name })
        } catch {
          /* fail-soft */
        }
      })
      if (isStopped()) {
        try {
          off()
        } catch {
          /* no-op */
        }
        return
      }
      if (typeof off === 'function') unlisten.push(off)
    }
  } catch {
    /* not a Tauri runtime */
  }
}
