/**
 * The file tree's shape and keys, without a browser.
 *
 * The cases are the ones a screenshot cannot show: a folder with one child, a
 * file beside a folder at the root, two paths that agree for three segments, a
 * lazily-read folder that has not arrived, and every WAI-ARIA tree key.
 */
import { describe, expect, it } from 'vitest'

import { ancestors, base, dir, filter, group, language, put, rows, sort, step } from './tree'

const FILES = ['src/app.tsx', 'README.md', 'src/lib/a.ts', 'src/lib/b.ts', 'package.json', 'src/index.ts']

describe('group', () => {
  it('builds every implied folder, folders before files, names in order', () => {
    const l = group(FILES)
    expect(l.get('')!.map((e) => e.path)).toEqual(['src', 'package.json', 'README.md'])
    expect(l.get('src')!.map((e) => e.path)).toEqual(['src/lib', 'src/app.tsx', 'src/index.ts'])
    expect(l.get('src/lib')!.map((e) => e.path)).toEqual(['src/lib/a.ts', 'src/lib/b.ts'])
  })

  it('collapses duplicates and empty segments', () => {
    const l = group(['a//b.ts', '/a/b.ts', 'a/b.ts'])
    expect(l.get('')).toEqual([{ path: 'a', kind: 'dir' }])
    expect(l.get('a')).toEqual([{ path: 'a/b.ts', kind: 'file' }])
  })

  it('sorts numbers as numbers', () => {
    expect(sort([{ path: 'p10', kind: 'file' }, { path: 'p9', kind: 'file' }]).map((e) => e.path)).toEqual(['p9', 'p10'])
  })
})

describe('rows', () => {
  it('walks only the open folders, with depth and parent', () => {
    const l = group(FILES)
    expect(rows(l, new Set()).map((r) => r.path)).toEqual(['src', 'package.json', 'README.md'])
    const open = rows(l, new Set(['src', 'src/lib']))
    expect(open.map((r) => [r.path, r.depth, r.parent])).toEqual([
      ['src', 0, ''],
      ['src/lib', 1, 'src'],
      ['src/lib/a.ts', 2, 'src/lib'],
      ['src/lib/b.ts', 2, 'src/lib'],
      ['src/app.tsx', 1, 'src'],
      ['src/index.ts', 1, 'src'],
      ['package.json', 0, ''],
      ['README.md', 0, ''],
    ])
  })

  it('draws nothing under an open folder that has not been read', () => {
    const l = put(new Map(), '', [{ path: 'src', kind: 'dir' }])
    expect(rows(l, new Set(['src'])).map((r) => r.path)).toEqual(['src'])
    const read = put(l, 'src', [{ path: 'src/x.ts', kind: 'file' }])
    expect(rows(read, new Set(['src'])).map((r) => r.path)).toEqual(['src', 'src/x.ts'])
  })
})

describe('paths', () => {
  it('names the folders above a file', () => {
    expect(ancestors('src/components/Header.tsx')).toEqual(['src', 'src/components'])
    expect(ancestors('README.md')).toEqual([])
  })

  it('splits a path into its folder and its name', () => {
    expect(base('src/lib/a.ts')).toBe('a.ts')
    expect(dir('src/lib/a.ts')).toBe('src/lib')
    expect(dir('a.ts')).toBe('')
  })

  it('filters by substring, case-insensitively, never as a pattern', () => {
    expect(filter(FILES, 'LIB')).toEqual(['src/lib/a.ts', 'src/lib/b.ts'])
    expect(filter(FILES, '.*')).toEqual([])
    expect(filter(FILES, '  ')).toEqual(FILES)
  })

  it('names the language by extension, and says plaintext when it does not know', () => {
    expect(language('a/b.tsx')).toBe('typescript')
    expect(language('Dockerfile')).toBe('shell')
    expect(language('notes')).toBe('plaintext')
    expect(language('x.weird')).toBe('plaintext')
  })
})

describe('step — the tree keys', () => {
  const list = rows(group(FILES), new Set(['src']))
  // src, src/lib, src/app.tsx, src/index.ts, package.json, README.md

  it('moves with Up, Down, Home and End, and stops at the ends', () => {
    expect(step(list, 0, 'ArrowDown')).toEqual({ focus: 1 })
    expect(step(list, 0, 'ArrowUp')).toEqual({ focus: 0 })
    expect(step(list, 5, 'ArrowDown')).toEqual({ focus: 5 })
    expect(step(list, 3, 'Home')).toEqual({ focus: 0 })
    expect(step(list, 0, 'End')).toEqual({ focus: 5 })
  })

  it('opens a closed folder on Right, and steps into an open one', () => {
    expect(step(list, 1, 'ArrowRight')).toEqual({ focus: 1, toggle: 'src/lib' })
    expect(step(list, 0, 'ArrowRight')).toEqual({ focus: 1 })
  })

  it('closes an open folder on Left, and steps out to the parent otherwise', () => {
    expect(step(list, 0, 'ArrowLeft')).toEqual({ focus: 0, toggle: 'src' })
    expect(step(list, 2, 'ArrowLeft')).toEqual({ focus: 0 })
  })

  it('picks a file and toggles a folder on Enter and Space', () => {
    expect(step(list, 2, 'Enter')).toEqual({ focus: 2, pick: 'src/app.tsx' })
    expect(step(list, 1, ' ')).toEqual({ focus: 1, toggle: 'src/lib' })
  })

  it('leaves every other key to the browser', () => {
    expect(step(list, 0, 'a')).toBeNull()
    expect(step([], 0, 'ArrowDown')).toBeNull()
  })
})
