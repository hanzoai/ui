import esbuild from 'esbuild'
import mdx from '@mdx-js/esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import autoprefixer from "autoprefixer"
import tailwindcss from "autoprefixer"
import postCssPlugin from "esbuild-style-plugin"

const css = [
  './style/globals.css',
  './style/lux-tw-base-layer.css',
  './style/social-svg.css',
]

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
      ...css
    ],
    outdir: 'dist',
    bundle: true,
    minify: false,
    treeShaking: true,
    format: 'esm',
    target: ['chrome90', 'firefox74', 'safari14', 'edge90'],
    plugins: [
      nodeExternalsPlugin(),
      mdx(),
      postCssPlugin({
        plugins: [tailwindcss, autoprefixer],
      }),

    ],
  })
  .catch((error) => {
    console.error(`esbuild build error: ${error}`)
    process.exit(1)
  })
