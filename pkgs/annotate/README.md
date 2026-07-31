# @hanzo/annotate

The build-time half of [`@hanzo/observe`](../observe).

`@hanzo/observe` describes an interaction by walking the DOM: *"a click on the Save
button, inside UserCard, inside the Dashboard navigation"*. It can only name
`UserCard` if `UserCard` left its name in the DOM. In development React's fiber
carries `_debugOwner` and the name is free; a production build strips it and
minifies the function, so every node goes anonymous exactly where the data matters.

This package derives the name from the source instead. Every component already
states its own name — `function UserCard()` — and every component already has a
root element. The transform writes the one onto the other:

```tsx
function UserCard({ user }) {
  return <section className="card">…</section>
}
```

```tsx
function UserCard({ user }) {
  return <section className="card" data-observe="UserCard">…</section>
}
```

The annotation is a **consequence of declaring a component**, not a chore attached
to it. Nothing to remember, nothing to keep in sync.

## Install

```sh
pnpm add -D @hanzo/annotate
```

## Use

**Next (webpack).** A pre-loader, so Next keeps compiling with SWC — adding a
Babel config would switch the whole app off SWC and cost far more than this
feature is worth.

```js
// next.config.js
webpack(config) {
  config.module.rules.push({
    test: /\.(t|j)sx$/,
    exclude: /node_modules/,
    use: require.resolve('@hanzo/annotate/webpack'),
  })
  return config
}
```

**Vite.**

```ts
import annotate from '@hanzo/annotate/vite'

export default defineConfig({ plugins: [annotate(), react()] })
```

**Anything else.**

```ts
import { transform } from '@hanzo/annotate'

transform(code, { filename })?.code ?? code
```

## What it does, exactly

- Annotates the **root element of every component** — a capitalised `function`,
  `const` arrow, or class `render()`, including through `memo`/`forwardRef`.
  Every branch of a conditional or early return is a root, and each one is
  annotated.
- **Never** touches `Fragment`, `Suspense`, `StrictMode`, `Profiler` (React warns
  on any prop but `key`/`children`), or document metadata (`<head>`, `<title>`,
  `<script>`, …), which are not interaction targets.
- **Never** overwrites a hand-written `data-observe`, including the
  `data-observe="off"` redaction opt-out.
- Writes the attribute **last**, so a `{...props}` spread cannot rename the node.
  A node is labelled by the component that renders it — an identity, not
  something a caller can inject.
- Skips nested callbacks: a `renderItem` closure declares its own scope, and
  attributing its returns to the enclosing component is how a hierarchy starts
  lying.

## Why one attribute

`data-observe` answers one question — *what is this node, for observation?* — and
`off` is the answer *"nothing, look away"*. A component name can never collide
with it: JSX requires component names to be capitalised.

The hierarchy is **not** stored per node. The DOM already is the hierarchy;
`@hanzo/observe` walks ancestors and joins their names. Storing a path on every
element would complect a node's identity with its position, and ship the same
string a hundred times.

## Text in, text out

The transform parses with TypeScript and **splices text** — it never re-prints an
AST. Nothing else in the file can change, no printer has an opinion about your
formatting, and because an insertion never contains a newline, **every line number
is exactly where it was**: a stack trace and a source map still point at the right
line.

It is also fail-soft everywhere. A file it cannot parse is passed through
untouched, because a build must not fail over an observability nicety.

## Test

```sh
pnpm test
```
