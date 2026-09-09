// The library version, stamped on every event (`libraryVersion`) and on the
// Sentry `sdk` block. It lives alone so `sentry.ts` can read it without importing
// `core.ts` — core imports sentry, so the reverse would be an import cycle.
//
// Read from package.json rather than restated, because a version restated is a
// version that drifts: 0.3.38 and 0.3.39 both shipped while this file still said
// 0.3.37, so every event those builds sent named a library that was two releases
// behind. `resolveJsonModule` inlines the literal at build time, and tsup shakes
// the rest of the manifest out.
import { version } from '../package.json'

export const VERSION: string = version
