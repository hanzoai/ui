// Which modules are worth parsing.
//
// The bundler hands every module to every loader in its rule, so the cheapest
// correct answer to "is this JSX I authored" saves the parser from being run on
// the entire dependency graph. Extension first (a string compare), then a
// dependency check — a package's published output is already compiled, its JSX
// is gone, and re-parsing it can only cost time.

const JSX_EXT = /\.(tsx|jsx)$/

/** Packages whose SOURCE is compiled by the host app (Next `transpilePackages`)
 *  and therefore DOES still contain JSX worth annotating. Everything else under
 *  a dependency directory is skipped. */
const ANNOTATE_ANYWAY = /[/\\]node_modules[/\\]@hanzo(gui)?[/\\]/

export function shouldTransform(filename: string): boolean {
  if (!JSX_EXT.test(filename.split('?')[0]!)) return false
  if (filename.includes('node_modules')) return ANNOTATE_ANYWAY.test(filename)
  return true
}
