// @vitest-environment jsdom

/**
 * QRCode is asserted two ways: `encodeQr` directly against the ISO 18004
 * structural invariants a matrix must hold (size formula, finder patterns,
 * a lone dark module, a value that changes the matrix), and the component
 * against the rendered markup for its `data-slot`s and pixel sizing.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { QRCode, encodeQr } from './qr-code'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

describe('encodeQr', () => {
  it('produces a square matrix sized by the version formula (4*ver+17)', () => {
    const matrix = encodeQr('hi', 'M')
    const size = matrix.length
    expect(matrix.every((row) => row.length === size)).toBe(true)
    expect((size - 17) % 4).toBe(0)
  })

  it('always sets the three finder patterns dark at their centers', () => {
    const matrix = encodeQr('https://hanzo.ai', 'M')
    const size = matrix.length
    expect(matrix[3][3]).toBe(true)
    expect(matrix[3][size - 4]).toBe(true)
    expect(matrix[size - 4][3]).toBe(true)
  })

  it('sets the dark module that is always black', () => {
    const matrix = encodeQr('anything', 'M')
    const size = matrix.length
    expect(matrix[size - 8][8]).toBe(true)
  })

  it('grows the matrix for longer input', () => {
    const short = encodeQr('a', 'M')
    const long = encodeQr('a'.repeat(200), 'M')
    expect(long.length).toBeGreaterThan(short.length)
  })

  it('produces a different matrix for a different value', () => {
    const a = encodeQr('hello world', 'M')
    const b = encodeQr('goodbye world', 'M')
    // Pad the shorter to compare only when sizes match; otherwise they already differ.
    if (a.length !== b.length) {
      expect(a.length).not.toBe(b.length)
    } else {
      const flat = (m: boolean[][]) => m.flat().join('')
      expect(flat(a)).not.toBe(flat(b))
    }
  })

  it('a higher error-correction level uses no fewer error-correction codewords, so it needs at least as large a version for the same data', () => {
    const value = 'https://ui.hanzo.ai/components/qr-code'
    const low = encodeQr(value, 'L')
    const high = encodeQr(value, 'H')
    expect(high.length).toBeGreaterThanOrEqual(low.length)
  })
})

describe('QRCode', () => {
  it('renders an svg sized to the `size` prop', () => {
    const markup = html(<QRCode value="https://hanzo.ai" size={180} />)
    expect(markup).toContain('data-slot="qr-code"')
    expect(markup).toMatch(/data-slot="qr-code-svg"[^>]*width="180"[^>]*height="180"/)
  })

  it('grows the viewBox when a margin is requested', () => {
    const bare = html(<QRCode value="x" includeMargin={false} />)
    const withMargin = html(<QRCode value="x" includeMargin />)
    const viewBox = (markup: string) => markup.match(/viewBox="0 0 (\d+) \1"/)?.[1]
    expect(Number(viewBox(withMargin))).toBe(Number(viewBox(bare)) + 8)
  })

  it('paints the requested foreground and background colors', () => {
    const markup = html(<QRCode value="colors" fgColor="#112233" bgColor="#eeddcc" />)
    expect(markup).toContain('fill="#eeddcc"')
    expect(markup).toContain('fill="#112233"')
  })

  it('overlays an image when imageSettings is given', () => {
    const markup = html(<QRCode value="logo" imageSettings={{ src: 'data:image/png;base64,AA', height: 40, width: 40, excavate: true }} />)
    expect(markup).toContain('data-slot="qr-code-image"')
    expect(markup).toContain('data:image/png;base64,AA')
  })

  it('produces different path data for different values', () => {
    const pathOf = (markup: string) => markup.match(/<path d="([^"]*)"/)?.[1]
    const a = pathOf(html(<QRCode value="one" />))
    const b = pathOf(html(<QRCode value="two" />))
    expect(a).not.toBe(b)
    expect(a?.length).toBeGreaterThan(0)
  })
})
