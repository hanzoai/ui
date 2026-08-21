/**
 * The conversation's decisions load where a value loads.
 *
 * `import('@hanzo/ui/chat')` in Node dies on `SyntaxError: Unexpected token
 * 'typeof'` — it is TSX behind a client directive — so a script, a Playwright
 * spec or a server-side caller could not reach `sends` at all and had to stand
 * up a browser to ask whether Enter sends. This is the door that opens.
 *
 * Proven in a CHILD NODE PROCESS with a bare `require`, exactly as
 * `dist.test.ts` proves it for `product/pure`: vitest has vite's transform
 * already installed, so importing it here would prove nothing about Node.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { pinned, ready, sends } from './pure'

// Up out of `src/chat`, then out of `src` — this file sits one level deeper
// than `dist.test.ts`, and a DIST that does not exist makes `runIf` skip
// silently, which reads exactly like passing.
const DIST = join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), 'dist')
const built = existsSync(join(DIST, 'chat/pure.cjs'))

describe('@hanzo/ui/chat/pure', () => {
  it('is the same rule the component runs, not a copy of it', () => {
    expect(sends('Enter', {})).toBe(true)
    expect(sends('Enter', { isComposing: true })).toBe(false)
    expect(sends('Enter', { keyCode: 229 })).toBe(false)
    expect(sends('Enter', { shiftKey: true })).toBe(false)
    expect(ready('  ')).toBe(false)
    expect(pinned({ offset: 0, viewport: 100, content: 100 })).toBe(true)
    expect(pinned({ offset: 0, viewport: 100, content: 900 })).toBe(false)
  })

  it.runIf(built)('loads under a bare require, with no transform and no DOM', () => {
    const out = execFileSync(
      process.execPath,
      [
        '-e',
        `const p = require(${JSON.stringify(join(DIST, 'chat/pure.cjs'))});
         if (typeof p.sends !== 'function') throw new Error('sends missing');
         if (typeof p.pinned !== 'function') throw new Error('pinned missing');
         if (p.SLACK !== 48) throw new Error('SLACK missing');
         process.stdout.write(String(p.sends('Enter', { isComposing: true })));`,
      ],
      { encoding: 'utf8' },
    )
    expect(out).toBe('false')
  })

  it.runIf(built)('is not stamped as a client module', () => {
    // A stamped module is a client REFERENCE on React's server layer, not a
    // function: calling `sends` through one in a server component throws
    // instead of answering. `postbuild.mjs` keeps these off the stamp list.
    const src = require('node:fs').readFileSync(join(DIST, 'chat/pure.js'), 'utf8')
    expect(src.startsWith("'use client'")).toBe(false)
  })
})
