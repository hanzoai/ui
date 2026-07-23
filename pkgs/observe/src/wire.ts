// The one projection from an Interaction to the properties carried on its
// @hanzo/event event. Compact but complete: the leaf's identity, the
// significant-node trail, and the redacted value context. Shared by every binding
// (React, Svelte, native) so the wire shape is identical everywhere.

import type { Interaction } from './types'

export function wireProps(i: Interaction): Record<string, unknown> {
  const t = i.semantic.target
  const props: Record<string, unknown> = { $el: i.semantic.label, $role: t.role }
  if (t.testid) props.$testid = t.testid
  if (t.name) props.$name = t.name
  if (t.component) props.$component = t.component
  if (t.kind) props.$kind = t.kind
  props.$path = i.semantic.path.map((n) => n.component || (n.testid ? `${n.role}[${n.testid}]` : n.role))
  if (i.value) props.$value = i.value
  if (i.props) Object.assign(props, i.props)
  return props
}
