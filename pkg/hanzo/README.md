# hanzo

One dependency over the two Hanzo frontend libraries. `@hanzo/ui` is the
component library; `@hanzo/gui` is the primitive substrate it renders through.
Install `hanzo` and both are reachable, under whichever name reads better where
you are standing.

```sh
pnpm add hanzo
```

## Three ways in

```ts
// 1 — the umbrella, eager. Subpaths of `hanzo` re-export the libraries whole.
import { Button } from 'hanzo/ui'
import { styled } from 'hanzo/gui'

// 2 — the umbrella, lazy. The root imports neither library, so it costs a
//     chunk boundary and nothing else until a loader is called.
import { ui, gui } from 'hanzo'
const { Button } = await ui()
const { styled } = await gui()

// 3 — the libraries by their own names, unchanged.
import { Button } from '@hanzo/ui'
import { styled } from '@hanzo/gui'
```

All three reach the same modules. `hanzo/ui` is `@hanzo/ui`: same components,
same types, no wrapper in between.

## Which one

Reach for the lazy root when the components belong to a route or a dialog the
first paint does not need — `await ui()` puts them in their own chunk. Reach
for `hanzo/ui` when they are on the page anyway, and a second network round
trip buys nothing.

`version` names the release you resolved:

```ts
import { version } from 'hanzo'
```
