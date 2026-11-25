/**
 * Pure, zero-dependency CSS color -> 6/8-digit Hex converter (`#rrggbb` / `#rrggbbaa`).
 *
 * Supports `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, `hsla()`,
 * and `oklch()` (all built-in Hanzo Dev palettes use hex and `oklch(...)`), ensuring
 * VS Code `workbench.colorCustomizations` and Monaco `defineTheme` always receive
 * strict `#rrggbb` / `#rrggbbaa` hex strings.
 */

export interface Rgba {
  readonly r: number
  readonly g: number
  readonly b: number
  readonly a: number
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function toHexByte(n: number): string {
  return clampByte(n).toString(16).padStart(2, "0")
}

function linearToSrgb(c: number): number {
  const clamped = clamp01(c)
  return clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055
}

function srgbToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function parseAlpha(raw: string | undefined): number {
  if (!raw) return 1
  const trimmed = raw.trim()
  if (trimmed.endsWith("%")) {
    return clamp01(parseFloat(trimmed) / 100)
  }
  const parsed = parseFloat(trimmed)
  return Number.isFinite(parsed) ? clamp01(parsed) : 1
}

/** Parse `#hex`, `rgb()`, `hsl()`, or `oklch()` into 0..255 sRGB + 0..1 alpha. */
export function parseCssColorToRgba(input: string): Rgba | null {
  const s = input.trim().toLowerCase()
  if (!s) return null

  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s)
  if (hexMatch) {
    const h = hexMatch[1]
    if (h.length === 3 || h.length === 4) {
      const r = parseInt(h[0] + h[0], 16)
      const g = parseInt(h[1] + h[1], 16)
      const b = parseInt(h[2] + h[2], 16)
      const a = h.length === 4 ? parseInt(h[3] + h[3], 16) / 255 : 1
      return { r, g, b, a }
    }
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
    return { r, g, b, a }
  }

  const fnMatch = /^(rgba?|hsla?|oklch)\(([^)]+)\)$/.exec(s)
  if (!fnMatch) return null
  const fn = fnMatch[1]
  const body = fnMatch[2].trim()
  const slashSplit = body.split("/")
  const coords = slashSplit[0]
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
  const explicitAlpha = slashSplit[1] !== undefined ? parseAlpha(slashSplit[1]) : undefined

  if (fn === "rgb" || fn === "rgba") {
    if (coords.length < 3) return null
    const chan = (raw: string) =>
      raw.endsWith("%") ? (parseFloat(raw) / 100) * 255 : parseFloat(raw)
    const r = chan(coords[0])
    const g = chan(coords[1])
    const b = chan(coords[2])
    const a = explicitAlpha ?? (coords[3] !== undefined ? parseAlpha(coords[3]) : 1)
    if (![r, g, b].every(Number.isFinite)) return null
    return { r: clampByte(r), g: clampByte(g), b: clampByte(b), a }
  }

  if (fn === "hsl" || fn === "hsla") {
    if (coords.length < 3) return null
    const hRaw = parseFloat(coords[0])
    const sat = parseFloat(coords[1]) / 100
    const light = parseFloat(coords[2]) / 100
    const a = explicitAlpha ?? (coords[3] !== undefined ? parseAlpha(coords[3]) : 1)
    if (![hRaw, sat, light].every(Number.isFinite)) return null
    const h = (((hRaw % 360) + 360) % 360) / 360
    const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat
    const p = 2 * light - q
    const hue2rgb = (t: number) => {
      let tt = t
      if (tt < 0) tt += 1
      if (tt > 1) tt -= 1
      if (tt < 1 / 6) return p + (q - p) * 6 * tt
      if (tt < 1 / 2) return q
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
      return p
    }
    return {
      r: clampByte(hue2rgb(h + 1 / 3) * 255),
      g: clampByte(hue2rgb(h) * 255),
      b: clampByte(hue2rgb(h - 1 / 3) * 255),
      a,
    }
  }

  if (fn === "oklch") {
    if (coords.length < 3) return null
    const L = coords[0].endsWith("%") ? parseFloat(coords[0]) / 100 : parseFloat(coords[0])
    const C = coords[1].endsWith("%") ? (parseFloat(coords[1]) / 100) * 0.4 : parseFloat(coords[1])
    const hDeg = coords[2] === "none" ? 0 : parseFloat(coords[2])
    const a = explicitAlpha ?? (coords[3] !== undefined ? parseAlpha(coords[3]) : 1)
    if (![L, C, hDeg].every(Number.isFinite)) return null

    const hRad = (hDeg * Math.PI) / 180
    const aLab = C * Math.cos(hRad)
    const bLab = C * Math.sin(hRad)

    const l_ = L + 0.3963377774 * aLab + 0.2158037573 * bLab
    const m_ = L - 0.1055613458 * aLab - 0.0638541728 * bLab
    const s_ = L - 0.0894841775 * aLab - 1.291485548 * bLab

    const l = l_ * l_ * l_
    const m = m_ * m_ * m_
    const sLin = s_ * s_ * s_

    const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * sLin
    const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * sLin
    const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * sLin

    return {
      r: clampByte(linearToSrgb(rLin) * 255),
      g: clampByte(linearToSrgb(gLin) * 255),
      b: clampByte(linearToSrgb(bLin) * 255),
      a,
    }
  }

  return null
}

/** Convert any CSS color (`#hex`, `rgb()`, `hsl()`, `oklch()`) to `#rrggbb` (or `#rrggbbaa` when translucent). */
export function colorToHex(input: string, fallback = "#000000"): string {
  const rgba = parseCssColorToRgba(input)
  if (!rgba) return fallback
  const rgb = `#${toHexByte(rgba.r)}${toHexByte(rgba.g)}${toHexByte(rgba.b)}`
  if (rgba.a < 0.999) {
    return `${rgb}${toHexByte(rgba.a * 255)}`
  }
  return rgb
}

/** Apply an explicit opacity (0..1) to any CSS color and return `#rrggbbaa`. */
export function withAlphaHex(input: string, alpha: number, fallback = "#000000"): string {
  const rgba = parseCssColorToRgba(input) ?? parseCssColorToRgba(fallback) ?? { r: 0, g: 0, b: 0, a: 1 }
  return `#${toHexByte(rgba.r)}${toHexByte(rgba.g)}${toHexByte(rgba.b)}${toHexByte(clamp01(alpha) * 255)}`
}

/** Mix two CSS colors in linear sRGB space (`weight` 0..1 towards `colorB`) and return `#rrggbb`. */
export function mixColorsToHex(colorA: string, colorB: string, weight: number): string {
  const a = parseCssColorToRgba(colorA) ?? { r: 0, g: 0, b: 0, a: 1 }
  const b = parseCssColorToRgba(colorB) ?? { r: 255, g: 255, b: 255, a: 1 }
  const t = clamp01(weight)
  const r = linearToSrgb(srgbToLinear(a.r) * (1 - t) + srgbToLinear(b.r) * t) * 255
  const g = linearToSrgb(srgbToLinear(a.g) * (1 - t) + srgbToLinear(b.g) * t) * 255
  const bl = linearToSrgb(srgbToLinear(a.b) * (1 - t) + srgbToLinear(b.b) * t) * 255
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(bl)}`
}
