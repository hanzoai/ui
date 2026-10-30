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

/** What a binding hands an interaction to: the @hanzo/event client's surface. */
export interface Client {
  pageview(path?: string): void
  capture(name: string, properties?: Record<string, unknown>, fields?: { url?: string; path?: string }): void
  flush(beacon?: boolean): void
}

/** The one delivery every binding makes: a navigation is a page view; anything
 *  else is a capture, filed under its own page when it has one. A page being
 *  hidden or unloaded is the last moment anything leaves it, so its `$pageleave`
 *  goes at once, by the unload-safe road. */
export function deliver(client: Client, i: Interaction): void {
  if (i.kind === 'nav') {
    client.pageview(typeof i.props?.path === 'string' ? (i.props.path as string) : undefined)
    return
  }
  client.capture(i.name, wireProps(i), i.page)
  if (i.kind === 'leave' && (i.props?.$reason === 'hidden' || i.props?.$reason === 'pagehide')) client.flush(true)
}
