import { describe as group, expect, it, vi } from 'vitest'
import { Stream } from './stream'

group('Stream', () => {
  it('delivers emitted values to subscribers and retains a snapshot', () => {
    const s = new Stream<number>()
    const seen: number[] = []
    const off = s.subscribe((n) => seen.push(n))
    s.emit(1)
    s.emit(2)
    expect(seen).toEqual([1, 2])
    expect(s.buffer()).toEqual([1, 2])
    off()
    s.emit(3)
    expect(seen).toEqual([1, 2]) // unsubscribed
    expect(s.buffer()).toEqual([1, 2, 3]) // buffer keeps recording
  })

  it('bounds the retained buffer to its capacity (ring)', () => {
    const s = new Stream<number>(3)
    for (let i = 0; i < 10; i++) s.emit(i)
    expect(s.buffer()).toEqual([7, 8, 9])
  })

  it('is fail-soft: one throwing subscriber does not break the others or emit', () => {
    const s = new Stream<number>()
    const ok = vi.fn()
    s.subscribe(() => {
      throw new Error('boom')
    })
    s.subscribe(ok)
    expect(() => s.emit(1)).not.toThrow()
    expect(ok).toHaveBeenCalledWith(1)
  })

  it('clear drops history', () => {
    const s = new Stream<number>()
    s.emit(1)
    s.clear()
    expect(s.buffer()).toEqual([])
  })
})
