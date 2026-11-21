/**
 * A screen that follows the org's Base: it hears of a change as it is made and reads again.
 * The stream is Base's own realtime (SSE). A signed POST mints a grant, EventSource spends it
 * (it can carry no header), and a signed POST names the collections to hear. Nothing is polled.
 */
import { useEffect, useRef } from 'react'
import { restPost, v1Url } from './host'

/** How long a dropped stream waits before it is opened again, on a new grant. */
const REOPEN_MS = 3000

/** Calls `changed(collection)` when a record of one of `collections` is written; returns the way to stop. */
export function watch(collections: readonly string[], changed: (collection: string) => void): () => void {
  let source: EventSource | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let stopped = false
  // After a stream has been up once, what changed while it was down is unknown.
  let heard = false

  const reopen = () => {
    source?.close()
    source = null
    clearTimeout(timer)
    if (!stopped) timer = setTimeout(open, REOPEN_MS)
  }

  async function open() {
    try {
      const { token } = await restPost<{ token: string }>(v1Url('base/realtime/token'))
      if (stopped) return
      const stream = new EventSource(`${v1Url('base/realtime')}?token=${encodeURIComponent(token)}`)
      source = stream
      stream.addEventListener('CONNECT', (e) => {
        const { clientId } = JSON.parse((e as MessageEvent<string>).data) as { clientId: string }
        restPost(v1Url('base/realtime'), { clientId, subscriptions: collections.map((c) => `${c}/*`) })
          .then(() => {
            if (heard) collections.forEach((c) => changed(c))
            heard = true
          })
          .catch(reopen)
      })
      for (const c of collections) stream.addEventListener(`${c}/*`, () => changed(c))
      stream.onerror = reopen
    } catch {
      reopen()
    }
  }

  void open()
  return () => {
    stopped = true
    clearTimeout(timer)
    source?.close()
  }
}

/** Runs `changed` whenever a record of one of `collections` is written, for as long as the screen is open. */
export function useChanges(collections: readonly string[], changed: () => void): void {
  const latest = useRef(changed)
  latest.current = changed
  const key = collections.join(',')
  useEffect(() => watch(key.split(','), () => latest.current()), [key])
}
