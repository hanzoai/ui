import esbuild from 'esbuild'
import mdx from '@mdx-js/esbuild'
import autoprefixer from "autoprefixer"
import tailwindcss from "autoprefixer"
import postCssPlugin from "esbuild-style-plugin"

esbuild
  .build({
    entryPoints: ['./index'],
    outdir: 'dist',
    bundle: true,
    minify: false,
    treeShaking: true,
    format: 'esm',
    target: ['chrome90', 'firefox74', 'safari14', 'edge90'],
    plugins: [
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
