# @hanzo/observe

Default-on interaction capture for React, on top of [`@hanzo/event`](../event).

Mount one provider and every click, input, navigation, and (opt-in) visibility is
captured — each one **annotated with a semantic hierarchy** auto-derived from the
tree (component path / role / `data-testid` / accessible name) — and emitted
through `@hanzo/event` to the ONE front door (`POST /v1/event`). Privacy-gated
(input redaction) and fail-soft by default. A live event-stream hook powers
session playback.

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

That is the whole setup. Every interaction now arrives on the pipe as a reserved
autocapture event (`$click`, `$input`, `$change`, `$submit`, `$pageview`, `$view`)
with properties like:

```jsonc
{
  "$el": "Dashboard/UserCard/button[save]",   // the significant-node trail
  "$role": "button",
  "$testid": "save",
  "$component": "SaveButton",
  "$path": ["Dashboard", "UserCard", "button[save]"]
}
```

## The semantic hierarchy

For the element an interaction lands on, the engine walks the DOM ancestry and
describes each step as a `SemanticNode` — `tag`, ARIA `role` (explicit or
implicit), `testid`, accessible `name`, and `component`. The result is a small
JSON-LD document (`@context`, `@type: "Interaction"`, `path`, `target`, `label`)
carried with the event. So a click is not "a click at (x, y)" but "a click on the
**Save** button, inside **UserCard**, inside the **Dashboard** navigation."

Component names come from a `data-hz-name` / `data-component` attribute (stable in
production) when present, else from the nearest named React fiber owner (available
in development builds).

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

BSD-3-Clause © Hanzo AI
