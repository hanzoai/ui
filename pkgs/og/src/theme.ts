import { MARK_BLOCKS } from '@hanzo/logo/logos'

import type { OgConfig } from './types.js'

/**
 * The mark, from its one home.
 *
 * This was transcribed here — seven path strings copied out of
 * hanzo.industries/app/icon.svg — under a black `<rect>` ground. The ground is
 * gone with it: an OG card already paints its own background, so a tile under
 * the H just draws a second black square on a black card. White, because these
 * cards are dark; a light surface uses @hanzo/logo's `light` variant.
 */
export const HANZO_H_SVG = `<svg viewBox="0 0 67 67" xmlns="http://www.w3.org/2000/svg">${
  MARK_BLOCKS.map((d) => `<path d="${d}" fill="#ffffff"/>`).join('')
}</svg>`

export const HANZO_AI_THEME: Partial<OgConfig> = {
  domain: 'hanzo.ai',
  accentColor: '#EF4444',
  bgColor: '#0a0a0a',
  svgIcon: HANZO_H_SVG,
}

export const HANZO_INDUSTRIES_THEME: Partial<OgConfig> = {
  domain: 'hanzo.industries',
  accentColor: '#EF4444',
  bgColor: '#000000',
  svgIcon: HANZO_H_SVG,
}

export const MODALITY_COLORS: Record<string, string> = {
  text: '#3b82f6',
  vision: '#a855f7',
  code: '#22c55e',
  audio: '#eab308',
  image: '#ec4899',
  math: '#f97316',
  video: '#06b6d4',
}
