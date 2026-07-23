// Semantic hierarchy derivation. Given the element an interaction landed on, walk
// the DOM ancestry and describe each step as a SemanticNode — tag, ARIA role,
// test id, accessible name, component. The result is a small JSON-LD document that
// travels with every event, so a click is not "a click at (x,y)" but "a click on
// the Save button, inside UserCard, inside the Dashboard navigation".
//
// It never reads a form field's value (that is redaction's job) and never throws;
// the engine wraps it, and every accessor is defensive.

import type { Semantic, SemanticNode } from './types'

const CONTEXT = 'https://schema.hanzo.ai/observe'
const MAX_NAME = 80

/** Implicit ARIA role of a tag, minus the input special-cases handled below. */
const TAG_ROLE: Record<string, string> = {
  nav: 'navigation',
  main: 'main',
  header: 'banner',
  footer: 'contentinfo',
  aside: 'complementary',
  form: 'form',
  button: 'button',
  select: 'combobox',
  textarea: 'textbox',
  img: 'img',
  ul: 'list',
  ol: 'list',
  li: 'listitem',
  table: 'table',
  dialog: 'dialog',
  article: 'article',
  section: 'region',
  summary: 'button',
}

/** Implicit role of an <input> by its `type`. */
const INPUT_ROLE: Record<string, string> = {
  checkbox: 'checkbox',
  radio: 'radio',
  range: 'slider',
  number: 'spinbutton',
  submit: 'button',
  button: 'button',
  reset: 'button',
  search: 'searchbox',
}

function attr(el: Element, name: string): string | undefined {
  const v = el.getAttribute(name)
  return v == null || v === '' ? undefined : v
}

function tagOf(el: Element): string {
  return el.tagName.toLowerCase()
}

/** The role Cloud/insights groups on: explicit role wins, else the implicit one. */
export function roleOf(el: Element): string {
  const explicit = attr(el, 'role')
  if (explicit) return explicit
  const tag = tagOf(el)
  if (tag === 'a') return attr(el, 'href') != null ? 'link' : 'generic'
  if (tag === 'input') return INPUT_ROLE[(attr(el, 'type') || 'text').toLowerCase()] ?? 'textbox'
  if (/^h[1-6]$/.test(tag)) return 'heading'
  return TAG_ROLE[tag] ?? 'generic'
}

function clip(s: string | null | undefined): string | undefined {
  if (!s) return undefined
  const t = s.replace(/\s+/g, ' ').trim()
  if (!t) return undefined
  return t.length > MAX_NAME ? t.slice(0, MAX_NAME) + '…' : t
}

/** The accessible name of an element — what a screen reader would announce —
 *  bounded and value-free. Input fields resolve to their label/placeholder/name,
 *  NEVER their typed value. */
export function accessibleName(el: Element): string | undefined {
  const label = attr(el, 'aria-label')
  if (label) return clip(label)

  const labelledby = attr(el, 'aria-labelledby')
  if (labelledby && typeof document !== 'undefined') {
    const text = labelledby
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent || '')
      .join(' ')
    const c = clip(text)
    if (c) return c
  }

  const tag = tagOf(el)
  if (tag === 'img') return clip(attr(el, 'alt'))
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    // A <label for> association, then placeholder/name — but not the value.
    if (el.id && typeof document !== 'undefined') {
      const forLabel = document.querySelector(`label[for="${cssEscape(el.id)}"]`)
      const c = clip(forLabel?.textContent)
      if (c) return c
    }
    return clip(attr(el, 'placeholder') || attr(el, 'name') || attr(el, 'title'))
  }

  const title = attr(el, 'title')
  if (title) return clip(title)

  // For interactive/labelled leaves, the element's own trimmed text is the name.
  // Bounded, and skipped for large containers (their text is not a "name").
  const role = roleOf(el)
  if (role === 'button' || role === 'link' || role === 'heading' || role === 'listitem') {
    return clip(el.textContent)
  }
  return undefined
}

