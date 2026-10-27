import { describe, it, expect } from 'vitest'
import { VERSION } from '../src'
import pkg from '../package.json'

describe('VERSION', () => {
  it('matches package.json version', () => {
    expect(VERSION).toBe(pkg.version)
  })
})
