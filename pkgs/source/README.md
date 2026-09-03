# @hanzo/source

Where a rendered element came from, and the editor that opens it.

In development a JSX compiler hands the runtime the file, line and column of
every element it wrote. React drops that; this runtime keeps it, on host
elements, as `data-source="file:line:column"`. Alt + right click on anything and
the development server opens that file in your editor — Vite through
`/__open-in-editor`, Next through `/__nextjs_launch-editor`, each via
`launch-editor`, which honours `LAUNCH_EDITOR`, then `EDITOR`, then whichever of
code, cursor, zed or vim is running.

Production bundles carry nothing from this package.

## Vite

`@hanzo/vite` wires it. An app on `hanzo()` needs no configuration.

## Next

Name the runtime in `tsconfig.json`, which SWC reads:

```json
{ "compilerOptions": { "jsx": "preserve", "jsxImportSource": "@hanzo/source" } }
```

and render the listener once, in the root layout:

```tsx
import { Source } from '@hanzo/source/react'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Source />
      </body>
    </html>
  )
}
```

## By hand

```ts
import { position, open, listen } from '@hanzo/source/client'
```

`position(el)` reads the nearest stamp, `open(at)` asks the server, `listen()`
binds the gesture and returns the function that unbinds it.