/** CSS.escape when present, else a conservative fallback for attribute selectors. */
function cssEscape(s: string): string {
  const g = typeof globalThis !== 'undefined' ? (globalThis as { CSS?: { escape?: (v: string) => string } }) : undefined
  if (g?.CSS?.escape) return g.CSS.escape(s)
  return s.replace(/["\\\]]/g, '\\$&')
}

/** Best-effort component display name: a stable `data-hz-name`/`data-component`
 *  attribute first (survives minification), else the nearest named React fiber
 *  owner (present in development builds). Returns undefined when neither exists. */
export function componentName(el: Element): string | undefined {
  const marked = attr(el, 'data-hz-name') || attr(el, 'data-component')
  if (marked) return clip(marked)
  return reactOwner(el)
}

function reactOwner(el: Element): string | undefined {
  try {
    const holder = el as unknown as Record<string, unknown>
    const key = Object.keys(holder).find(
      (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'),
    )
    if (!key) return undefined
    let owner = (holder[key] as { _debugOwner?: unknown })?._debugOwner as
      | { type?: { displayName?: string; name?: string }; _debugOwner?: unknown }
      | undefined
    let hops = 0
    while (owner && hops < 20) {
      const t = owner.type
      const n = t?.displayName || t?.name
      // Component (not host) names are conventionally capitalised.
      if (n && /^[A-Z]/.test(n)) return n
      owner = owner._debugOwner as typeof owner
      hops++
    }
  } catch {
    /* fiber internals are best-effort; never let them break capture */
  }
  return undefined
}

/** Describe one element as a SemanticNode. */
export function describe(el: Element): SemanticNode {
  const tag = tagOf(el)
  const role = roleOf(el)
  const node: SemanticNode = { tag, role }
  const testid = attr(el, 'data-testid') || attr(el, 'data-test-id') || attr(el, 'data-test')
  if (testid) node.testid = testid
  if (el.id) node.id = el.id
  const name = accessibleName(el)
  if (name) node.name = name
  const kind = subKind(el, tag, role)
  if (kind) node.kind = kind
  const component = componentName(el)
  if (component) node.component = component
  return node
}

function subKind(el: Element, tag: string, role: string): string | undefined {
  if (tag === 'input') return (attr(el, 'type') || 'text').toLowerCase()
  if (tag === 'button') return attr(el, 'type') || undefined
  if (tag === 'a') {
    const href = attr(el, 'href')
    if (!href) return undefined
    try {
      return new URL(href, typeof location !== 'undefined' ? location.href : 'https://x').pathname
    } catch {
      return href
    }
  }
  if (role === 'heading') return el.tagName.toLowerCase()
  return undefined
}

/** A node is "significant" (worth naming in the label) when it carries identity —
 *  a component, a test id, a real role, or a name. Wrapper divs drop out. */
function significant(n: SemanticNode): boolean {
  return Boolean(n.component || n.testid || (n.role && n.role !== 'generic') || n.name)
}

function labelOf(n: SemanticNode): string {
  if (n.component) return n.component
  const base = n.role && n.role !== 'generic' ? n.role : n.tag
  if (n.testid) return `${base}[${n.testid}]`
  if (n.name) return `${base}[${n.name}]`
  return base
}

/** The compact label over a semantic path: the significant nodes (or the leaf when
 *  none is significant), joined root→leaf. Shared by every binding so a web click
 *  and a native tap read the same way. */
export function labelFor(path: SemanticNode[]): string {
  const trail = path.filter(significant)
  const base = trail.length ? trail : path.length ? [path[path.length - 1]] : []
  return base.map(labelOf).join('/')
}

/** Derive the semantic hierarchy of `el`: a bounded root→leaf path of
 *  SemanticNodes, the leaf target, and a compact label over the significant nodes. */
export function annotate(el: Element, opts: { maxDepth?: number } = {}): Semantic {
  const maxDepth = opts.maxDepth ?? 12
  const path: SemanticNode[] = []
  let cur: Element | null = el
  let depth = 0
  const docEl = typeof document !== 'undefined' ? document.documentElement : null
  while (cur && cur.nodeType === 1 && cur !== docEl && depth < maxDepth) {
    path.unshift(describe(cur))
    cur = cur.parentElement
    depth++
  }
  const target = path.length ? path[path.length - 1] : describe(el)
  const label = labelFor(path.length ? path : [target])
  return { '@context': CONTEXT, '@type': 'Interaction', path, target, label }
}
