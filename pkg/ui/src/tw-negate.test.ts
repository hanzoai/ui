import { describe, it, expect } from 'vitest'
import { tw } from './tw'

// A leading `-` has to reach the VALUE when the property is `transform`, because
// every translate class emits that one key — so a test on the property name sees
// `transform` and cannot tell `translate-x` from anything else.
//
// Rendered wrong, `-translate-x-1/2` centres a badge by moving it the width of
// half a card in the WRONG direction: measured +52.6px against an intended
// -50%, a constant offset that grows with the element and walks the label onto
// its neighbour.
describe('a negated transform carries the sign', () => {
  it('negates translateX', () => {
    expect(tw('-translate-x-1/2').props).toEqual({ transform: 'translateX(-50%)' })
  })

  it('negates translateY', () => {
    expect(tw('-translate-y-1/2').props).toEqual({ transform: 'translateY(-50%)' })
  })

  it('leaves the positive form alone', () => {
    expect(tw('translate-x-1/2').props).toEqual({ transform: 'translateX(50%)' })
  })

  it('still negates a plain numeric property', () => {
    expect(tw('-mt-4').props).toEqual({ marginTop: -16 })
  })
})
