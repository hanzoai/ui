import esbuild from 'esbuild'
import mdx from '@mdx-js/esbuild'
//import { nodeExternalsPlugin } from 'esbuild-node-externals'
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
      // These should not be bundled with the frontend
      // {in: './next-fonts/index', out: 'next-fonts'},
      // {in: './next/index', out: 'next'},
      {in: './blocks/index', out: 'blocks'},
      {in: './common/index', out: 'common'},
      {in: './context-providers/index', out: 'context-providers'},
      {in: './primitives/index', out: 'primitives'},
      {in: './tailwind/index', out: 'tailwind'},
      {in: './types/index', out: 'types'},
      {in: './util/index', out: 'util'},
      ...css
    ],
    outdir: 'dist',
    bundle: true,
    minify: false,
    treeShaking: true,
    format: 'esm',
    target: ['chrome90', 'firefox74', 'safari14', 'edge90'],
    plugins: [
      //nodeExternalsPlugin(),
      mdx(),
      postCssPlugin({
        plugins: [tailwindcss, autoprefixer],
      }),
    ],
    logOverride: {
      "unsupported-css-nesting": "silent",
    },
  })
  .catch((error) => {
    console.error(`esbuild build error: ${error}`)
    process.exit(1)
  })
