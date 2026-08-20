// The anonymous-identity chain is ONE implementation with two call sites, and one
// of them cannot import it: the tag hanzoai/cloud hosts at /v1/event.js has no
// bundler, so it carries the marked region of anon.js VERBATIM. That is the drift
// risk this file exists to remove — snippets that agree the day they are written
// and disagree a quarter later, which is exactly how the same browser came to hold
// two different anonymous ids under two different key names.
//
// The behavioural contract is proven where the chain runs: storage.test.ts. This
// file proves the region is SPLICEABLE and that it ships, which is what lets the
// door vendor it instead of writing a second one.

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

const BEGIN = '/* ── BEGIN hz anon chain'
const END = '/* ── END hz anon chain'

/** Where the shared region starts and ends in a file that carries it. */
function span(src: string, what: string): [number, number] {
  const b = src.indexOf(BEGIN)
  const e = src.indexOf(END)
  expect(b, `${what} has no BEGIN marker`).toBeGreaterThanOrEqual(0)
  expect(e, `${what} has no END marker`).toBeGreaterThan(b)
  return [b, src.indexOf('\n', e) + 1]
}

/** The shared region, markers included. */
const region = (src: string, what: string): string => src.slice(...span(src, what))

const ANON = read('./anon.js')

describe('the shared anon chain', () => {
  it('is marked, so the door can splice exactly it', () => {
    // cloud's tag.go slices between these markers and PANICS if it cannot find
    // them, so losing a marker ships a tag whose every event carries an undefined
    // identity. To change the chain, edit this file; never patch a copy.
    expect(region(ANON, 'anon.js')).toContain(BEGIN)
  })

  it('is inlineable: the region imports nothing and declares no ES6', () => {
    // It is spliced into a file that has no bundler and into pages the client does
    // not control, so it must be ES5, self-contained and hz-prefixed.
    const r = region(ANON, 'anon.js')
    expect(r).not.toMatch(/\b(?:import|export|const|let|class|=>)\b|=>/)
    for (const [, name] of r.matchAll(/^(?:function|var) ([A-Za-z_$][\w$]*)/gm)) {
      expect(name, `${name} would collide in a host page's scope`).toMatch(/^(?:hz|HZ_)/)
    }
  })

  it('ships in the published package, for the door to vendor', () => {
    // hanzoai/cloud vendors this file whole and its tag.go serves the region with
    // the tag as one asset, so the second call site holds no copy of its own.
    const pkg = JSON.parse(read('../package.json')) as { files: string[] }
    expect(pkg.files).toContain('src')
  })
})
