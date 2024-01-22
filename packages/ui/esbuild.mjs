import mdx from '@mdx-js/esbuild'
import esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'

esbuild
  .build({
    entryPoints: ['./index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    minify: true,
    treeShaking: true,
    platform: 'node',
    format: 'cjs',
    target: 'node14',
    plugins: [nodeExternalsPlugin(), mdx()],
  })
  .catch(() => process.exit(1))