"use client"

/**
 * The status pill — a colored dot + label that reads glanceably. Semantic status
 * colors (not brand) from the overridable palette; the `active`/`deploying` dot
 * pulses (a live thing breathing) unless reduced motion is requested.
 */
import { Text, XStack } from "@hanzo/gui"

import { statusColors, statusLabel, statusPulses } from "./status"
import type { ServiceStatus, StatusPalette } from "./types"

export interface ServiceStatusBadgeProps {
  status: ServiceStatus
  /** Override text (e.g. the raw backend lifecycle string). */
  label?: string
  size?: "sm" | "md"
  showDot?: boolean
  palette?: Partial<Record<ServiceStatus, StatusPalette>>
  reducedMotion?: boolean
}

const SIZES = {
  sm: { px: 6, py: 2, fs: 10, dot: 6, gap: 4 },
  md: { px: 8, py: 3, fs: 11, dot: 7, gap: 5 },
} as const

export function ServiceStatusBadge({
  status,
  label,
  size = "md",
  showDot = true,
  palette,
  reducedMotion,
}: ServiceStatusBadgeProps) {
  const c = statusColors(status, palette)
  const s = SIZES[size]
  const pulse = statusPulses(status) && !reducedMotion
  return (
    <XStack
      items="center"
      gap={s.gap}
      px={s.px}
      py={s.py}
      rounded={999}
      style={{ background: c.soft }}
    >
      {showDot ? (
        <span
          className={
            pulse ? "hz-canvas-dot hz-canvas-dot--pulse" : "hz-canvas-dot"
          }
          style={{
            width: s.dot,
            height: s.dot,
            borderRadius: 999,
            background: c.dot,
            ["--hz-dot" as string]: c.dot,
          }}
        />
      ) : null}
      <Text
        fontSize={s.fs}
        fontWeight="700"
        style={{ color: c.fg, letterSpacing: 0.2, textTransform: "capitalize" }}
      >
        {label ?? statusLabel(status)}
      </Text>
    </XStack>
  )
}
