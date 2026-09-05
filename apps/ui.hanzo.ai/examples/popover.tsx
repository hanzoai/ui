import { useState } from "react"
import { Paragraph, Text, XStack, YStack } from "@hanzo/gui"
import {
  Button,
  Input,
  Label,
  Popover,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@hanzo/ui"
import { SlidersHorizontal } from "@hanzogui/lucide-icons-2"

/** Default — a button opens a panel below itself; a click outside or Escape closes it. */
export function Default() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Deploy details</Button>
      </PopoverTrigger>
      <PopoverContent>
        <YStack gap="$2">
          <Text fontWeight="600">Production</Text>
          <Paragraph fontSize={13} color="$color11">
            Built from main at 4f2c9e1 and promoted after the smoke suite
            passed.
          </Paragraph>
        </YStack>
      </PopoverContent>
    </Popover>
  )
}

/** Placement — `placement` on the root names the side the panel opens on, and `allowFlip` lets it swap to the opposite side when that one runs out of room. */
export function Placement() {
  return (
    <XStack flexWrap="wrap" gap="$3">
      <Popover placement="top" allowFlip>
        <PopoverTrigger asChild>
          <Button variant="outline">Top</Button>
        </PopoverTrigger>
        <PopoverContent width={160}>
          <Text fontSize={13}>Above the trigger</Text>
        </PopoverContent>
      </Popover>
      <Popover placement="right" allowFlip>
        <PopoverTrigger asChild>
          <Button variant="outline">Right</Button>
        </PopoverTrigger>
        <PopoverContent width={160}>
          <Text fontSize={13}>Right of the trigger</Text>
        </PopoverContent>
      </Popover>
      <Popover placement="bottom" allowFlip>
        <PopoverTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </PopoverTrigger>
        <PopoverContent width={160}>
          <Text fontSize={13}>Below the trigger</Text>
        </PopoverContent>
      </Popover>
      <Popover placement="left" allowFlip>
        <PopoverTrigger asChild>
          <Button variant="outline">Left</Button>
        </PopoverTrigger>
        <PopoverContent width={160}>
          <Text fontSize={13}>Left of the trigger</Text>
        </PopoverContent>
      </Popover>
    </XStack>
  )
}

/** Alignment — `align` on the content lines it up with the start, centre or end of the trigger; `sideOffset` sets the gap. */
export function Alignment() {
  return (
    <XStack flexWrap="wrap" gap="$3">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Start</Button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={8}>
          <Text fontSize={13}>Left edges meet</Text>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Center</Button>
        </PopoverTrigger>
        <PopoverContent align="center" sideOffset={8}>
          <Text fontSize={13}>Centred under the trigger</Text>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">End</Button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8}>
          <Text fontSize={13}>Right edges meet</Text>
        </PopoverContent>
      </Popover>
    </XStack>
  )
}

/** Controlled — `open` and `onOpenChange` hand the state to you, and `PopoverClose` closes the panel from a button inside it. */
export function Controlled() {
  const [open, setOpen] = useState(false)
  return (
    <XStack gap="$3" items="center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">Rename</Button>
        </PopoverTrigger>
        <PopoverContent>
          <YStack gap="$3">
            <YStack gap="$2">
              <Label htmlFor="branch-name">Branch name</Label>
              <Input id="branch-name" defaultValue="fix/retry-on-timeout" />
            </YStack>
            <XStack gap="$2" justify="flex-end">
              <PopoverClose asChild>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </PopoverClose>
              <PopoverClose asChild>
                <Button variant="primary" size="sm">
                  Save
                </Button>
              </PopoverClose>
            </XStack>
          </YStack>
        </PopoverContent>
      </Popover>
      <Text fontSize={13} color="$color11">
        {open ? "Open" : "Closed"}
      </Text>
    </XStack>
  )
}

/** Anchored — `PopoverAnchor` positions the panel against a different element than the trigger, here the whole search row instead of its button. */
export function Anchored() {
  return (
    <Popover>
      <PopoverAnchor flexDirection="row" items="center" gap="$2" width={360}>
        <Input flex={1} placeholder="Search deployments" />
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Search options">
            <SlidersHorizontal size={16} />
          </Button>
        </PopoverTrigger>
      </PopoverAnchor>
      <PopoverContent align="start" width={360}>
        <YStack gap="$3">
          <YStack gap="$2">
            <Label htmlFor="search-env">Environment</Label>
            <Input id="search-env" defaultValue="production" />
          </YStack>
          <YStack gap="$2">
            <Label htmlFor="search-since">Since</Label>
            <Input id="search-since" defaultValue="7 days ago" />
          </YStack>
        </YStack>
      </PopoverContent>
    </Popover>
  )
}
