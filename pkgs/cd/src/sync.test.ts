import { describe, expect, it } from 'vitest'

import { foldSync, syncColors, syncRank, syncSpins, SYNC_PALETTE, rollupSync } from './sync'
import type { SyncStatus } from './types'

describe('foldSync', () => {
  it('maps canonical statuses through, tolerant of case and spacing', () => {
    expect(foldSync('Synced')).toBe('Synced')
    expect(foldSync('OutOfSync')).toBe('OutOfSync')
    expect(foldSync('out of sync')).toBe('OutOfSync')
    expect(foldSync('OUT OF SYNC')).toBe('OutOfSync')
    expect(foldSync('Unknown')).toBe('Unknown')
  })

  it('folds synonyms and substrings', () => {
    expect(foldSync('in-sync')).toBe('Synced')
    expect(foldSync('up-to-date')).toBe('Synced')
    expect(foldSync('drifted')).toBe('OutOfSync')
    expect(foldSync('diverged from desired')).toBe('OutOfSync')
  })

  it('is honestly Unknown for empty/unrecognized input', () => {
    expect(foldSync('')).toBe('Unknown')
    expect(foldSync(null)).toBe('Unknown')
    expect(foldSync('banana')).toBe('Unknown')
  })
})

describe('sync palette + rank', () => {
  it('has Argo hues with soft rgba chips', () => {
    expect(SYNC_PALETTE.Synced.dot).toBe('#18BE94')
    expect(SYNC_PALETTE.OutOfSync.dot).toBe('#f4c030')
    for (const s of Object.keys(SYNC_PALETTE) as SyncStatus[]) {
      expect(SYNC_PALETTE[s].soft).toMatch(/^rgba\(/)
    }
  })

  it('honors an override', () => {
    const override = { OutOfSync: { dot: '#111', fg: '#111', soft: 'rgba(0,0,0,0.2)' } }
    expect(syncColors('OutOfSync', override).dot).toBe('#111')
    expect(syncColors('Synced', override).dot).toBe('#18BE94')
  })

  it('ranks OutOfSync ahead of Synced', () => {
    expect(syncRank('OutOfSync')).toBeLessThan(syncRank('Synced'))
  })

  it('spins only while Unknown', () => {
    expect(syncSpins('Unknown')).toBe(true)
    expect(syncSpins('Synced')).toBe(false)
  })
})

describe('rollupSync', () => {
  it('any drift makes the app OutOfSync', () => {
    expect(rollupSync(['Synced', 'Synced', 'OutOfSync'])).toBe('OutOfSync')
    expect(rollupSync(['Synced', 'Synced'])).toBe('Synced')
    expect(rollupSync([])).toBe('Unknown')
  })
})
