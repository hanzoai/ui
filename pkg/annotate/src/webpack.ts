// The webpack/Next adapter.
//
//   // next.config.js
//   webpack(config) {
//     config.module.rules.push({
//       test: /\.(t|j)sx$/,
//       exclude: /node_modules/,
//       use: require.resolve('@hanzo/annotate/webpack'),
//     })
//     return config
//   }
//
// This is a PRE-loader in the ordinary sense: it hands SWC the same TSX it would
// have received, with a few attributes added. Next keeps compiling with SWC —
// adding a Babel config would switch the whole app off SWC, which costs far more
// than this feature is worth.

import { shouldTransform } from './filter.js'
import { transform } from './transform.js'

interface LoaderContext {
  resourcePath: string
  cacheable?: (flag: boolean) => void
}

/** Annotate a module on its way into the compiler. Never throws: a file this
 *  cannot parse is passed through untouched, because a build must not fail over
 *  an observability nicety. */
export default function annotateLoader(this: LoaderContext, source: string): string {
  this.cacheable?.(true)
  const filename = this.resourcePath
  if (!shouldTransform(filename)) return source
  try {
    return transform(source, { filename })?.code ?? source
  } catch {
    return source
  }
}
