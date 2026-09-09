// @hanzo/observe — framework-agnostic entry. The capture engine, the semantic
// annotator, the privacy gate, and the session-playback stream, with no framework
// or transport dependency. React apps use the './react' entry; other frameworks
// (Svelte, a Tauri webview, plain DOM) build on these primitives directly.
//
//   import { observe } from '@hanzo/observe'
//   const engine = observe((i) => analytics.capture(i.name, { el: i.semantic.label }))
//   engine.stream.subscribe(render)   // live session playback
//   engine.stop()

import { Observer } from './observer'
import type { ObserveConfig } from './types'

export { Observer } from './observer'
export { Stream } from './stream'
export { annotate, accessibleName, componentName, describe, labelFor, roleOf } from './annotate'
export { isPrivate, redactValue, sensitiveKey } from './redact'
export { wireProps } from './wire'
export type {
  Interaction,
  InteractionKind,
  ObserveConfig,
  RedactedValue,
  RedactionPolicy,
  Semantic,
  SemanticNode,
} from './types'

/** observe builds an Observer, starts it, and returns it — the one-liner setup for
 *  non-React hosts. Pass a sink (where interactions go) and any config overrides. */
export function observe(sink: ObserveConfig['sink'], config?: Omit<ObserveConfig, 'sink'>): Observer {
  const engine = new Observer({ sink, ...config })
  engine.start()
  return engine
}
