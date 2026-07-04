'use client'

/**
 * Hero — the clean product hero (kicker + title + one-line what-it-is + primary
 * CTA): monochrome-tasteful with a functional accent + a pure-SVG hero graphic.
 * White-labels by brand (`config.brandName`) and accent (`config.accent`).
 */
import type { ComponentProps } from 'react'
import { Button, Card, Text, XStack, YStack } from '@hanzo/gui'

import { CHART_PALETTE } from '../charts/Charts'
import { openExternal } from './parts'
import type { LandingAction, LandingConfig } from './types'

/** A hex color at an alpha, as an `rgba()`. */
function hex(h: string, a: number): string {
  const n = h.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

const act = (a: LandingAction) => (a.href ? openExternal(a.href) : a.onPress?.())

export function Hero({ config: c }: { config: LandingConfig }) {
  const Icon = c.icon
  const accent = c.accent ?? CHART_PALETTE[0]
  return (
    <Card
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$6"
      p="$5"
      overflow="hidden"
      style={{ background: `linear-gradient(115deg, ${hex(accent, 0.16)} 0%, ${hex(accent, 0.04)} 48%, rgba(0,0,0,0) 78%)` }}
    >
      <XStack items="center" gap="$4" flexWrap="wrap">
        <YStack flex={1} minW={280} gap="$2.5">
          {Icon || c.brandName ? (
            <XStack items="center" gap="$2">
              {Icon ? <Icon size={16} color={accent} /> : null}
              {c.brandName ? (
                <Text fontSize="$1" color="$color11" fontWeight="700" style={{ letterSpacing: 0.4, textTransform: 'uppercase' }}>
                  {c.brandName}
                </Text>
              ) : null}
            </XStack>
          ) : null}
          <Text fontSize="$8" fontWeight="900" color="$color12">
            {c.title}
          </Text>
          <Text fontSize="$3" color="$color11" maxW={620}>
            {c.tagline}
          </Text>
          {c.primary || c.secondary ? (
            <XStack gap="$2" pt="$2" flexWrap="wrap" items="center">
              {c.primary ? (
                <AccentButton accent={accent} icon={c.primary.icon} onPress={() => act(c.primary as LandingAction)}>
                  {c.primary.label}
                </AccentButton>
              ) : null}
              {c.secondary ? (
                <Button icon={c.secondary.icon} onPress={() => act(c.secondary as LandingAction)}>
                  {c.secondary.label}
                </Button>
              ) : null}
            </XStack>
          ) : null}
        </YStack>
        <YStack items="center" justify="center" minW={170}>
          <HeroGraphic size={170} accent={accent} />
        </YStack>
      </XStack>
    </Card>
  )
}

/** The one high-emphasis accent action (a filled button on the brand accent). */
function AccentButton({ accent, children, ...props }: { accent: string } & ComponentProps<typeof Button>) {
  return (
    <Button {...props} borderWidth={1} style={{ backgroundColor: accent, borderColor: accent, color: '#fff' }} hoverStyle={{ opacity: 0.92 }} pressStyle={{ opacity: 0.85 }}>
      {children}
    </Button>
  )
}

/** A pure-SVG hero motif — a glowing isometric "serving unit" cube. */
function HeroGraphic({ size = 170, accent = CHART_PALETTE[0] }: { size?: number; accent?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden style={{ display: 'block', maxWidth: '100%' }}>
      <defs>
        <radialGradient id="hz-hero-glow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
          <stop offset="55%" stopColor={accent} stopOpacity="0.14" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hz-hero-cube" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>
      <circle cx="100" cy="96" r="92" fill="url(#hz-hero-glow)" />
      {[74, 56, 40].map((r, i) => (
        <circle key={r} cx="100" cy="96" r={r} fill="none" stroke={accent} strokeOpacity={0.18 + i * 0.12} strokeWidth={1.5} />
      ))}
      <g transform="translate(100 96)">
        <polygon points="0,-34 30,-17 30,17 0,34 -30,17 -30,-17" fill="url(#hz-hero-cube)" fillOpacity="0.9" />
        <polygon points="0,-34 30,-17 0,0 -30,-17" fill="#c4b5fd" fillOpacity="0.85" />
        <polygon points="0,0 30,-17 30,17 0,34" fill={accent} fillOpacity="0.7" />
        <polygon points="0,0 -30,-17 -30,17 0,34" fill="#6d28d9" fillOpacity="0.7" />
      </g>
    </svg>
  )
}
