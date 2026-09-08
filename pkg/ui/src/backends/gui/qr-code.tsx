'use client'

/**
 * QRCode — a QR Code (ISO/IEC 18004) rendered as inline SVG.
 *
 * The matrix is produced by a from-scratch encoder below: byte-mode data
 * encoding, Reed-Solomon error correction, the standard function patterns
 * (finders, timing, alignment, format and version info) and best-of-eight
 * mask selection by penalty score. No canvas, no third-party QR library —
 * gui has no vector primitive of its own, so the mark is a plain `<svg>`
 * carrying a single `<path>` for every dark module, the same choice
 * `GridPattern` makes.
 */
import * as React from 'react'
import { XStack, type GuiElement } from '@hanzo/gui'
import { slot } from './slot'

export type QRCodeLevel = 'L' | 'M' | 'Q' | 'H'

export type QRCodeImageSettings = {
  src: string
  height: number
  width: number
  excavate?: boolean
  x?: number
  y?: number
}

export type QRCodeProps = React.ComponentProps<'div'> & {
  /** The text or URL to encode. */
  value: string
  /** Rendered pixel size, square. */
  size?: number
  /** Error-correction level: L (~7%), M (~15%), Q (~25%), H (~30%). */
  level?: QRCodeLevel
  bgColor?: string
  fgColor?: string
  /** Adds a 4-module quiet zone around the code. */
  includeMargin?: boolean
  /** An optional logo overlaid at the center. */
  imageSettings?: QRCodeImageSettings
}

// ---- encoder ---------------------------------------------------------

const ECL_BITS: Record<QRCodeLevel, number> = { M: 0, L: 1, H: 2, Q: 3 }

const ECC_CODEWORDS_PER_BLOCK: Record<QRCodeLevel, number[]> = {
  L: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
}

const NUM_ERROR_CORRECTION_BLOCKS: Record<QRCodeLevel, number[]> = {
  L: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
}

const rawDataModules = (ver: number) => {
  let result = (16 * ver + 128) * ver + 64
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2
    result -= (25 * numAlign - 10) * numAlign - 55
    if (ver >= 7) result -= 36
  }
  return result
}

const dataCodewords = (ver: number, ecl: QRCodeLevel) =>
  Math.floor(rawDataModules(ver) / 8) - ECC_CODEWORDS_PER_BLOCK[ecl][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl][ver]

const alignmentPositions = (ver: number): number[] => {
  if (ver === 1) return []
  const numAlign = Math.floor(ver / 7) + 2
  const size = ver * 4 + 17
  const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2
  const result = [6]
  for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos)
  return result
}

class BitBuffer {
  bits: number[] = []
  push(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) this.bits.push((val >>> i) & 1)
  }
  get length() {
    return this.bits.length
  }
}

const buildDataCodewords = (bytes: Uint8Array, ver: number, ecl: QRCodeLevel): number[] => {
  const capacityBytes = dataCodewords(ver, ecl)
  const charCountBits = ver < 10 ? 8 : 16
  const bb = new BitBuffer()
  bb.push(0b0100, 4)
  bb.push(bytes.length, charCountBits)
  for (const b of bytes) bb.push(b, 8)
  const capacityBits = capacityBytes * 8
  const term = Math.max(0, Math.min(4, capacityBits - bb.length))
  if (term > 0) bb.push(0, term)
  while (bb.length % 8 !== 0) bb.bits.push(0)
  const codewords: number[] = []
  for (let i = 0; i < bb.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bb.bits[i + j]
    codewords.push(byte)
  }
  const pad = [0xec, 0x11]
  for (let p = 0; codewords.length < capacityBytes; p++) codewords.push(pad[p % 2])
  return codewords
}

const rsMultiply = (x: number, y: number) => {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z & 0xff
}

const rsDivisor = (degree: number): number[] => {
  const result = new Array(degree).fill(0)
  result[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = rsMultiply(result[j], root)
      if (j + 1 < result.length) result[j] ^= result[j + 1]
    }
    root = rsMultiply(root, 0x02)
  }
  return result
}

const rsRemainder = (data: number[], divisor: number[]): number[] => {
  const result = new Array(divisor.length).fill(0)
  for (const b of data) {
    const factor = b ^ (result.shift() as number)
    result.push(0)
    divisor.forEach((coef, i) => {
      result[i] ^= rsMultiply(coef, factor)
    })
  }
  return result
}

const addEccAndInterleave = (data: number[], ver: number, ecl: QRCodeLevel): number[] => {
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl][ver]
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl][ver]
  const rawCodewords = Math.floor(rawDataModules(ver) / 8)
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks)
  const shortBlockLen = Math.floor(rawCodewords / numBlocks)
  const divisor = rsDivisor(blockEccLen)
  let k = 0
  const blocks: number[][] = []
  for (let i = 0; i < numBlocks; i++) {
    const len = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1)
    const dat = data.slice(k, k + len)
    k += len
    blocks.push(dat.concat(rsRemainder(dat, divisor.slice())))
  }
  const result: number[] = []
  const maxLen = Math.max(...blocks.map((b) => b.length))
  for (let i = 0; i < maxLen; i++) {
    for (let j = 0; j < blocks.length; j++) {
      if ((i !== shortBlockLen - blockEccLen || j >= numShortBlocks) && i < blocks[j].length) result.push(blocks[j][i])
    }
  }
  return result
}

