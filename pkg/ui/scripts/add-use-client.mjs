// Prepend `'use client';` to every compiled JS/CJS file in dist.
//
// The whole library is client-side @hanzo/gui (Tamagui) UI that uses React hooks, so
// every module is a client module. tsup's `banner` is unreliable with code splitting
// (it misses chunks), and Next's flight-client loader needs the directive to be the
// FIRST statement — so we stamp it deterministically here, post-build.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIST = new URL('../dist/', import.meta.url).pathname
const DIRECTIVE = "'use client';\n"

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      walk(p)
    } else if (/\.(c?js|mjs)$/.test(name)) {
      const src = readFileSync(p, 'utf8')
      if (!/^['"]use client['"]/.test(src)) writeFileSync(p, DIRECTIVE + src)
    }
  }
}

walk(DIST)
console.log("stamped 'use client' across dist")
