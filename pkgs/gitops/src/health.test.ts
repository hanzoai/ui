import { describe, expect, it } from 'vitest'

import {
  foldHealth,
  healthColors,
  healthRank,
  healthSpins,
  HEALTH_PALETTE,
  rollupHealth,
} from './health'
import type { HealthStatus } from './types'

describe('foldHealth', () => {
  it('maps canonical Argo statuses through unchanged, case-insensitively', () => {
    for (const s of ['Healthy', 'Progressing', 'Degraded', 'Suspended', 'Missing', 'Unknown'] as HealthStatus[]) {
      expect(foldHealth(s)).toBe(s)
      expect(foldHealth(s.toLowerCase())).toBe(s)
      expect(foldHealth(s.toUpperCase())).toBe(s)
    }
  })

  it('folds common synonyms', () => {
    expect(foldHealth('running')).toBe('Healthy')
    expect(foldHealth('ok')).toBe('Healthy')
    expect(foldHealth('green')).toBe('Healthy')
    expect(foldHealth('updating')).toBe('Progressing')
    expect(foldHealth('failed')).toBe('Degraded')
    expect(foldHealth('red')).toBe('Degraded')
    expect(foldHealth('paused')).toBe('Suspended')
    expect(foldHealth('absent')).toBe('Missing')
  })

  it('uses a substring fallback for compound strings', () => {
    expect(foldHealth('CrashLoopBackOff (degraded)')).toBe('Degraded')
    expect(foldHealth('deployment progressing…')).toBe('Progressing')
  })

  it('is honestly Unknown for empty/unrecognized input', () => {
    expect(foldHealth('')).toBe('Unknown')
    expect(foldHealth(null)).toBe('Unknown')
    expect(foldHealth(undefined)).toBe('Unknown')
    expect(foldHealth('banana')).toBe('Unknown')
  })
})

describe('health palette + rank', () => {
  it('has an Argo-hue palette entry for every status with a soft rgba chip', () => {
    for (const s of Object.keys(HEALTH_PALETTE) as HealthStatus[]) {
      const p = HEALTH_PALETTE[s]
      expect(p.dot).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(p.soft).toMatch(/^rgba\(/)
    }
    expect(HEALTH_PALETTE.Healthy.dot).toBe('#18BE94')
    expect(HEALTH_PALETTE.Degraded.dot).toBe('#E96D76')
    expect(HEALTH_PALETTE.Missing.dot).toBe('#f4c030')
  })

  it('honors a palette override', () => {
    const override = { Degraded: { dot: '#000', fg: '#000', soft: 'rgba(0,0,0,0.1)' } }
    expect(healthColors('Degraded', override).dot).toBe('#000')
    expect(healthColors('Healthy', override).dot).toBe('#18BE94')
  })

  it('ranks the states that need attention first (Argo HealthPriority)', () => {
    expect(healthRank('Missing')).toBeLessThan(healthRank('Degraded'))
    expect(healthRank('Degraded')).toBeLessThan(healthRank('Healthy'))
    const order = (['Healthy', 'Missing', 'Progressing', 'Degraded'] as HealthStatus[])
      .slice()
      .sort((a, b) => healthRank(a) - healthRank(b))
    expect(order).toEqual(['Missing', 'Degraded', 'Progressing', 'Healthy'])
  })

  it('spins only while Progressing', () => {
    expect(healthSpins('Progressing')).toBe(true)
    expect(healthSpins('Healthy')).toBe(false)
  })
})

describe('rollupHealth', () => {
  it('rolls up to the worst status', () => {
    expect(rollupHealth(['Healthy', 'Healthy', 'Degraded'])).toBe('Degraded')
    expect(rollupHealth(['Healthy', 'Progressing'])).toBe('Progressing')
    expect(rollupHealth(['Healthy', 'Healthy'])).toBe('Healthy')
  })
  it('is Unknown for an empty set', () => {
    expect(rollupHealth([])).toBe('Unknown')
  })
})
