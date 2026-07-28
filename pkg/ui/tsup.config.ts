import { readdirSync } from 'node:fs'
import { defineConfig } from 'tsup'

// `@hanzo/ui/primitives/Button` — one door per component, generated from the
// backend manifest by scripts/gen-primitives.mjs. Enumerated here so each one
// compiles to dist like everything else; an exports entry that points at a file
// the package does not ship is not a door, it is a 404.
const primitiveEntries = Object.fromEntries(
  readdirSync(new URL('src/primitives', import.meta.url))
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => [`primitives/${f.slice(0, -4)}`, `src/primitives/${f}`]),
)

// Ship COMPILED JS (ESM + CJS) so consumers never transpile our source. Next 16's
// flight-client loader parses `'use client'` modules from node_modules WITHOUT TS —
// raw `.ts` with inline `export { type X }` crashed it. Compiled JS has the types
// stripped and keeps the `'use client'` banner. `.d.ts` comes from tsc (see build script).
//
// Every dep is external (peers/deps resolve at the consumer): @hanzo/*, @hanzogui/*,
// react*, react-native*. The lib stays cross-platform because it only re-imports
// @hanzo/gui, which resolves its own web/native entry.
export default defineConfig({
  entry: {
    ...primitiveEntries,
    index: 'src/index.ts',
    // Each BACKEND is its own entry, so a consumer can name the one it renders on
    // instead of inheriting whatever the root barrel happens to re-export. That is
    // the whole point of `@hanzo/ui/shadcn`: an app that still needs the Radix/
    // Tailwind surface says so out loud, and the root barrel is free to move.
    'backends/shadcn/index': 'src/backends/shadcn/index.ts',
    'backends/gui/index': 'src/backends/gui/index.ts',
    // The component-API manifest and the per-component doors that `gen-primitives`
    // emits from it — same surface, addressable one name at a time.
    components: 'src/components.ts',
    'primitives/index': 'src/primitives/index.ts',
    // The design core: `cn`, the token scale, the themes. Pure data + one helper.
    'core/index': 'src/core/index.ts',
    'core/tokens': 'src/core/tokens.ts',
    'models/index': 'src/models/index.ts',
    // The ONE type/radius/space scale every Hanzo admin renders at (createGui).
    'gui-config': 'src/gui-config.ts',
    'product/index': 'src/product/index.ts',
    // The social surface is also its own entry: an app that only renders Publish
    // (the dedicated social.hanzo.ai app, the console's /v1/social binding) must not
    // have to pull the whole product barrel — and its API module must stay React-free.
    'product/social/index': 'src/product/social/index.ts',
    // …and the CONTRACT alone. api.ts imports nothing — no React, no @hanzo/gui — so a
    // host's data layer (the console's /v1/social binding, a node test) can bind it
    // without loading a component tree. Two entries because they are two different
    // things, not two ways to the same thing.
    'product/social/api': 'src/product/social/api.ts',
    data: 'src/data.ts',
    // The DocType renderer is its own entry: an app lane (CMS/ERP/CRM/Help) that
    // renders the framework engine must not have to pull the whole product barrel,
    // and the pure half (types/fields/builder-logic) must stay importable with no
    // React in scope.
    'framework/index': 'src/framework/index.ts',
    // …and the CONTRACT alone (types + client + mapping + media model). It imports
    // no React and no @hanzo/gui, so a host's data layer or a node test can bind
    // the engine without pulling a component tree.
    'framework/core': 'src/framework/core.ts',
    'primitives/bases/data/index': 'src/primitives/bases/data/index.ts',
    gitops: 'src/gitops.ts',
    canvas: 'src/canvas.ts',
    wallet: 'src/wallet.ts',
    network: 'src/network.ts',
    billing: 'src/billing.ts',
    dashboard: 'src/dashboard.ts',
    usage: 'src/usage.ts',
    oss: 'src/oss.ts',
    telemetry: 'src/telemetry.ts',
  },
  format: ['esm', 'cjs'],
  outDir: 'dist',
  target: 'es2022',
  platform: 'browser',
  splitting: true,
  treeshake: true,
  sourcemap: true,
  clean: true,
  dts: false,
  external: [/^react/, /^react-dom/, /^react-native/, /^@hanzo\//, /^@hanzogui\//],
  // `'use client'` is stamped onto every output post-build (scripts/add-use-client.mjs);
  // tsup's banner misses split chunks.
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
})
