// URL redaction over a recorded event, applied before it is buffered.
//
// Masking handles what the user TYPED. It does nothing about what the page LINKS
// to, and a recording is full of URLs: rrweb's Meta event carries `href`, and
// every snapshot and mutation carries `<a href>`, `<img src>`, `<form action>`.
// A visit to `/callback?code=…` therefore puts a live authorization code in the
// recording even though no input was involved.
//
// `redactSecrets` from @hanzo/event is the one redactor for this. It redacts
// credential query parameters BY NAME (`code`, `state`, `token`, `secret`, …),
// which is the only signal that exists for an opaque OAuth code — there is no
// shape to match — and it also strips the secret shapes (JWTs, `sk-…`, DSN
// userinfo) that a URL sometimes carries.
//
// Scrubbing is IN PLACE. A full snapshot of a real page is megabytes; cloning it
// to stay pure would double the memory of every recording for no observable
// benefit, because rrweb hands each event to exactly one emit callback and never
// looks at it again.

import { redactSecrets } from '@hanzo/event'
import type { eventWithTime } from 'rrweb'

/** Attributes whose value is a URL (or a list of them). `style` is included
 *  because `background-image: url(…)` is a URL in an attribute.
 *
 *  NOT included: rrweb's `_cssText`, the inlined text of a whole stylesheet. It
 *  is authored build output rather than session content, and it is unbounded —
 *  running the full redactor over every stylesheet on every snapshot buys little
 *  and costs a main-thread pause. */
const URL_ATTRS = new Set([
  'href',
  'src',
  'srcset',
  'action',
  'formaction',
  'poster',
  'data',
  'background',
  'cite',
  'longdesc',
  'ping',
  'xlink:href',
  'style',
])

type Bag = Record<string, unknown>

function isBag(v: unknown): v is Bag {
  return typeof v === 'object' && v !== null
}

/** Redact the URL-bearing entries of one serialized attribute map. */
function scrubAttributes(attrs: unknown): void {
  if (!isBag(attrs)) return
  for (const k of Object.keys(attrs)) {
    const v = attrs[k]
    if (typeof v === 'string' && URL_ATTRS.has(k.toLowerCase())) attrs[k] = redactSecrets(v)
  }
}

/** Walk a serialized node tree, redacting every attribute map on it. Iterative:
 *  a deep DOM must not blow the stack inside a telemetry path. */
function scrubNode(root: unknown): void {
  const stack: unknown[] = [root]
  while (stack.length > 0) {
    const n = stack.pop()
    if (!isBag(n)) continue
    if ('attributes' in n) scrubAttributes(n.attributes)
    const kids = n.childNodes
    if (Array.isArray(kids)) for (const k of kids) stack.push(k)
  }
}

/**
 * Redact every URL an event carries and return the same event.
 *
 * Structural rather than switched on `EventType`: an event that has an `href` is
 * a Meta, one that has a `node` is a snapshot, one that has `adds`/`attributes`
 * is a mutation. Reading the shape instead of the tag means a new event type
 * cannot silently route around the redactor.
 */
export function scrubEvent(e: eventWithTime): eventWithTime {
  const data = (e as unknown as Bag).data
  if (!isBag(data)) return e

  // Meta: { href, width, height }
  if (typeof data.href === 'string') data.href = redactSecrets(data.href)

  // FullSnapshot: { node, initialOffset }
  if (data.node) scrubNode(data.node)

  // Mutation: { adds: [{ node }], attributes: [{ id, attributes }] }
  if (Array.isArray(data.adds)) {
    for (const add of data.adds) if (isBag(add)) scrubNode(add.node)
  }
  if (Array.isArray(data.attributes)) {
    for (const m of data.attributes) if (isBag(m)) scrubAttributes(m.attributes)
  }

  return e
}
