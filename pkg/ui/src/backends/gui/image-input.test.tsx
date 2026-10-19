// @vitest-environment jsdom

/**
 * ImageInput: the preview is the control. Server markup for its shape; a live
 * DOM for picking, dropping, uploading and removing.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { audit } from '../../../test/axe'
import { ImageInput, accepts } from './image-input'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

describe('accepts', () => {
  const png = { type: 'image/png', name: 'logo.PNG' }
  it.each([
    ['image/*', true],
    ['image/png', true],
    ['.png', true],
    ['image/jpeg, .gif', false],
    ['application/pdf', false],
  ] as const)('%s → %s', (accept, ok) => expect(accepts(png, accept)).toBe(ok))
})

describe('ImageInput, server-rendered', () => {
  const tag = (m: string) => m.match(/<button[^>]*data-slot="image-input-preview"[^>]*>/)?.[0] ?? ''

  it('the preview is a 66px button with an 8px corner, on the hover rung', () => {
    const el = tag(renderToStaticMarkup(wrap(<ImageInput title="Logo" />)))
    expect(el).toContain('aria-label="Logo: Upload"')
    expect(el).toMatch(/_width-66px/)
    expect(el).toMatch(/_height-66px/)
    expect(el).toMatch(/_btlr-c-radius-3/)
    expect(el).toMatch(/_bg-hover/)
  })

  it('uploading: the preview is not pressable and Upload becomes Abort', () => {
    const markup = renderToStaticMarkup(wrap(<ImageInput isUploading src="/a.png" />))
    expect(tag(markup)).toContain('disabled=""')
    expect(markup).toContain('Abort')
    expect(markup).not.toContain('>Upload<')
  })

  it('a picture covers the preview, with no hover tint over it', () => {
    const markup = renderToStaticMarkup(wrap(<ImageInput src="/a.png" alt="Acme" />))
    expect(markup).toContain('alt="Acme"')
    expect(tag(markup)).not.toMatch(/_bg-0hover-raised/)
  })
})

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

describe('ImageInput, live', () => {
  let host: HTMLDivElement
  let root: Root
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
  })
  afterEach(() => {
    act(() => root.unmount())
    host.remove()
  })
  const mount = (ui: React.ReactNode) => act(() => root.render(wrap(ui)))
  const file = (name: string, type: string) => new File(['x'], name, { type })

  it('the preview and Upload both open the file picker', () => {
    mount(<ImageInput />)
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    act(() => host.querySelector<HTMLElement>('[data-slot="image-input-preview"]')!.click())
    const upload = [...host.querySelectorAll<HTMLElement>('[data-slot="button"]')].find((b) => b.textContent === 'Upload')!
    act(() => upload.click())
    expect(click).toHaveBeenCalledTimes(2)
    click.mockRestore()
  })

  it('a chosen file reaches onChange; one the accept refuses does not', () => {
    const onChange = vi.fn()
    mount(<ImageInput onChange={onChange} accept="image/*" />)
    const input = host.querySelector<HTMLInputElement>('input[type="file"]')!
    for (const f of [file('a.png', 'image/png'), file('a.pdf', 'application/pdf')]) {
      Object.defineProperty(input, 'files', { value: [f], configurable: true })
      act(() => input.dispatchEvent(new Event('change', { bubbles: true })))
    }
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].name).toBe('a.png')
  })

  it('a file dropped on the preview is taken the same way', () => {
    const onChange = vi.fn()
    mount(<ImageInput onChange={onChange} />)
    const preview = host.querySelector<HTMLElement>('[data-slot="image-input-preview"]')!
    const drop = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [file('b.jpg', 'image/jpeg')] } })
    act(() => preview.dispatchEvent(drop))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('Remove asks the host to clear, and is off with no picture', () => {
    const onRemove = vi.fn()
    mount(<ImageInput onRemove={onRemove} />)
    const remove = () => [...host.querySelectorAll<HTMLButtonElement>('[data-slot="button"]')].find((b) => b.textContent === 'Remove')!
    // gui's Button says disabled in ARIA as well as by the attribute.
    expect(remove().disabled || remove().getAttribute('aria-disabled') === 'true').toBe(true)
    mount(<ImageInput onRemove={onRemove} src="/a.png" alt="" />)
    act(() => remove().click())
    expect(onRemove).toHaveBeenCalled()
  })

  it('passes axe, with a helper and an error', async () => {
    mount(<ImageInput title="Logo" helperText="PNG or JPG, up to 2MB" errorMessage="That file is too large" />)
    expect(await audit(host)).toEqual([])
  })
})
