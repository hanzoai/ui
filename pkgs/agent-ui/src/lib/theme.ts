// Hanzo Agent Cloud — Status Theme
// Tailwind-based status tone classes

import type { StatusTone } from '../types'

const STATUS_TONES = {
  success: {
    accent: 'text-emerald-500',
    fg: 'text-emerald-400',
    mutedFg: 'text-emerald-400/80',
    bg: 'bg-emerald-500/10',
    solidBg: 'bg-emerald-500',
    solidFg: 'text-white',
    border: 'border border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  warning: {
    accent: 'text-amber-500',
    fg: 'text-amber-400',
    mutedFg: 'text-amber-400/80',
    bg: 'bg-amber-500/10',
    solidBg: 'bg-amber-500',
    solidFg: 'text-white',
    border: 'border border-amber-500/20',
    dot: 'bg-amber-500',
  },
  error: {
    accent: 'text-red-500',
    fg: 'text-red-400',
    mutedFg: 'text-red-400/80',
    bg: 'bg-red-500/10',
    solidBg: 'bg-red-500',
    solidFg: 'text-white',
    border: 'border border-red-500/20',
    dot: 'bg-red-500',
  },
  info: {
    accent: 'text-blue-500',
    fg: 'text-blue-400',
    mutedFg: 'text-blue-400/80',
    bg: 'bg-blue-500/10',
    solidBg: 'bg-blue-500',
    solidFg: 'text-white',
    border: 'border border-blue-500/20',
    dot: 'bg-blue-500',
  },
  neutral: {
    accent: 'text-zinc-500',
    fg: 'text-zinc-400',
    mutedFg: 'text-zinc-400/80',
    bg: 'bg-zinc-500/10',
    solidBg: 'bg-zinc-500',
    solidFg: 'text-white',
    border: 'border border-zinc-500/20',
    dot: 'bg-zinc-400',
  },
} as const

export function getStatusTone(tone: StatusTone) {
  return STATUS_TONES[tone]
}

export function getStatusBadgeClasses(tone: StatusTone): string {
  const t = getStatusTone(tone)
  return [
    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium',
    'shadow-sm transition-all duration-150',
    t.bg,
    t.fg,
    t.border,
  ].join(' ')
}

export { STATUS_TONES }