type Matrix = boolean[][]

const drawFormat = (mat: Matrix, size: number, ecl: QRCodeLevel, mask: number) => {
  const data = (ECL_BITS[ecl] << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  const bits = (data << 10) | rem
  const bitsXor = bits ^ 0x5412
  const get = (i: number) => ((bitsXor >>> i) & 1) === 1
  for (let i = 0; i <= 5; i++) mat[i][8] = get(i)
  mat[7][8] = get(6)
  mat[8][8] = get(7)
  mat[8][7] = get(8)
  for (let i = 9; i < 15; i++) mat[8][14 - i] = get(i)
  for (let i = 0; i < 8; i++) mat[8][size - 1 - i] = get(i)
  for (let i = 8; i < 15; i++) mat[size - 15 + i][8] = get(i)
  mat[size - 8][8] = true
}

const drawVersion = (mat: Matrix, size: number, ver: number) => {
  let rem = ver
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
  const bits = (ver << 12) | rem
  const get = (i: number) => ((bits >>> i) & 1) === 1
  for (let i = 0; i < 18; i++) {
    const bit = get(i)
    const a = size - 11 + (i % 3)
    const b = Math.floor(i / 3)
    mat[b][a] = bit
    mat[a][b] = bit
  }
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x, y) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]

const computePenalty = (mat: Matrix, size: number): number => {
  let penalty = 0
  const scoreRun = (line: boolean[]) => {
    let color = line[0]
    let len = 1
    for (let i = 1; i < line.length; i++) {
      if (line[i] === color) len++
      else {
        if (len >= 5) penalty += len - 2
        color = line[i]
        len = 1
      }
    }
    if (len >= 5) penalty += len - 2
  }
  for (let y = 0; y < size; y++) scoreRun(mat[y])
  for (let x = 0; x < size; x++) scoreRun(mat.map((r) => r[x]))
  for (let y = 0; y < size - 1; y++)
    for (let x = 0; x < size - 1; x++) {
      const c = mat[y][x]
      if (c === mat[y][x + 1] && c === mat[y + 1][x] && c === mat[y + 1][x + 1]) penalty += 3
    }
  const patt1 = [true, false, true, true, true, false, true, false, false, false, false]
  const patt2 = [false, false, false, false, true, false, true, true, true, false, true]
  const matchAt = (line: boolean[], i: number, pat: boolean[]) => {
    for (let k = 0; k < pat.length; k++) if (line[i + k] !== pat[k]) return false
    return true
  }
  for (let y = 0; y < size; y++) {
    const row = mat[y]
    for (let x = 0; x + 11 <= size; x++) if (matchAt(row, x, patt1) || matchAt(row, x, patt2)) penalty += 40
  }
  for (let x = 0; x < size; x++) {
    const col = mat.map((r) => r[x])
    for (let y = 0; y + 11 <= size; y++) if (matchAt(col, y, patt1) || matchAt(col, y, patt2)) penalty += 40
  }
  let dark = 0
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (mat[y][x]) dark++
  penalty += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10
  return penalty
}

