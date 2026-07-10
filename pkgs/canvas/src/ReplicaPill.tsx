"use client"

/**
 * A small neutral pill showing replica count (`3×`). Renders nothing when the
 * count is undefined; a single replica still shows `1×` so scale is explicit.
 */
import { Text, XStack } from "@hanzo/gui"

export interface ReplicaPillProps {
  replicas?: number
  size?: "sm" | "md"
}

export function ReplicaPill({ replicas, size = "md" }: ReplicaPillProps) {
  if (replicas == null || !Number.isFinite(replicas) || replicas < 0)
    return null
  const fs = size === "sm" ? "$1" : "$2"
  return (
    <XStack
      items="center"
      gap="$1"
      px="$1.5"
      py="$0.5"
      rounded="$2"
      bg="$color3"
    >
      <Text fontSize={fs} color="$color11" fontWeight="600">
        {replicas}×
      </Text>
    </XStack>
  )
}
