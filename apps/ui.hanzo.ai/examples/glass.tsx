import { useState } from "react"
import { Image, Paragraph, Text, XStack, YStack } from "@hanzo/gui"
import { Button, Glass } from "@hanzo/ui"
import { Check, Play } from "@hanzogui/lucide-icons-2"

const COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e3a8a"/><stop offset="1" stop-color="#7e22ce"/></linearGradient></defs><rect width="800" height="360" fill="url(#g)"/><circle cx="170" cy="110" r="120" fill="#f59e0b"/><circle cx="560" cy="250" r="150" fill="#22d3ee" opacity=".85"/><circle cx="420" cy="80" r="70" fill="#f43f5e" opacity=".9"/></svg>'
  )

/** Default — a frosted bar over cover art; whatever sits under the panel blurs through it, and a hairline seals the edge. */
export function Default() {
  return (
    <YStack
      width="100%"
      maxW={480}
      height={220}
      position="relative"
      rounded="$4"
      overflow="hidden"
    >
      <Image
        src={COVER}
        alt="Cover art"
        width="100%"
        height={220}
        objectFit="cover"
      />
      <Glass
        position="absolute"
        l="$3"
        r="$3"
        b="$3"
        p="$3"
        rounded="$4"
        flexDirection="row"
        items="center"
        gap="$3"
      >
        <YStack flex={1} gap={2}>
          <Text fontWeight="600">Nocturne in E-flat major</Text>
          <Text fontSize={13} color="$color11">
            Chopin · Arthur Rubinstein
          </Text>
        </YStack>
        <Button size="icon-sm" variant="ghost" aria-label="Play">
          <Play size={14} />
        </Button>
      </Glass>
    </YStack>
  )
}

/** Levels — `level` picks the rung: 2 for chrome anchored to the page, such as a toast, and 3 for a dialog floating free over it. */
export function Levels() {
  return (
    <XStack width="100%" flexWrap="wrap" gap="$4">
      <YStack
        flex={1}
        minW={260}
        minH={180}
        position="relative"
        p="$4"
        gap="$2"
        bg="$color3"
        rounded="$4"
      >
        <Text fontWeight="600">Inbox</Text>
        <Paragraph color="$color11">
          Three invoices are waiting on approval.
        </Paragraph>
        <Paragraph color="$color11">
          One deploy finished while you were away.
        </Paragraph>
        <Glass
          level={2}
          position="absolute"
          l="$3"
          r="$3"
          b="$3"
          px="$3"
          py="$2"
          rounded="$4"
          flexDirection="row"
          items="center"
          justify="space-between"
        >
          <Text fontSize={13}>Archived 3 conversations</Text>
          <Button size="sm" variant="ghost">
            Undo
          </Button>
        </Glass>
      </YStack>
      <YStack
        flex={1}
        minW={260}
        minH={180}
        position="relative"
        p="$4"
        gap="$2"
        bg="$color3"
        rounded="$4"
      >
        <Text fontWeight="600">API keys</Text>
        <Paragraph color="$color11">prod-eu · last used today</Paragraph>
        <Paragraph color="$color11">staging · last used a week ago</Paragraph>
        <Glass
          level={3}
          position="absolute"
          t="$4"
          l="$4"
          r="$4"
          p="$4"
          rounded="$4"
          gap="$3"
        >
          <Text fontWeight="600">Revoke prod-eu?</Text>
          <Text fontSize={13} color="$color11">
            Requests signed with it fail from the next call.
          </Text>
          <XStack gap="$2" justify="flex-end">
            <Button size="sm" variant="ghost">
              Keep
            </Button>
            <Button size="sm" variant="destructive">
              Revoke
            </Button>
          </XStack>
        </Glass>
      </YStack>
    </XStack>
  )
}

/** One edge — a docked bar keeps one hairline, on the edge where it meets the page; border width is geometry, so the call site sets it. */
export function Bar() {
  return (
    <YStack
      width="100%"
      maxW={480}
      height={200}
      overflow="scroll"
      bg="$color3"
      rounded="$4"
    >
      <Glass
        position="sticky"
        t={0}
        z={1}
        borderWidth={0}
        borderBottomWidth={1}
        flexDirection="row"
        items="center"
        justify="space-between"
        px="$4"
        py="$2"
      >
        <Text fontWeight="600">Quarterly report</Text>
        <Button size="sm" variant="outline">
          Export
        </Button>
      </Glass>
      <YStack p="$4" gap="$3">
        <Paragraph color="$color11">
          Revenue grew eleven percent on the quarter, led by the inference tier.
          Storage held flat.
        </Paragraph>
        <Paragraph color="$color11">
          Gross margin improved as the GPU fleet moved onto reserved capacity.
        </Paragraph>
        <Paragraph color="$color11">
          Headcount stayed at forty-two, with two platform roles still open.
        </Paragraph>
        <Paragraph color="$color11">
          Cash covers twenty-nine months at the current burn, up from
          twenty-four.
        </Paragraph>
      </YStack>
    </YStack>
  )
}

/** Menu — a menu built by hand wears the material itself, since no slot names it; DropdownMenu and Popover are glass already and need nothing. */
export function Menu() {
  const [density, setDensity] = useState("Comfortable")
  return (
    <YStack
      width="100%"
      maxW={480}
      minH={180}
      position="relative"
      p="$4"
      gap="$2"
      bg="$color3"
      rounded="$4"
    >
      <Text fontWeight="600">Messages</Text>
      <Paragraph color="$color11">Density: {density}</Paragraph>
      <Glass
        role="menu"
        position="absolute"
        t="$4"
        r="$4"
        width={200}
        py="$1"
        rounded="$4"
      >
        {["Compact", "Comfortable", "Spacious"].map((option) => (
          <XStack
            key={option}
            role="menuitem"
            px="$3"
            py="$2"
            gap="$2"
            items="center"
            cursor="pointer"
            hoverStyle={{ bg: "$color4" }}
            onPress={() => setDensity(option)}
          >
            <Text
              flex={1}
              fontSize={13}
              color={option === density ? "$color12" : "$color11"}
            >
              {option}
            </Text>
            {option === density ? <Check size={14} /> : null}
          </XStack>
        ))}
      </Glass>
    </YStack>
  )
}
