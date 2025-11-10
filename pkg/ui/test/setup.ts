import '@testing-library/jest-dom'
import { expect, afterEach, vi, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'

// Mock ResizeObserver for chart tests
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // Mock document.elementFromPoint for input-otp
  if (typeof document !== 'undefined') {
    Object.defineProperty(document, 'elementFromPoint', {
      writable: true,
      value: vi.fn(() => null)
    })
  }

  // Mock window.matchMedia
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    })
  }
})

afterEach(() => {
  cleanup()
})
