// @hanzo/annotate — the build-time half of @hanzo/observe.
//
//   Next (webpack):  config.module.rules.push({ test: /\.[jt]sx$/, use: '@hanzo/annotate/webpack' })
//   Vite:            plugins: [annotate()]
//   Anything else:   transform(code, { filename })
//
// One transform, three thin adapters. The adapters exist because bundlers
// disagree about calling conventions, not because the work differs — each is a
// few lines that hand `transform` a string and hand back a string.

export { transform, ATTRIBUTE } from './transform.js'
export type { TransformOptions, TransformResult } from './transform.js'
export { shouldTransform } from './filter.js'
