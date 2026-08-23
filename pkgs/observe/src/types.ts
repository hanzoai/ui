// Public types for @hanzo/observe.
//
// The engine turns a raw DOM event into an `Interaction`: a `kind`, the reserved
// autocapture event `name`, a redacted value context, and — the point of this
// package — a `Semantic` hierarchy auto-derived from the tree. The React binding
// then emits each Interaction through @hanzo/event to the ONE entry point.

/** A single node in the derived semantic hierarchy — one element on the path from
 *  the tree root down to the element actually interacted with. */
export interface SemanticNode {
  /** HTML tag, lowercased (button, a, input, form, nav, …). */
  tag: string
  /** ARIA role: the explicit `role` attribute, else the implicit role of the tag
   *  (a[href]→link, button→button, nav→navigation, input→textbox, …), else
   *  "generic". This is the `@type` of the node in JSON-LD terms. */
  role: string
  /** `data-testid` (or `data-test-id`/`data-test`) — the stable automation handle. */
  testid?: string
  /** DOM id, when present. */
  id?: string
  /** Accessible name: aria-label | aria-labelledby text | alt | title | the
   *  element's own trimmed text (bounded). NEVER an input's value. */
  name?: string
  /** Identifying sub-kind: an input/button `type`, a link's path, a heading level. */
  kind?: string
  /** Component display name when derivable — a `data-hz-name`/`data-component`
   *  attribute (stable in production), else the nearest React fiber owner (dev). */
  component?: string
}

/** The semantic hierarchy of an interaction target, shaped as a small JSON-LD
 *  document. `path` is root→leaf; `target` is the leaf; `label` is a compact,
 *  human-readable trail through the significant nodes, e.g.
 *  "navigation/Dashboard/UserCard/button[save]". */
export interface Semantic {
  '@context': string
  '@type': 'Interaction'
  path: SemanticNode[]
  target: SemanticNode
  label: string
}

/** The observed interaction kinds. Each maps to a reserved autocapture event name
 *  on the wire ($click/$input/$change/$submit/$pageview/$view). */
export type InteractionKind = 'click' | 'input' | 'change' | 'submit' | 'nav' | 'view'

/** A redacted, structured view of a form field's state. The raw value is withheld
 *  by default; what remains (kind, length, checked, selected label) is safe. */
export interface RedactedValue {
  /** true when the raw value was withheld. */
  redacted: boolean
  /** Field kind: an input `type`, "textarea", or "select". */
  kind?: string
  /** Character length of the withheld value — a non-identifying signal.
   *  Omitted for always-sensitive fields (password, token, card, …). */
  length?: number
  /** For checkbox/radio — the checked state (structural, not secret). */
  checked?: boolean
  /** Captured value: present ONLY for non-sensitive fields when masking is off,
   *  or a select's chosen option label. Always bounded in length. */
  value?: string
}

/** One observed interaction — what the engine emits to its sink and its stream. */
export interface Interaction {
  kind: InteractionKind
  /** Reserved autocapture event name ($click/$input/$change/$submit/$pageview/$view). */
  name: string
  /** Client timestamp (ms since epoch). */
  at: number
  /** The semantic hierarchy of the target element. */
  semantic: Semantic
  /** Redacted value context — set on input/change interactions. */
  value?: RedactedValue
  /** Extra properties (nav path, visibility ratio, …). */
  props?: Record<string, unknown>
}

/** The privacy policy the engine applies before it captures anything. */
export interface RedactionPolicy {
  /** Withhold every typed input value (default true). When false, non-sensitive
   *  text fields capture a bounded value; sensitive fields are ALWAYS withheld. */
  maskInput?: boolean
  /** An attribute that, on an element or ANY ancestor, excludes the whole subtree
   *  from capture (default "data-hz-private"). `data-observe="off"` and
   *  `data-private` are honored too. */
  privateAttribute?: string
  /** Extra field-name / autocomplete / placeholder patterns treated as sensitive,
   *  merged with the built-in set (password, token, card, cvv, ssn, …). */
  sensitive?: RegExp
}

/** Engine configuration. The sink is the only required field — the React binding
 *  wires it to a @hanzo/event client. */
export interface ObserveConfig {
  /** Where captured interactions go (e.g. a @hanzo/event `capture` call). */
  sink: (interaction: Interaction) => void
  /** Capture root; defaults to `document`. */
  root?: Document | Element
  /** Privacy policy; sensible privacy-first defaults when omitted. */
  redaction?: RedactionPolicy
  /** Master switch (default true). */
  enabled?: boolean
  /** Capture SPA navigations by observing history + popstate (default true). */
  nav?: boolean
  /** Selector whose matches are watched for visibility ($view). Default
   *  "[data-hz-view]" — opt-in, so the stream isn't flooded. Empty string disables. */
  viewSelector?: string
  /** Trailing debounce (ms) that coalesces a burst of keystrokes into one $input
   *  (default 400). */
  inputDebounceMs?: number
  /** Max ancestors walked when deriving the semantic path (default 12). */
  maxDepth?: number
  /** Ring-buffer size of the session-playback stream (default 500). */
  bufferSize?: number
}
