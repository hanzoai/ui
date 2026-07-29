/**
 * react-native-svg ships CommonJS that re-`require`s ESM, which Node refuses
 * under vitest. The render suites assert markup and slot markers, never icon
 * geometry, so every SVG element resolves to a plain host element here.
 */
import { createElement, type ReactNode } from 'react'

const host =
  (tag: string) =>
  ({ children, ...props }: { children?: ReactNode }) =>
    createElement(tag, props, children)

export const Svg = host('svg')
export const Circle = host('circle')
export const Ellipse = host('ellipse')
export const G = host('g')
export const Line = host('line')
export const Path = host('path')
export const Polygon = host('polygon')
export const Polyline = host('polyline')
export const Rect = host('rect')
export const Text = host('text')
export const Defs = host('defs')
export const LinearGradient = host('linearGradient')
export const RadialGradient = host('radialGradient')
export const Stop = host('stop')
export const ClipPath = host('clipPath')
export const Mask = host('mask')
export const Use = host('use')
export const Symbol = host('symbol')
export const SvgXml = host('svg')
export default Svg
