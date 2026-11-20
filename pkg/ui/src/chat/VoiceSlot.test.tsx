// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'

import { VoiceSlot } from './VoiceSlot'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

const voice = { state: 'idle', open: false, level: 0, blocked: null, reason: null, refusal: null, toggle: () => {} } as const

describe('VoiceSlot', () => {
  it('does not hand the gui press handler to the native button', () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const host = document.createElement('div')
    const root = createRoot(host)
    act(() => root.render(<VoiceSlot voice={voice} onPress={() => {}} />))
    expect(host.querySelector('button')).not.toBeNull()
    expect(error.mock.calls.flat().join(' ')).not.toContain('onPress')
    act(() => root.unmount())
    error.mockRestore()
  })
})
