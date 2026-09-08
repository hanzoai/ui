// `hanzo` — one name over the two libraries.
//
// The root is deliberately weightless. It holds two loaders and a version
// string; it imports neither library, so a bundler that sees `import { ui }
// from 'hanzo'` emits a chunk boundary rather than the component graph. The
// libraries arrive when a loader is called and not before:
//
//   const { Button } = await ui()
//
// `typeof import(…)` carries the whole surface through, so `Button` above is
// the real component type with no cast and no ambient declaration. Anyone who
// wants them eagerly names the subpath instead — `hanzo/ui`, `hanzo/gui` — and
// gets a plain static re-export.

/** Load @hanzo/ui — the component library. */
export const ui = () => import('@hanzo/ui')

/** Load @hanzo/gui — the primitive substrate @hanzo/ui renders through. */
export const gui = () => import('@hanzo/gui')

export const version = '9.0.0'
