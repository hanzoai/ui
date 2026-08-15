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

/**
 * DOM attributes a gui Stack does not take. An element using one is a DOM
 * element doing a DOM thing — dragging, a native tooltip — and it stays one.
 */
const DOM_ONLY = new Set([
  'draggable', 'onDragStart', 'onDragEnd', 'onDragOver', 'onDrop', 'onDragEnter',
  'onDragLeave', 'title', 'onFocusCapture', 'onBlurCapture', 'contentEditable',
  'spellCheck', 'tabIndex', 'dangerouslySetInnerHTML',
])

const files = []
;(function walk(d) {
  for (const e of readdirSync(d)) {
    if (e === 'node_modules' || e === 'dist' || e === 'build' || e.startsWith('.')) continue
    const p = join(d, e)
    if (statSync(p).isDirectory()) walk(p)
    else if (['.tsx', '.jsx'].includes(extname(p))) files.push(p)
  }
})(dir)

let moved = 0, held = 0, touched = 0, semantic = 0, skipped = 0
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
      const domOnly = open.attributes.properties.some(
        (a) => ts.isJsxAttribute(a) && DOM_ONLY.has(a.name.getText()),
      )
      const lit = attr?.initializer
      if (lit && ts.isStringLiteral(lit) && !domOnly) {
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
  const added = addImport(src, sf)
  if (added === null) { skipped++; continue }
  let out = added.text
  // The import is inserted before the JSX, so every edit after that point moves
  // by its length. Applied back-to-front, so an earlier edit's offsets survive.
  const shift = added.text.length - src.length
  for (const [a, b, text] of edits.sort((x, y) => y[0] - x[0])) {
    const [i, j] = a >= added.at ? [a + shift, b + shift] : [a, b]
    out = out.slice(0, i) + text + out.slice(j)
  }
  touched++
  if (write) writeFileSync(f, out)
}

/**
 * One import of Box. Returns null when the file already binds that name to
 * something else — a second binding is a syntax error, and guessing which one
 * the JSX meant is not this script's call.
 */
function addImport(s, sf) {
  let last = 0
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st)) {
      last = st.getEnd()
      const named = st.importClause?.namedBindings
      if (named && ts.isNamedImports(named)) {
        for (const el of named.elements) {
          if (el.name.text !== 'Box') continue
          // Already imported from @hanzo/ui: nothing to add. From anywhere
          // else: leave the file alone.
          return st.moduleSpecifier.getText().includes('@hanzo/ui')
            ? { text: s, at: s.length } : null
        }
      }
    }
  }
  // A local declaration of the same name collides just as hard as an import.
  for (const st of sf.statements) {
    if (ts.isVariableStatement(st) &&
        st.declarationList.declarations.some((d) => d.name.getText() === 'Box')) return null
    if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) && st.name?.text === 'Box') return null
  }
  return { at: last, text: s.slice(0, last) + `\nimport { Box } from '@hanzo/ui'` + s.slice(last) }
}

console.log(`  files scanned  : ${files.length}`)
console.log(`  files changed  : ${touched}`)
console.log(`  tags moved     : ${moved}`)
console.log(`  kept semantic  : ${semantic}   (section/header/nav — the tag is the meaning)`)
console.log(`  skipped        : ${skipped}   (the file already binds the name Box)`)
console.log(`  held back      : ${held}   (a class tw cannot read yet)`)
if (holding.size) {
  console.log(`  what holds them, most common first:`)
  ;[...holding].sort((a, b) => b[1] - a[1]).slice(0, 12)
    .forEach(([c, n]) => console.log(`    ${String(n).padStart(5)}  ${c}`))
}
if (!write) console.log(`\n  nothing written — pass --write`)
