import '@testing-library/jest-dom'
import { expect, afterEach, vi, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'

// Mock ResizeObserver for chart tests
beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
})

afterEach(() => {
  cleanup()
})
