// Build the same Semantic document the web derives from the DOM, but from explicit
// native meta plus the ObserveScope stack — so a native tap and a web click read
// identically on the wire. Reuses @hanzo/observe's label + sensitivity primitives
// so there is exactly one definition of each.

import { labelFor, sensitiveKey } from '@hanzo/observe'
import type { RedactedValue, RedactionPolicy, Semantic, SemanticNode } from '@hanzo/observe'
import type { NativeMeta } from './types'

const CONTEXT = 'https://schema.hanzo.ai/observe'
const MAX_VALUE = 64

/** Field kinds whose value is never captured (mirrors the web's SENSITIVE_TYPE). */
const SECURE_KINDS = new Set(['password', 'email', 'tel', 'secure'])

/** A leaf SemanticNode from explicit meta. `name` becomes the component (so the
 *  label reads as the element name), `role` its @type. */
export function leafNode(meta: NativeMeta, defaultRole: string): SemanticNode {
  const node: SemanticNode = { tag: 'native', role: meta.role ?? defaultRole }
  if (meta.testid) node.testid = meta.testid
  if (meta.name) node.component = meta.name
  if (meta.kind) node.kind = meta.kind
  return node
}

/** A scope SemanticNode — one ObserveScope wrapper on the path. */
export function scopeNode(meta: { name: string; role?: string; testid?: string }): SemanticNode {
  const node: SemanticNode = { tag: 'native', role: meta.role ?? 'group', component: meta.name }
  if (meta.testid) node.testid = meta.testid
  return node
}

/** Compose the scope stack + leaf into a Semantic (path root→leaf, target, label). */
export function buildSemantic(scope: SemanticNode[], leaf: SemanticNode): Semantic {
  const path = [...scope, leaf]
  return { '@context': CONTEXT, '@type': 'Interaction', path, target: leaf, label: labelFor(path) }
}

/** Redact an input's text with the exact web policy: never the raw value by
 *  default; sensitive fields withhold even the length. */
export function redactText(text: string, meta: NativeMeta, policy: RedactionPolicy = {}): RedactedValue {
  const key = [meta.name, meta.testid, meta.kind].filter(Boolean).join(' ')
  const secure = Boolean(meta.secure) || SECURE_KINDS.has(meta.kind ?? '') || sensitiveKey(key, policy)
  const kind = meta.kind ?? 'text'
  if (secure) return { redacted: true, kind }
  if (policy.maskInput !== false) return { redacted: true, kind, length: text.length }
  return { redacted: false, kind, value: text.length > MAX_VALUE ? text.slice(0, MAX_VALUE) + '…' : text }
}
