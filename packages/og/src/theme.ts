import type { OgConfig } from './types.js'

// The full Hanzo H-mark SVG (from hanzo.industries/app/icon.svg)
export const HANZO_H_SVG = `<svg viewBox="0 0 67 67" xmlns="http://www.w3.org/2000/svg">
  <rect width="67" height="67" fill="#000000"/>
  <path d="M22.21 67V44.6369H0V67H22.21Z" fill="#ffffff"/>
  <path d="M0 44.6369L22.21 46.8285V44.6369H0Z" fill="#DDDDDD"/>
  <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill="#ffffff"/>
  <path d="M22.21 0H0V22.3184H22.21V0Z" fill="#ffffff"/>
  <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill="#ffffff"/>
  <path d="M66.6753 22.3185L44.5098 20.0822V22.3185H66.6753Z" fill="#DDDDDD"/>
  <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill="#ffffff"/>
</svg>`

// Simple H wordmark for hanzo.ai (red badge)
export const HANZO_BRAND_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="4" fill="#EF4444"/>
  <text x="12" y="17" text-anchor="middle" font-size="14" font-weight="bold" fill="white" font-family="Inter, sans-serif">H</text>
</svg>`

export const HANZO_AI_THEME: Partial<OgConfig> = {
  domain: 'hanzo.ai',
  accentColor: '#EF4444',
  bgColor: '#0a0a0a',
  svgIcon: HANZO_BRAND_SVG,
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
