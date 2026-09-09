// The wire is the contract between this package and @hanzo/event: whatever
// wireProps returns is what `capture($click, …)` sends, verbatim. These assert the
// heat map's own properties survive it, because a position that stops here is a
// position the warehouse never sees.

import { describe as group, expect, it } from 'vitest'
import { wireProps } from './wire'
import type { Interaction } from './types'

function interaction(props?: Record<string, unknown>): Interaction {
  return {
    kind: 'click',
    name: '$click',
    at: 0,
    semantic: {
      '@context': 'https://schema.org',
      '@type': 'Interaction',
      path: [{ tag: 'nav', role: 'navigation' }],
      target: { tag: 'button', role: 'button' },
      label: 'navigation/button',
    },
    props,
  }
}

group('wireProps', () => {
  it('carries the pointer position onto the wire', () => {
    const p = wireProps(
      interaction({
        $x: 120,
        $y: 340,
        $target_fixed: false,
        $viewport_width: 1440,
        $viewport_height: 900,
      }),
    )
    expect(p).toMatchObject({
      $x: 120,
      $y: 340,
      $target_fixed: false,
      $viewport_width: 1440,
      $viewport_height: 900,
    })
  })

  it('keeps element identity alongside it — a heat map needs both', () => {
    const p = wireProps(interaction({ $x: 1, $y: 2 }))
    expect(p.$el).toBe('navigation/button')
    expect(p.$role).toBe('button')
    expect(p.$x).toBe(1)
  })

  it('sends numbers as numbers, so the warehouse parses rather than guesses', () => {
    const p = wireProps(interaction({ $x: 0, $y: 0, $target_fixed: false }))
    expect(typeof p.$x).toBe('number')
    expect(typeof p.$target_fixed).toBe('boolean')
    // An origin click is a real click: 0 must survive, not read as absent.
    expect(p.$x).toBe(0)
  })

  it('omits the position entirely when there was none', () => {
    const p = wireProps(interaction())
    expect('$x' in p).toBe(false)
  })
})
