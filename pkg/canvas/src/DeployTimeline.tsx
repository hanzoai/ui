"use client"

/**
 * A vertical deploy/build timeline — one dot-and-rail row per event, colored by
 * its normalized status, newest first. Honest empty state when there are no
 * events. Pure presentation over `DeployEvent[]`.
 */
import { Text, XStack, YStack } from "@hanzo/gui"

import { normalizeServiceStatus, statusColors, statusLabel } from "./status"
import { relativeTime } from "./time"
import type { DeployEvent, ServiceStatus, StatusPalette } from "./types"

export interface DeployTimelineProps {
  events: DeployEvent[]
  statusPalette?: Partial<Record<ServiceStatus, StatusPalette>>
  now?: number
  emptyLabel?: string
}

export function DeployTimeline({
  events,
  statusPalette,
  now,
  emptyLabel = "No deployments yet.",
}: DeployTimelineProps) {
  if (!events.length) {
    return (
      <Text fontSize="$2" color="$color10">
        {emptyLabel}
      </Text>
    )
  }
  return (
    <YStack>
      {events.map((e, i) => {
        const st = normalizeServiceStatus(String(e.status))
        const c = statusColors(st, statusPalette)
        const last = i === events.length - 1
        return (
          <XStack key={e.id} gap="$3" minW={0}>
            {/* Rail */}
            <YStack items="center" width={12} style={{ flexShrink: 0 }}>
              <YStack
                width={10}
                height={10}
                rounded={999}
                style={{ background: c.dot, marginTop: 3 }}
              />
              {!last ? (
                <YStack
                  flex={1}
                  width={2}
                  bg="$color4"
                  style={{ minHeight: 20 }}
                />
              ) : null}
            </YStack>
            <YStack flex={1} minW={0} pb={last ? "$0" : "$3"} gap="$0.5">
              <XStack items="center" gap="$2" minW={0}>
                <Text
                  fontSize="$3"
                  fontWeight="600"
                  color="$color12"
                  numberOfLines={1}
                >
                  {e.ref ?? statusLabel(st)}
                </Text>
                <Text
                  fontSize="$1"
                  fontWeight="700"
                  style={{ color: c.fg, textTransform: "capitalize" }}
                >
                  {statusLabel(st)}
                </Text>
                <YStack flex={1} />
                {e.createdAt ? (
                  <Text fontSize="$1" color="$color9" numberOfLines={1}>
                    {relativeTime(e.createdAt, now)}
                  </Text>
                ) : null}
              </XStack>
              {e.source || e.message ? (
                <Text fontSize="$1" color="$color10" numberOfLines={2}>
                  {[e.source, e.message].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
            </YStack>
          </XStack>
        )
      })}
    </YStack>
  )
}
