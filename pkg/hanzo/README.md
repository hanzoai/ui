# hanzo

One dependency over the Hanzo frontend. Everything the libraries publish is
reachable under this one name, subpath for subpath.

```sh
pnpm add hanzo
```

| member | reached as |
| --- | --- |
| `@hanzo/ui` — components | `hanzo/ui`, `hanzo/ui/chat`, `hanzo/ui/agents`, `hanzo/ui/theme.css`, … |
| `@hanzo/gui` — the primitive substrate `@hanzo/ui` renders through | `hanzo/gui` |
| `@hanzo/iam` — identity | `hanzo/iam`, `hanzo/iam/react`, `hanzo/iam/server`, … |
| `@hanzo/ai` — models | `hanzo/ai`, `hanzo/ai/react` |
| `@hanzo/event` — analytics | `hanzo/event`, `hanzo/event/react` |

A subpath of `hanzo` re-exports the member subpath of the same name by the
member's own specifier, so it is the same module: same components, same types,
and the same browser/node and import/require conditions, resolved where you
install rather than here.

The exports map is generated from the members' own `exports` at build time
(`scripts/gen.mjs`), so a subpath a library adds arrives with the next release
rather than when someone remembers to mirror it.

## Three ways in

```ts
// 1 — the umbrella, eager.
import { Button } from 'hanzo/ui'
import { useSession } from 'hanzo/iam/react'

// 2 — the umbrella, lazy. The root imports no library, so it costs a chunk
//     boundary and nothing else until a loader is called.
import { ui, gui } from 'hanzo'
const { Button } = await ui()

// 3 — the libraries by their own names, unchanged.
import { Button } from '@hanzo/ui'
```

Reach for the lazy root when the components belong to a route or a dialog the
first paint does not need — `await ui()` puts them in their own chunk. Reach for
`hanzo/ui` when they are on the page anyway, and a second round trip buys
nothing.

`version` names the release you resolved:

```ts
import { version } from 'hanzo'
```

## What is not forwarded

Data files. `@hanzo/plans` publishes thirteen `.json` subpaths and JSON has no
re-export syntax, so forwarding it would mean shipping a second, staler copy of
every one. Name that package directly.

## License

Apache-2.0 OR MIT, at your option. See `LICENSE-APACHE`, `LICENSE-MIT` and
`NOTICE`.
