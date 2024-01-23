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
      {in: './index', 'out': './index'},
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
