#!/usr/bin/env node
/**
 * Rewrites `<div className="…">` to `<Box className="…">` so an app's utility
 * classes are read by gui instead of by a utility engine's stylesheet.
 *
 * It only ever changes the TAG NAME. The classes are left exactly as written,
 * so the diff is reviewable line by line and nothing about what an element says
 * it wants has been reinterpreted by a script.
 *
 * A tag moves only when `tw` can read EVERY class on it. One class it does not
 * know means that element still depends on a rule from the old engine, and
 * moving it would change how it renders — so it is left, and counted, and the
 * report says which classes are holding the most elements back.
 *
 * It parses with TypeScript rather than matching text. A regex cannot tell an
 * opening tag from the same characters inside a string or a comment, and cannot
 * pair an opener with its own closer through nesting — and a mis-paired closer
 * still compiles.
 *
 *   node detag.mjs <dir> [--write]
 *
 * Without `--write` nothing is touched.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { createRequire } from 'node:module'
import { tw } from '../dist/tw.js'

const ts = createRequire(import.meta.url)('typescript')

const [dir, ...flags] = process.argv.slice(2)
const write = flags.includes('--write')
if (!dir) { console.error('usage: detag.mjs <dir> [--write]'); process.exit(2) }

/** Tags a Box replaces: a plain box carrying no semantics of its own. */
const TAGS = new Set(['div', 'section', 'article', 'main', 'header', 'footer', 'aside', 'nav'])

const files = []
;(function walk(d) {
  for (const e of readdirSync(d)) {
    if (e === 'node_modules' || e === 'dist' || e === 'build' || e.startsWith('.')) continue
    const p = join(d, e)
    if (statSync(p).isDirectory()) walk(p)
    else if (['.tsx', '.jsx'].includes(extname(p))) files.push(p)
  }
})(dir)

let moved = 0, held = 0, touched = 0, semantic = 0
const holding = new Map()

for (const f of files) {
  const src = readFileSync(f, 'utf8')
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits = []

  const visit = (node) => {
    const open = ts.isJsxElement(node) ? node.openingElement
      : ts.isJsxSelfClosingElement(node) ? node : null

    if (open && ts.isIdentifier(open.tagName) && TAGS.has(open.tagName.text)) {
      const attr = open.attributes.properties.find(
        (a) => ts.isJsxAttribute(a) && a.name.getText() === 'className',
      )
      // Only a literal className is knowable here. An expression may compose
      // classes at run time and is left for a person.
      const lit = attr?.initializer
      if (lit && ts.isStringLiteral(lit)) {
        const { rest } = tw(lit.text)
        if (rest === '') {
          // A tag carrying its own meaning stays that tag; a screen reader and
          // the document outline read it, and `div` says none of that.
          if (open.tagName.text !== 'div') { semantic++ }
          else {
            edits.push([open.tagName.getStart(sf), open.tagName.getEnd(), 'Box'])
            if (ts.isJsxElement(node)) {
              const c = node.closingElement.tagName
              edits.push([c.getStart(sf), c.getEnd(), 'Box'])
            }
            moved++
          }
        } else {
          held++
          for (const c of rest.split(' ')) holding.set(c, (holding.get(c) ?? 0) + 1)
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)

  if (!edits.length) continue
  let out = src
  for (const [a, b, text] of edits.sort((x, y) => y[0] - x[0])) {
    out = out.slice(0, a) + text + out.slice(b)
  }
  out = addImport(out)
  touched++
  if (write) writeFileSync(f, out)
}

/** One import of Box, merged into an existing `@hanzo/ui` import if there is one. */
function addImport(s) {
  const existing = /import \{([^}]*)\} from (['"])@hanzo\/ui\2/.exec(s)
  if (existing) {
    if (/\bBox\b/.test(existing[1])) return s
    return s.replace(existing[0], `import {${existing[1].trimEnd()}, Box } from ${existing[2]}@hanzo/ui${existing[2]}`)
  }
  const last = [...s.matchAll(/^import .*$/gm)].pop()
  const line = `import { Box } from '@hanzo/ui'`
  if (!last) return `${line}\n${s}`
  const at = last.index + last[0].length
  return s.slice(0, at) + `\n${line}` + s.slice(at)
}

console.log(`  files scanned  : ${files.length}`)
console.log(`  files changed  : ${touched}`)
console.log(`  tags moved     : ${moved}`)
console.log(`  kept semantic  : ${semantic}   (section/header/nav — the tag is the meaning)`)
console.log(`  held back      : ${held}   (a class tw cannot read yet)`)
if (holding.size) {
  console.log(`  what holds them, most common first:`)
  ;[...holding].sort((a, b) => b[1] - a[1]).slice(0, 12)
    .forEach(([c, n]) => console.log(`    ${String(n).padStart(5)}  ${c}`))
}
if (!write) console.log(`\n  nothing written — pass --write`)