const buildMatrix = (ver: number, ecl: QRCodeLevel, codewords: number[]): Matrix => {
  const size = ver * 4 + 17
  const modules: Matrix = Array.from({ length: size }, () => Array(size).fill(false))
  const isFn: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))
  const set = (x: number, y: number, dark: boolean) => {
    modules[y][x] = dark
    isFn[y][x] = true
  }
  const drawFinder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx
        const y = cy + dy
        if (x >= 0 && x < size && y >= 0 && y < size) {
          const dist = Math.max(Math.abs(dx), Math.abs(dy))
          set(x, y, dist !== 2 && dist !== 4)
        }
      }
  }
  const drawAlignment = (cx: number, cy: number) => {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
  }

  for (let i = 0; i < size; i++) {
    if (!isFn[6][i]) set(i, 6, i % 2 === 0)
    if (!isFn[i][6]) set(6, i, i % 2 === 0)
  }
  drawFinder(3, 3)
  drawFinder(size - 4, 3)
  drawFinder(3, size - 4)
  const aligns = alignmentPositions(ver)
  for (const ay of aligns)
    for (const ax of aligns) {
      const nearFinder = (ax < 8 && ay < 8) || (ax > size - 9 && ay < 8) || (ax < 8 && ay > size - 9)
      if (!nearFinder) drawAlignment(ax, ay)
    }
  set(8, size - 8, true)
  for (let i = 0; i < 9; i++) if (i !== 6) {
    set(8, i, false)
    set(i, 8, false)
  }
  for (let i = 0; i < 8; i++) {
    set(size - 1 - i, 8, false)
    set(8, size - 1 - i, false)
  }
  if (ver >= 7) {
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3)
      const b = Math.floor(i / 3)
      set(a, b, false)
      set(b, a, false)
    }
  }

  const bits: number[] = []
  for (const cw of codewords) for (let i = 7; i >= 0; i--) bits.push((cw >>> i) & 1)
  let bitIndex = 0
  let upward = true
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++) {
      const y = upward ? size - 1 - vert : vert
      for (let j = 0; j < 2; j++) {
        const x = right - j
        if (!isFn[y][x]) {
          modules[y][x] = bitIndex < bits.length ? bits[bitIndex] === 1 : false
          bitIndex++
        }
      }
    }
    upward = !upward
  }

  const applyMask = (m: number, on: Matrix) => {
    const fn = MASKS[m]
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!isFn[y][x] && fn(x, y)) on[y][x] = !on[y][x]
  }

  let bestMask = 0
  let bestPenalty = Infinity
  for (let m = 0; m < 8; m++) {
    const test = modules.map((row) => row.slice())
    applyMask(m, test)
    const p = computePenalty(test, size)
    if (p < bestPenalty) {
      bestPenalty = p
      bestMask = m
    }
  }
  applyMask(bestMask, modules)
  drawFormat(modules, size, ecl, bestMask)
  if (ver >= 7) drawVersion(modules, size, ver)
  return modules
}

/** Encodes text into a QR module matrix (row-major, `true` = dark). */
export const encodeQr = (text: string, ecl: QRCodeLevel = 'M'): Matrix => {
  let bytes = new TextEncoder().encode(text)
  let ver = 40
  for (let v = 1; v <= 40; v++) {
    const charCountBits = v < 10 ? 8 : 16
    if (4 + charCountBits + bytes.length * 8 <= dataCodewords(v, ecl) * 8) {
      ver = v
      break
    }
  }
  const charCountBits = ver < 10 ? 8 : 16
  const maxBytes = Math.floor((dataCodewords(ver, ecl) * 8 - 4 - charCountBits) / 8)
  if (bytes.length > maxBytes) bytes = bytes.slice(0, Math.max(0, maxBytes))
  const dataCw = buildDataCodewords(bytes, ver, ecl)
  const allCw = addEccAndInterleave(dataCw, ver, ecl)
  return buildMatrix(ver, ecl, allCw)
}

const matrixToPath = (matrix: Matrix, margin: number, excavation?: { x: number; y: number; w: number; h: number }) => {
  let d = ''
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix.length; x++) {
      if (!matrix[y][x]) continue
      if (excavation && x >= excavation.x && x < excavation.x + excavation.w && y >= excavation.y && y < excavation.y + excavation.h) continue
      d += `M${x + margin} ${y + margin}h1v1h-1z`
    }
  }
  return d
}

// ---- component --------------------------------------------------------

export const QRCode = React.forwardRef<GuiElement, QRCodeProps>(
  ({ className, value, size = 256, level = 'M', bgColor = '#FFFFFF', fgColor = '#000000', includeMargin = false, imageSettings, style, ...props }, ref) => {
    const matrix = React.useMemo(() => encodeQr(value, level), [value, level])
    const margin = includeMargin ? 4 : 0
    const cells = matrix.length
    const total = cells + margin * 2
    const scale = total / size

    const excavation =
      imageSettings && imageSettings.excavate
        ? {
            x: Math.floor((imageSettings.x ?? (size - imageSettings.width) / 2) * scale),
            y: Math.floor((imageSettings.y ?? (size - imageSettings.height) / 2) * scale),
            w: Math.ceil(imageSettings.width * scale),
            h: Math.ceil(imageSettings.height * scale),
          }
        : undefined

    const path = React.useMemo(() => matrixToPath(matrix, margin, excavation), [matrix, margin, excavation])

    return (
      <XStack ref={ref} {...slot('qr-code')} display="inline-flex" items="center" justify="center" className={className} style={style} {...(props as object)}>
        <svg {...slot('qr-code-svg')} width={size} height={size} viewBox={`0 0 ${total} ${total}`} role="img" aria-label={value}>
          <rect width={total} height={total} fill={bgColor} />
          <path d={path} fill={fgColor} />
          {imageSettings && (
            <image
              {...slot('qr-code-image')}
              href={imageSettings.src}
              x={(imageSettings.x ?? (size - imageSettings.width) / 2) * scale}
              y={(imageSettings.y ?? (size - imageSettings.height) / 2) * scale}
              width={imageSettings.width * scale}
              height={imageSettings.height * scale}
              preserveAspectRatio="xMidYMid slice"
            />
          )}
        </svg>
      </XStack>
    )
  },
)
QRCode.displayName = 'QRCode'
