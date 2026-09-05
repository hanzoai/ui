import { Text, XStack, YStack } from "@hanzo/gui"
import { ScrollArea, ScrollBar } from "@hanzo/ui"

const PACKAGES = [
  "@hanzogui/core",
  "@hanzogui/config",
  "@hanzogui/adapt",
  "@hanzogui/animate-presence",
  "@hanzogui/avatar",
  "@hanzogui/button",
  "@hanzogui/checkbox",
  "@hanzogui/dialog",
  "@hanzogui/dismissable",
  "@hanzogui/floating",
  "@hanzogui/focus-scope",
  "@hanzogui/image",
  "@hanzogui/lucide-icons-2",
  "@hanzogui/menu",
]

const REGIONS = [
  "Frankfurt",
  "Amsterdam",
  "London",
  "Paris",
  "Stockholm",
  "Singapore",
  "Tokyo",
  "Sydney",
  "São Paulo",
  "Toronto",
  "New York",
  "San Francisco",
]

const SERVICES = [
  { name: "api", p99: "84 ms" },
  { name: "auth", p99: "31 ms" },
  { name: "billing", p99: "120 ms" },
  { name: "search", p99: "212 ms" },
  { name: "mail", p99: "47 ms" },
  { name: "worker", p99: "9 ms" },
  { name: "docs", p99: "18 ms" },
  { name: "gateway", p99: "63 ms" },
]

const CITIES = [
  "القاهرة",
  "الرياض",
  "دبي",
  "بيروت",
  "عمّان",
  "الدوحة",
  "مسقط",
  "الكويت",
  "المنامة",
  "بغداد",
  "الرباط",
  "تونس",
]

/** Default — the area takes the height you give it, the platform scrolls what overflows, and the one custom bar appears while the pointer is over it. */
export function Default() {
  return (
    <ScrollArea
      height={200}
      width={260}
      rounded="$3"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <YStack p="$3" gap="$1">
        <Text fontSize={13} fontWeight="600" mb="$1">
          Dependencies
        </Text>
        {PACKAGES.map((name) => (
          <Text key={name} fontFamily="$mono" fontSize={13} color="$color11">
            {name}
          </Text>
        ))}
      </YStack>
    </ScrollArea>
  )
}

/** Visibility — `type` is when the bar shows: `hover` (the default) while the pointer is over the area, `scroll` only while it moves, `auto` whenever the content overflows, `always` even when it does not; `scrollHideDelay` is how long the first two linger. */
export function Visibility() {
  const rows = REGIONS.map((name) => (
    <Text key={name} fontSize={13}>
      {name}
    </Text>
  ))
  return (
    <XStack flexWrap="wrap" gap="$4">
      <YStack gap="$2">
        <Text fontSize={12} color="$color11">
          hover
        </Text>
        <ScrollArea
          type="hover"
          height={120}
          width={140}
          rounded="$3"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <YStack p="$3" gap="$1">
            {rows}
          </YStack>
        </ScrollArea>
      </YStack>
      <YStack gap="$2">
        <Text fontSize={12} color="$color11">
          scroll, 1500 ms
        </Text>
        <ScrollArea
          type="scroll"
          scrollHideDelay={1500}
          height={120}
          width={140}
          rounded="$3"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <YStack p="$3" gap="$1">
            {rows}
          </YStack>
        </ScrollArea>
      </YStack>
      <YStack gap="$2">
        <Text fontSize={12} color="$color11">
          auto
        </Text>
        <ScrollArea
          type="auto"
          height={120}
          width={140}
          rounded="$3"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <YStack p="$3" gap="$1">
            {rows}
          </YStack>
        </ScrollArea>
      </YStack>
      <YStack gap="$2">
        <Text fontSize={12} color="$color11">
          always
        </Text>
        <ScrollArea
          type="always"
          height={120}
          width={140}
          rounded="$3"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <YStack p="$3" gap="$1">
            {rows.slice(0, 3)}
          </YStack>
        </ScrollArea>
      </YStack>
    </XStack>
  )
}

/** Horizontal — `horizontal` scrolls the x axis and the area draws the one bar for that axis itself, so the `ScrollBar` of the shadcn shape is accepted and adds nothing. */
export function Horizontal() {
  return (
    <ScrollArea
      horizontal
      width="100%"
      maxW={560}
      rounded="$3"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <XStack p="$3" gap="$3">
        {SERVICES.map((s) => (
          <YStack
            key={s.name}
            width={140}
            p="$3"
            gap="$1"
            rounded="$3"
            bg="$color3"
          >
            <Text fontSize={13} fontWeight="600">
              {s.name}
            </Text>
            <Text fontSize={12} color="$color11">
              p99 {s.p99}
            </Text>
          </YStack>
        ))}
      </XStack>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

/** Direction — `dir="rtl"` moves the vertical bar to the left edge, where a right-to-left layout expects it; both are `always` here so the edge shows without a hover. */
export function Direction() {
  return (
    <XStack flexWrap="wrap" gap="$4">
      <ScrollArea
        dir="ltr"
        type="always"
        height={160}
        width={200}
        rounded="$3"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <YStack p="$3" gap="$1">
          {REGIONS.map((name) => (
            <Text key={name} fontSize={13}>
              {name}
            </Text>
          ))}
        </YStack>
      </ScrollArea>
      <ScrollArea
        dir="rtl"
        type="always"
        height={160}
        width={200}
        rounded="$3"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <YStack p="$3" gap="$1" items="flex-end">
          {CITIES.map((name) => (
            <Text key={name} fontSize={13}>
              {name}
            </Text>
          ))}
        </YStack>
      </ScrollArea>
    </XStack>
  )
}
