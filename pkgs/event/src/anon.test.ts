// The anonymous-identity chain is ONE implementation with three call sites, and
// two of them cannot import it: hz.js and the tag hanzoai/cloud hosts at
// /v1/event.js have no bundler, so they carry the marked region of anon.js
// VERBATIM. That is the drift risk this file exists to remove — three snippets
// that agree the day they are written and disagree a quarter later, which is
// exactly how the same browser came to hold two different anonymous ids under two
// different key names.
//
// The behavioural contract is proven where each distribution runs it:
// storage.test.ts (the npm client) and hz.test.ts (the script tag). This file
// proves the copies are the SAME TEXT, which is the only thing that keeps those
// two suites testing one implementation instead of two.

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

/** Everything that is NOT the shared region. */
function outside(src: string, what: string): string {
  const [b, e] = span(src, what)
  return src.slice(0, b) + src.slice(e)
}

const ANON = read('./anon.js')
const HZ = read('../hz.js')

describe('the shared anon chain', () => {
  it('is in hz.js as the same text, byte for byte', () => {
    // Not "equivalent" — IDENTICAL. Anything weaker (normalising whitespace,
    // comparing behaviour) permits the copies to say different things about which
    // key they read, which is the bug. To change the chain, edit src/anon.js and
    // re-splice; never patch a copy.
    expect(region(HZ, 'hz.js')).toBe(region(ANON, 'anon.js'))
  })

  it('names one key, and hz.js holds no identity code of its own', () => {
    // hz.js used to mint into hz_id — a second identity space, so the one-paste
    // tag and the npm client were two people on one page. Neither key may be
    // NAMED outside the shared region: a snippet that spells a key is a snippet
    // that has an opinion about identity, and there is one opinion now.
    const rest = outside(HZ, 'hz.js')
    expect(rest).not.toContain("'hz_anon_id'")
    expect(rest).not.toContain("'hz_id'")
  })

  it('is inlineable: the region imports nothing and declares no ES6', () => {
    // It is spliced into two files that have no bundler and into pages the client
    // does not control, so it must be ES5, self-contained and hz-prefixed.
    const r = region(ANON, 'anon.js')
    expect(r).not.toMatch(/\b(?:import|export|const|let|class|=>)\b|=>/)
    for (const [, name] of r.matchAll(/^(?:function|var) ([A-Za-z_$][\w$]*)/gm)) {
      expect(name, `${name} would collide in a host page's scope`).toMatch(/^(?:hz|HZ_)/)
    }
  })

  it('ships in the published package, for the door to vendor', () => {
    // hanzoai/cloud vendors this file whole and its tag.go serves the region with
    // the tag as one asset, so the third call site holds no second copy either.
    const pkg = JSON.parse(read('../package.json')) as { files: string[] }
    expect(pkg.files).toContain('src')
    expect(pkg.files).toContain('hz.js')
  })
})
