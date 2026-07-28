// The instrumentation contract, proven without a DOM: ONE event name, a closed
// verb set, structured properties, and free text reported as a LENGTH.
//
// The view components that CALL this are proven by the consuming app's build +
// the live browser capture (a real POST to /v1/event from console.hanzo.ai).
// What is provable here — and what actually matters — is the wire shape every
// one of them produces, because that is what the lenses group by.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const tracked: Array<{ event: string; props?: Record<string, unknown> }> = []

vi.mock('@hanzogui/telemetry', () => ({
  EVENTS: { FEATURE_USED: 'feature_used' },
  track: (event: string, props?: Record<string, unknown>) => {
    tracked.push({ event, props })
  },
}))

const { emit, textSize } = await import('./instrument')

beforeEach(() => {
  tracked.length = 0
})

describe('emit', () => {
  it('reports every interaction under the ONE closed event name', () => {
    emit({ component: 'DataTable', action: 'sort', id: 'created' })
    emit({ component: 'PrimaryButton', action: 'click', id: 'Deploy' })
    expect(tracked.map((t) => t.event)).toEqual(['feature_used', 'feature_used'])
  })

  it('carries component + action, which is what a lens groups by', () => {
    emit({ component: 'DataTable', action: 'select', id: 'row-7', value: 42 })
    expect(tracked[0]!.props).toEqual({ component: 'DataTable', action: 'select', id: 'row-7', value: 42 })
  })

  it('omits absent detail rather than sending undefined keys', () => {
    emit({ component: 'ThemeToggle', action: 'change' })
    expect(tracked[0]!.props).toEqual({ component: 'ThemeToggle', action: 'change' })
    expect(Object.keys(tracked[0]!.props!)).not.toContain('id')
    expect(Object.keys(tracked[0]!.props!)).not.toContain('value')
  })

  it('passes the surface through when the app named one', () => {
    emit({ component: 'SlideOver', action: 'open', surface: 'billing' })
    expect(tracked[0]!.props!.surface).toBe('billing')
  })
})

describe('textSize', () => {
  it('reports the SHAPE of typed text, never the text', () => {
    expect(textSize('sk-live-abcdef')).toBe(14)
    expect(textSize('')).toBe(0)
    expect(textSize(undefined)).toBe(0)
  })
})
