import { useState } from "react"
import { Paragraph, Text, XStack, YStack } from "@hanzo/gui"
import { Button, ToggleGroup, ToggleGroupItem } from "@hanzo/ui"
import { Bold, Italic, Underline } from "@hanzogui/lucide-icons-2"

/** Default — a single choice, where `defaultValue` names the segment that starts on, arrow keys move between them, and clicking the one that is on turns it off again. */
export function Default() {
  return (
    <ToggleGroup defaultValue="week" aria-label="Calendar view">
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
    </ToggleGroup>
  )
}

/** Variants — the filled default and an outline that draws its own edge, set once on the group so every item takes it. */
export function Variants() {
  return (
    <YStack gap="$3" items="flex-start">
      <ToggleGroup
        variant="default"
        defaultValue="board"
        aria-label="Project view"
      >
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="board">Board</ToggleGroupItem>
        <ToggleGroupItem value="timeline">Timeline</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup
        variant="outline"
        defaultValue="board"
        aria-label="Project view, outlined"
      >
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="board">Board</ToggleGroupItem>
        <ToggleGroupItem value="timeline">Timeline</ToggleGroupItem>
      </ToggleGroup>
    </YStack>
  )
}

/** Sizes — `sm`, the default and `lg` follow the Button's height ladder, so a group and a button of the same size sit level in one row. */
export function Sizes() {
  return (
    <YStack gap="$3" items="flex-start">
      <XStack gap="$3" items="center">
        <ToggleGroup size="sm" defaultValue="24h" aria-label="Range, small">
          <ToggleGroupItem value="1h">1h</ToggleGroupItem>
          <ToggleGroupItem value="24h">24h</ToggleGroupItem>
          <ToggleGroupItem value="7d">7d</ToggleGroupItem>
        </ToggleGroup>
        <Button size="sm" variant="outline">
          Export
        </Button>
      </XStack>
      <XStack gap="$3" items="center">
        <ToggleGroup size="default" defaultValue="24h" aria-label="Range">
          <ToggleGroupItem value="1h">1h</ToggleGroupItem>
          <ToggleGroupItem value="24h">24h</ToggleGroupItem>
          <ToggleGroupItem value="7d">7d</ToggleGroupItem>
        </ToggleGroup>
        <Button variant="outline">Export</Button>
      </XStack>
      <XStack gap="$3" items="center">
        <ToggleGroup size="lg" defaultValue="24h" aria-label="Range, large">
          <ToggleGroupItem value="1h">1h</ToggleGroupItem>
          <ToggleGroupItem value="24h">24h</ToggleGroupItem>
          <ToggleGroupItem value="7d">7d</ToggleGroupItem>
        </ToggleGroup>
        <Button size="lg" variant="outline">
          Export
        </Button>
      </XStack>
    </YStack>
  )
}

/** Controlled — `value` and `onValueChange` hold the choice in React state, `disableDeactivation` keeps one segment on so the line below always has a range to name, and a `disabled` segment stays in the row but takes no click. */
export function Controlled() {
  const [range, setRange] = useState("day")
  return (
    <YStack gap="$3" items="flex-start">
      <ToggleGroup
        value={range}
        onValueChange={(next: string) => setRange(next)}
        disableDeactivation
        aria-label="Report range"
      >
        <ToggleGroupItem value="hour">Hour</ToggleGroupItem>
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
        <ToggleGroupItem value="quarter" disabled>
          Quarter
        </ToggleGroupItem>
      </ToggleGroup>
      <Paragraph color="$color10">
        Requests served over the past {range}.
      </Paragraph>
    </YStack>
  )
}

/** Multiple — `type="multiple"` lets any number of segments be on at once, each announced as a pressed button, and the line below takes every style that is on. */
export function Multiple() {
  const [formats, setFormats] = useState(["bold"])
  const on = (format: string) => formats.includes(format)
  return (
    <YStack gap="$3" items="flex-start">
      <ToggleGroup
        type="multiple"
        value={formats}
        onValueChange={(next: string[]) => setFormats(next)}
        aria-label="Text style"
      >
        <ToggleGroupItem value="bold" aria-label="Bold">
          <Bold size={16} />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          <Italic size={16} />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Underline">
          <Underline size={16} />
        </ToggleGroupItem>
      </ToggleGroup>
      <Text
        fontWeight={on("bold") ? "700" : "400"}
        fontStyle={on("italic") ? "italic" : "normal"}
        textDecorationLine={on("underline") ? "underline" : "none"}
      >
        The release notes go out on Thursday.
      </Text>
    </YStack>
  )
}
