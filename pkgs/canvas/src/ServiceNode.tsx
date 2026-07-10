"use client"

/**
 * The service card — the one node the canvas renders for every service. Layered
 * and elevated (z-depth shadow + hover lift + selected ring), it reads
 * glanceably: a status accent bar, an icon tile, the service name, its type +
 * `/v1` capability, its source ref, and a footer with replicas, latest-deploy
 * relative time, and a metric sparkline preview. Pure presentation — it takes a
 * `ServiceNodeData` and callbacks; it never fetches. Usable inside the canvas
 * (via `canvas-node`) or standalone in a grid/list.
 */
import type { ReactNode } from "react"
import { Text, XStack, YStack } from "@hanzo/gui"

import { kindLabel, withAlpha } from "./color"
import { kindGlyph } from "./glyphs"
import { MetricSparkline } from "./MetricSparkline"
import { ReplicaPill } from "./ReplicaPill"
import { ServiceStatusBadge } from "./ServiceStatusBadge"
import { SourceRef } from "./SourceRef"
import { statusColors } from "./status"
import { relativeTime } from "./time"
import type { ServiceNodeData, ServiceStatus, StatusPalette } from "./types"

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace"

export interface ServiceNodeProps {
  data: ServiceNodeData
  selected?: boolean
  reducedMotion?: boolean
  width?: number
  statusPalette?: Partial<Record<ServiceStatus, StatusPalette>>
  /** Override the icon (e.g. pass a lucide icon); default is the built-in glyph. */
  renderIcon?: (data: ServiceNodeData) => ReactNode
  onOpen?: (data: ServiceNodeData) => void
  /** `now` for deterministic relative-time rendering (tests/SSR). */
  now?: number
}

export function ServiceNode({
  data,
  selected,
  reducedMotion,
  width = 268,
  statusPalette,
  renderIcon,
  onOpen,
  now,
}: ServiceNodeProps) {
  const c = statusColors(data.status, statusPalette)
  const accent = data.accent ?? c.dot
  const tinted = !!data.accent
  const Glyph = kindGlyph(data.kind)
  const icon = renderIcon ? renderIcon(data) : <Glyph size={17} />
  const deployed = relativeTime(data.deployedAt, now)

  return (
    <XStack
      className="hz-canvas-node"
      width={width}
      rounded="$5"
      bg="$color1"
      borderWidth={1}
      borderColor={selected ? "$color8" : "$borderColor"}
      overflow="hidden"
      style={{
        boxShadow: selected
          ? `0 0 0 1px ${accent}, 0 10px 28px rgba(0,0,0,0.20), 0 2px 6px rgba(0,0,0,0.10)`
          : "0 1px 2px rgba(0,0,0,0.10), 0 6px 16px rgba(0,0,0,0.06)",
        cursor: onOpen ? "pointer" : "default",
      }}
      onPress={onOpen ? () => onOpen(data) : undefined}
      hoverStyle={onOpen ? { borderColor: "$color7" } : undefined}
    >
      {/* Status accent bar */}
      <YStack width={3} style={{ background: accent }} />

      <YStack flex={1} p="$3" gap="$2.5" minW={0}>
        {/* Header: icon + name/type + status */}
        <XStack items="flex-start" gap="$2.5" minW={0}>
          <YStack
            width={34}
            height={34}
            rounded="$3"
            items="center"
            justify="center"
            bg={tinted ? undefined : "$color3"}
            style={{
              flexShrink: 0,
              background: tinted ? withAlpha(accent, 0.14) : undefined,
              color: tinted ? accent : "#8b949e",
            }}
          >
            <span style={{ display: "inline-flex" }}>{icon}</span>
          </YStack>

          <YStack flex={1} minW={0} gap="$1">
            <Text
              fontSize="$4"
              fontWeight="700"
              color="$color12"
              numberOfLines={1}
            >
              {data.name}
            </Text>
            <XStack items="center" gap="$1.5" minW={0} flexWrap="wrap">
              <Text
                fontSize="$1"
                color="$color10"
                numberOfLines={1}
                style={{ flexShrink: 0 }}
              >
                {data.typeLabel ?? kindLabel(data.kind)}
              </Text>
              {data.capability ? (
                <XStack
                  bg="$color2"
                  px="$1.5"
                  py="$0.5"
                  rounded="$2"
                  minW={0}
                  style={{ flexShrink: 1 }}
                >
                  <Text
                    fontSize="$1"
                    color="$color10"
                    numberOfLines={1}
                    style={{ fontFamily: MONO }}
                  >
                    {data.capability.path ?? `/v1/${data.capability.id}`}
                  </Text>
                </XStack>
              ) : null}
            </XStack>
          </YStack>

          <ServiceStatusBadge
            status={data.status}
            size="sm"
            palette={statusPalette}
            reducedMotion={reducedMotion}
          />
        </XStack>

        {/* Source */}
        {data.source ? <SourceRef source={data.source} size="sm" /> : null}

        {/* Footer: replicas + deploy time | metric preview */}
        <XStack items="center" justify="space-between" gap="$2" minW={0}>
          <XStack items="center" gap="$2" minW={0}>
            <ReplicaPill replicas={data.replicas} size="sm" />
            {data.deployedAt ? (
              <Text fontSize="$1" color="$color9" numberOfLines={1}>
                {deployed}
              </Text>
            ) : null}
          </XStack>
          {data.metric ? (
            <XStack items="center" gap="$1.5" style={{ flexShrink: 0 }}>
              <MetricSparkline
                points={data.metric.points}
                width={64}
                height={20}
                stroke={c.dot}
                strokeWidth={1.5}
                fill={withAlpha(c.dot, 0.12)}
                min={data.metric.min}
                max={data.metric.max}
              />
              {data.metric.value ? (
                <Text fontSize="$1" color="$color10" numberOfLines={1}>
                  {data.metric.value}
                </Text>
              ) : null}
            </XStack>
          ) : null}
        </XStack>
      </YStack>
    </XStack>
  )
}
