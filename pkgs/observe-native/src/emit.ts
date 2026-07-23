// The one place a native interaction becomes a canonical @hanzo/event event —
// pure, so it is fully testable without a renderer. Build the Interaction, mirror
// it into the playback stream, and emit it through the client using the shared
// wireProps projection (identical wire shape to web/Svelte). Fail-soft throughout.

import { wireProps } from '@hanzo/observe'
import type { Interaction, InteractionKind, RedactedValue, SemanticNode, Stream } from '@hanzo/observe'
import type { Analytics } from '@hanzo/event'
import { buildSemantic } from './semantic'

export interface EmitSpec {
  kind: InteractionKind
  name: string
  scope: SemanticNode[]
  leaf: SemanticNode
  value?: RedactedValue
  props?: Record<string, unknown>
}

export function emit(
  client: Analytics | null,
  stream: Stream<Interaction> | null,
  spec: EmitSpec,
): Interaction {
  const semantic = buildSemantic(spec.scope, spec.leaf)
  const interaction: Interaction = {
    kind: spec.kind,
    name: spec.name,
    at: Date.now(),
    semantic,
    value: spec.value,
    props: spec.props,
  }
  try {
    stream?.emit(interaction)
  } catch {
    /* stream is best-effort */
  }
  try {
    if (client) {
      if (spec.kind === 'nav') {
        client.pageview(typeof spec.props?.path === 'string' ? (spec.props.path as string) : undefined)
      } else {
        client.capture(spec.name, wireProps(interaction))
      }
    }
  } catch {
    /* telemetry must never break the app */
  }
  return interaction
}
