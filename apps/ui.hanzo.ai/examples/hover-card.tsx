import { useState } from "react"
import { Paragraph, Text, XStack, YStack } from "@hanzo/gui"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@hanzo/ui"
import { CalendarDays } from "@hanzogui/lucide-icons-2"

/** Default — rest the pointer on a handle, or tab to it, and a preview of the profile opens; a click does nothing, so the trigger can stay a link that navigates. */
export function Default() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@luxfi</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <XStack gap="$3">
          <Avatar>
            <AvatarImage src="https://github.com/luxfi.png" alt="Lux" />
            <AvatarFallback>LX</AvatarFallback>
          </Avatar>
          <YStack gap="$1" flex={1}>
            <Text fontWeight="600" fontSize={13}>
              Lux
            </Text>
            <Paragraph fontSize={13} color="$color11">
              Post-quantum, multi-consensus blockchain with GPU-native VMs.
            </Paragraph>
            <XStack gap="$2" items="center" mt="$1">
              <CalendarDays size={14} />
              <Text fontSize={12} color="$color11">
                Joined December 2019
              </Text>
            </XStack>
          </YStack>
        </XStack>
      </HoverCardContent>
    </HoverCard>
  )
}

/** Placement — `side` on the content names the edge the card opens on, and it flips when that edge runs out of room. */
export function Placement() {
  return (
    <XStack flexWrap="wrap" gap="$3">
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline">Top</Button>
        </HoverCardTrigger>
        <HoverCardContent side="top" width={160}>
          Above the trigger
        </HoverCardContent>
      </HoverCard>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline">Right</Button>
        </HoverCardTrigger>
        <HoverCardContent side="right" width={160}>
          Right of the trigger
        </HoverCardContent>
      </HoverCard>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </HoverCardTrigger>
        <HoverCardContent side="bottom" width={160}>
          Below the trigger
        </HoverCardContent>
      </HoverCard>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline">Left</Button>
        </HoverCardTrigger>
        <HoverCardContent side="left" width={160}>
          Left of the trigger
        </HoverCardContent>
      </HoverCard>
    </XStack>
  )
}

/** Alignment — `align` lines the card up with the start, centre or end of the trigger; `sideOffset` sets the gap. */
export function Alignment() {
  return (
    <XStack flexWrap="wrap" gap="$3">
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline">Start</Button>
        </HoverCardTrigger>
        <HoverCardContent align="start" sideOffset={8}>
          Left edges meet
        </HoverCardContent>
      </HoverCard>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline">Center</Button>
        </HoverCardTrigger>
        <HoverCardContent align="center" sideOffset={8}>
          Centred under the trigger
        </HoverCardContent>
      </HoverCard>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline">End</Button>
        </HoverCardTrigger>
        <HoverCardContent align="end" sideOffset={8}>
          Right edges meet
        </HoverCardContent>
      </HoverCard>
    </XStack>
  )
}

/** Delays — `openDelay` is how long the pointer rests before the card opens and `closeDelay` how long it is away before the card closes, both in milliseconds; 700 and 300 are the defaults. */
export function Delays() {
  return (
    <XStack flexWrap="wrap" gap="$3">
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
          <Button variant="outline">Instant</Button>
        </HoverCardTrigger>
        <HoverCardContent width={200}>
          Opens and closes with no wait
        </HoverCardContent>
      </HoverCard>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline">Default</Button>
        </HoverCardTrigger>
        <HoverCardContent width={200}>
          Opens after 700 ms, closes 300 ms after you leave
        </HoverCardContent>
      </HoverCard>
      <HoverCard openDelay={1500} closeDelay={800}>
        <HoverCardTrigger asChild>
          <Button variant="outline">Slow</Button>
        </HoverCardTrigger>
        <HoverCardContent width={200}>
          Opens after 1.5 s, closes 800 ms after you leave
        </HoverCardContent>
      </HoverCard>
    </XStack>
  )
}

/** Controlled — `open` and `onOpenChange` hand the state to you, so a button can pin the card while hover, focus and Escape still report through the same callback. */
export function Controlled() {
  const [open, setOpen] = useState(false)
  return (
    <XStack gap="$3" items="center">
      <HoverCard open={open} onOpenChange={setOpen}>
        <HoverCardTrigger asChild>
          <Button variant="link">@hanzoai</Button>
        </HoverCardTrigger>
        <HoverCardContent>
          Frontier AI and foundational models. Techstars 2017.
        </HoverCardContent>
      </HoverCard>
      <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
        {open ? "Unpin" : "Pin"}
      </Button>
      <Text fontSize={13} color="$color11">
        {open ? "Open" : "Closed"}
      </Text>
    </XStack>
  )
}
