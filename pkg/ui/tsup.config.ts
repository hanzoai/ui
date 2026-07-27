import { defineConfig } from 'tsup'

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
    index: 'src/index.ts',
    'product/index': 'src/product/index.ts',
    data: 'src/data.ts',
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
