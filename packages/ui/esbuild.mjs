import mdx from '@mdx-js/esbuild'
import esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'

esbuild
  .build({
    entryPoints: [
      {in: './primitives/index', out: 'primitives'},
      {in: './util/index', out: 'util'},
      {in: './common/index', out: 'common'},
      {in: './types/index', out: 'types'},
      {in: './next/index', out: 'next'},
      {in: './next-fonts/index', out: 'next-fonts'},
      {in: './context-providers/index', out: 'context-providers'},
      {in: './blocks/index', out: 'blocks'},
      {in: './tailwind/index', out: 'tailwind'},
    ],
    outdir: 'dist/esm',
    bundle: true,
    minify: true,
    treeShaking: true,
    format: 'esm',
    target: ['chrome90', 'firefox74', 'safari14', 'edge90'],
    plugins: [nodeExternalsPlugin(), mdx()],
  })
  .catch(() => process.exit(1))