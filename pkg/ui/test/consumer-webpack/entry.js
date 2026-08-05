// What Next builds, minus Next.
//
// The regression this exists to catch is css-loader's, not React's: webpack
// RESOLVES every `url()` in a stylesheet against the file that declares it and
// fails the build when the target is absent. Vite leaves an unresolvable url()
// alone, so a Vite-only consumer test says nothing about this whole class — and
// that is exactly how 8.0.46 shipped a sheet pointing at
// `./assets/fonts/Geist-Variable.woff2`, a file @hanzo/ui does not ship.
//
// Both sheets, because both are composed from @hanzo/design and either could
// carry an asset reference.
import '@hanzo/ui/styles.css'
import '@hanzo/ui/theme.css'

// The JS too, so module resolution through `exports` is exercised under webpack
// and not only under Vite. dist is already compiled, so no JSX loader is needed.
import { Button, Card, Grid } from '@hanzo/ui'

if (!Button || !Card || !Grid) throw new Error('@hanzo/ui did not resolve under webpack')
