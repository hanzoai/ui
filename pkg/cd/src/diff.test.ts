import { describe, expect, it } from 'vitest'

import { classifyDiff, diffStats, lineDiff } from './diff'

describe('classifyDiff', () => {
  const unified = [
    'diff --git a/deploy.yaml b/deploy.yaml',
    'index 111..222 100644',
    '--- a/deploy.yaml',
    '+++ b/deploy.yaml',
    '@@ -1,4 +1,4 @@',
    ' apiVersion: apps/v1',
    ' kind: Deployment',
    '-  replicas: 2',
    '+  replicas: 3',
    ' spec: {}',
  ].join('\n')

  it('classifies every line and tracks numbering from the hunk header', () => {
    const lines = classifyDiff(unified)
    expect(lines.find((l) => l.text.includes('git'))!.type).toBe('meta')
    expect(lines.find((l) => l.type === 'hunk')!.text).toContain('@@')
    const del = lines.find((l) => l.type === 'del')!
    const add = lines.find((l) => l.type === 'add')!
    expect(del.text).toBe('  replicas: 2')
    expect(add.text).toBe('  replicas: 3')
    // context before the change starts at old line 1 / new line 1.
    const firstContext = lines.find((l) => l.type === 'context')!
    expect(firstContext.oldLine).toBe(1)
    expect(firstContext.newLine).toBe(1)
    // the deletion sits at old line 3, the addition at new line 3.
    expect(del.oldLine).toBe(3)
    expect(add.newLine).toBe(3)
  })

  it('counts additions and deletions', () => {
    expect(diffStats(classifyDiff(unified))).toEqual({ additions: 1, deletions: 1 })
  })

  it('is empty for empty input', () => {
    expect(classifyDiff('')).toEqual([])
  })
})

describe('lineDiff', () => {
  it('marks shared lines context, live-only del, desired-only add', () => {
    const live = 'a\nb\nc'
    const desired = 'a\nB\nc\nd'
    const lines = lineDiff(live, desired)
    const compact = lines.map((l) => `${l.type}:${l.text}`)
    expect(compact).toEqual(['context:a', 'del:b', 'add:B', 'context:c', 'add:d'])
    expect(diffStats(lines)).toEqual({ additions: 2, deletions: 1 })
  })

  it('an unchanged manifest is all context', () => {
    const same = 'x\ny\nz'
    const lines = lineDiff(same, same)
    expect(lines.every((l) => l.type === 'context')).toBe(true)
    expect(diffStats(lines)).toEqual({ additions: 0, deletions: 0 })
  })

  it('numbers old and new lines independently', () => {
    const lines = lineDiff('a\nb\nc', 'a\nB\nc\nd')
    const add = lines.filter((l) => l.type === 'add')
    const del = lines.filter((l) => l.type === 'del')
    expect(del[0].oldLine).toBe(2)
    expect(add[0].newLine).toBe(2)
    expect(add[1].newLine).toBe(4)
  })
})
