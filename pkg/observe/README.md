# @hanzo/observe

Default-on interaction capture for React, on top of [`@hanzo/event`](../event).

Mount one provider and every click, input, navigation, and (opt-in) visibility is
captured — each one **annotated with a semantic hierarchy** auto-derived from the
tree (component path / role / `data-testid` / accessible name) — and emitted
through `@hanzo/event` to the ONE entry point (`POST /v1/event`). Privacy-gated
(input redaction) and fail-soft by default. A live event-stream hook powers
session playback.

> ### Most apps should not mount this directly.
>
> This is the ENGINE. The one wiring an app mounts is its provider — `<Hanzo
> analytics>` from `@hanzo/ui`, or `<TelemetryProvider/>` from
> `@hanzogui/telemetry` — and both start this engine for you, with consent
> resolved and the client already built. Mounting `<ObserveProvider/>` as well
> is not an upgrade; it is a second engine, and until 0.1.7 it doubled every
> event (see [One root, one engine](#one-root-one-engine)).
>
> Reach for the provider below when you are building one of those wirings, or
> hosting the engine somewhere neither reaches.

```tsx
'use client'
import { AnalyticsProvider } from '@hanzo/event/react'
import { ObserveProvider } from '@hanzo/observe/react'

export function Root({ children }) {
  return (
    <AnalyticsProvider config={{ product: 'console' }}>
      <ObserveProvider>{children}</ObserveProvider>
    </AnalyticsProvider>
  )
}
```

Every interaction now arrives on the pipe as a reserved
autocapture event with properties like:

```jsonc
{
  "$el": "Dashboard/UserCard/button[save]",   // the significant-node trail
  "$role": "button",
  "$testid": "save",
  "$component": "SaveButton",
  "$path": ["Dashboard", "UserCard", "button[save]"],
  "$href": "/pricing",                        // the link it follows
  "$id": "save",                              // the target's own id
  "$section": "plans"                         // the section of the page it sits in
}
```

## Events

| Event | When | Properties beyond the annotation |
|---|---|---|
| `$click` | every click | position (below), when a pointer pressed it |
| `$rageclick` | the third press inside 1 s and 30 px of the last; once a burst | position |
| `$input` | a field's keystrokes, debounced per field (400 ms) | `$value` (redacted) |
| `$change` | a field settled | `$value` (redacted) |
| `$submit` | a form submitted | |
| `$view` | a `[data-hz-view]` element once half of it is in view, or what is in view of it covers half the viewport (so a section taller than two viewports is still seen); once per element; elements mounted after `start()` included | `ratio` |
| `$scroll` | the document scrolled to 25, 50, 75 and 100 % of its height, each once a page view | `depth`, `$page_width`, `$page_height`, `$viewport_width`, `$viewport_height` |
| `$pageview` | an SPA navigation, when `nav` is on | `path` |

Every event carries the annotation (`$el`, `$role`, `$path`, and `$testid`,
`$name`, `$component`, `$kind` when the target has them) and, when it has them,
where it happened:

- **`$href`** — the closest `a[href]`, the target or an ancestor: a pathname on
  this origin, origin + pathname on another, the bare scheme (`mailto:`, `tel:`)
  for anything that is not http(s). Never a query or a fragment.
- **`$id`** — the target's own id.
- **`$section`** — the closest `section[id]` or `[data-hz-view]`: its
  `data-hz-view` value, else its id.

Each is at most 256 characters, and dropped rather than clipped past that.

**Position**, on `$click` and `$rageclick`, is what a heat map is drawn from:

| Key | Value |
|---|---|
| `$x`, `$y` | the pointer in page coordinates (viewport coordinates for a fixed or sticky target) |
| `$target_fixed` | whether the target stays put when the page scrolls |
| `$el_x`, `$el_y` | the pointer inside the target's box, from its top left |
| `$viewport_width`, `$viewport_height` | the window it was measured in |
| `$page_width`, `$page_height` | the document's `scrollWidth` / `scrollHeight` |

All rounded to the pixel. A click no pointer pressed — a keyboard activation,
`el.click()`, a label forwarding to its field (`detail === 0`) — carries none,
and never counts toward a rage click.

Scroll depth is measured once a frame from a passive listener that only reads,
and asks for no frames once a page view has reached every milestone. A new
address starts the milestones again, with `nav` on or off; the top of a page is
not a scroll, so a router putting the next page there reports nothing. Only an
engine on `document` measures it.

## The semantic hierarchy

For the element an interaction lands on, the engine walks the DOM ancestry and
describes each step as a `SemanticNode` — `tag`, ARIA `role` (explicit or
implicit), `testid`, accessible `name`, and `component`. The result is a small
JSON-LD document (`@context`, `@type: "Interaction"`, `path`, `target`, `label`)
carried with the event. So a click is not "a click at (x, y)" but "a click on the
**Save** button, inside **UserCard**, inside the **Dashboard** navigation."

Component names resolve most-authoritative-first, and the order is chosen so a
name does not change when you ship:

1. **`data-hz-name` / `data-component`** — written by a person, about this node.
2. **`data-observe`** — stamped at build time by `@hanzo/annotate`.
3. **`data-slot`** — the part name a design system puts on the element it
   renders (`button`, `select-trigger`, `dialog-content`). `@hanzo/ui` stamps
   one on every primitive through a single helper, and shadcn does the same, so
   a whole component library becomes attributable with no per-call-site code.
4. **The nearest named React fiber owner** — richer (`SaveButton`, not
   `button`), but development-only: a production build strips `_debugOwner` and
   minifies the name. It ranks *below* `data-slot` deliberately — a name that
   evaporates at deploy time silently empties the dashboard grouped on it.

Whichever wins, the node keeps its qualifier: `card/button[Save]`, not `card/
button`. A component name says what KIND of thing it is, and a library renders
hundreds of each.

## One root, one engine

The engine installs **delegated** listeners on a root (`document`, normally), so
two running engines on one root capture every interaction **twice** — and a
doubled click is indistinguishable downstream from an engaged visitor. That is
not hypothetical: an app got one by following two true sets of instructions at
once, because a library provider starts an engine and this README used to tell
apps to mount another.

Since 0.1.7 the first engine to `start()` claims its root and holds it until it
stops; a later engine on the same root stays inert, and says so
(`engine.capturing === false`). The claim lives on the page, under a
`Symbol.for` registry rather than in module scope — two copies of this package
in one bundle have two module scopes and would not see each other's claim at
all, which is exactly the case where a duplicate is most likely. Distinct roots
(a scoped `Element`, plus `document`) coexist fine.

## Privacy

Privacy-first by default:

- **Input values are withheld.** An `$input`/`$change` event carries the field's
  `kind` and value `length`, never the typed text.
- **Sensitive fields are always redacted** (password / email / card / cvv / token
  / ssn / …) — not even a length.
- **`data-hz-private`** (or `data-observe="off"` / `data-private`) on an element or
  any ancestor excludes the whole subtree from capture.

To capture non-sensitive text values (e.g. a search box), pass
`redaction={{ maskInput: false }}` — sensitive fields stay redacted regardless.

**Consent is not decided here.** The engine takes `enabled` as a value; whether
a visitor may be observed at all (Global Privacy Control, Do Not Track, a stored
banner choice, a build-time kill switch) is one policy in one place — the
provider layer — and it passes the answer down. Braiding a second, partial copy
of that policy into the engine is how the two end up disagreeing about an
explicit opt-in.

## Session playback

```tsx
import { useEventStream } from '@hanzo/observe/react'

function Timeline() {
  const { events, clear } = useEventStream({ limit: 200 })
  return <ol>{events.map((e, i) => <li key={i}>{e.name} → {e.semantic.label}</li>)}</ol>
}
```

`useEventStream` subscribes to the same stream the engine feeds; it is a rolling,
in-memory window for building a live session-playback UI.

## Framework-agnostic core

The `.` entry has no React or transport dependency — it is the engine, the
annotator, the redactor, and the stream:

```ts
import { observe } from '@hanzo/observe'

const engine = observe((i) => analytics.capture(i.name, { el: i.semantic.label }))
engine.stream.subscribe(render) // live playback
engine.stop()
```

This is what the Svelte (`@hanzo/observe-svelte`) and native
(`@hanzo/observe-native`) adaptors build on.

## Note on build-time component names

Reliable component names in production want a build step that stamps `data-hz-name`
onto rendered elements (the runtime already reads it). That is a JSX/AST codemod —
separate tooling from this runtime SDK — and is a documented follow-on, not part of
this package.

## License

MIT © Hanzo AI — see [LICENSE.md](../../LICENSE.md). HIP-0137 (`hanzoai/hips`).
