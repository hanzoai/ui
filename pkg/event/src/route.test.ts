import { describe, expect, it } from 'vitest'
import { deviceClassOf, isAuthCallback, routeOf } from './route'

describe('routeOf', () => {
  it('strips ids from a path', () => {
    expect(routeOf('/chat/21bc1d59bd3920767a6dd5b7a4e1c0ff')).toBe('/chat/[id]')
    expect(routeOf('/chat/54b0526d-d98d-475a-92f3-44294c104921')).toBe('/chat/[id]')
    expect(routeOf('/chat/1795213299725255783-000016')).toBe('/chat/[id]')
    expect(routeOf('/orders/12345/items/7')).toBe('/orders/[id]/items/[id]')
    expect(routeOf('/dev/sess_aaaaaaaaaaaaaaaaaaaaaaaa')).toBe('/dev/[id]')
  })
  it('keeps words, drops the query and the trailing slash', () => {
    expect(routeOf('/pricing')).toBe('/pricing')
    expect(routeOf('/pricing/?gclid=G1')).toBe('/pricing')
    expect(routeOf('/')).toBe('/')
    expect(routeOf('/models/zen4-coder')).toBe('/models/zen4-coder')
  })
  it('names the auth callback and nothing else as one', () => {
    expect(isAuthCallback(routeOf('/auth/callback?code=abc&state=xyz'))).toBe(true)
    expect(isAuthCallback('/auth/initiate')).toBe(false)
  })
})

describe('deviceClassOf', () => {
  it('buckets by width', () => {
    expect(deviceClassOf(390)).toBe('mobile')
    expect(deviceClassOf(820)).toBe('tablet')
    expect(deviceClassOf(1440)).toBe('desktop')
  })
})
