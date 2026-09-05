import { useEffect, useState } from "react"
import { Text, XStack, YStack } from "@hanzo/gui"
import { Avatar, AvatarFallback, Button, Skeleton } from "@hanzo/ui"

/** Default — one pulsing block; it has no size of its own, so give it the width and height of what will land there. */
export function Default() {
  return <Skeleton width={240} height={16} />
}

/** Shapes — `rounded` with the two dimensions makes a circle for an avatar, a square for a thumbnail, and a wide block for a cover. */
export function Shapes() {
  return (
    <XStack gap="$4" items="center">
      <Skeleton width={40} height={40} rounded={20} />
      <Skeleton width={64} height={64} rounded="$3" />
      <Skeleton width={200} height={100} rounded="$4" />
    </XStack>
  )
}

/** Classes — Box reads utility classes as style props, so `h-4 w-48` and `size-10 rounded-full` size it the way a stylesheet did. */
export function Classes() {
  return (
    <XStack gap="$4" items="center">
      <Skeleton className="size-10 rounded-full" />
      <YStack gap="$2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </YStack>
    </XStack>
  )
}

/** Lines — a paragraph is full-width lines and a short last one; a stack of equal bars reads as a table. */
export function Lines() {
  return (
    <YStack gap="$2" width={320}>
      <Skeleton height={14} width="100%" />
      <Skeleton height={14} width="100%" />
      <Skeleton height={14} width="60%" />
    </YStack>
  )
}

/** Loaded — each placeholder shares every dimension with the row it stands for, so the list holds still when the data lands. */
export function Loaded() {
  const people = [
    { name: "Mara Okafor", initials: "MO", role: "Owner" },
    { name: "Jules Bernard", initials: "JB", role: "Engineer" },
    { name: "Priya Natarajan", initials: "PN", role: "Billing" },
  ]
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [loading])
  return (
    <YStack gap="$3" width={320}>
      {people.map((p) => (
        <XStack key={p.name} gap="$3" items="center">
          {loading ? (
            <Skeleton width={40} height={40} rounded={20} />
          ) : (
            <Avatar size={40}>
              <AvatarFallback>{p.initials}</AvatarFallback>
            </Avatar>
          )}
          <YStack gap="$1" flex={1}>
            {loading ? (
              <Skeleton width={140} height={16} />
            ) : (
              <Text lineHeight={16}>{p.name}</Text>
            )}
            {loading ? (
              <Skeleton width={64} height={14} />
            ) : (
              <Text lineHeight={14} fontSize="$2" color="$color11">
                {p.role}
              </Text>
            )}
          </YStack>
        </XStack>
      ))}
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onPress={() => setLoading(true)}
      >
        Reload
      </Button>
    </YStack>
  )
}
