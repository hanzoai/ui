// A Svelte-readable store over the live capture stream — the rolling window of
// interactions behind a session-playback timeline. Used as `$events` in a
// component. Implements Svelte's store contract structurally (subscribe fires once
// synchronously with the current value and returns an unsubscribe), so no `svelte`
// import is needed.

import type { Interaction } from '@hanzo/observe'
import { activeObserver } from './observer'

export interface InteractionStore {
  subscribe(run: (value: Interaction[]) => void): () => void
}

/** stream returns a store of recent interactions, capped at `limit` (default 500). */
export function stream(options: { limit?: number } = {}): InteractionStore {
  const limit = options.limit ?? 500
  return {
    subscribe(run) {
      const observer = activeObserver()
      let values: Interaction[] = observer ? observer.stream.buffer().slice(-limit) : []
      run(values)
      if (!observer) return () => {}
      return observer.stream.subscribe((i) => {
        values = values.length >= limit ? values.slice(values.length - limit + 1) : values.slice()
        values.push(i)
        run(values)
      })
    },
  }
}
