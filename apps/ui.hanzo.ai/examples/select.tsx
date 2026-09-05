import { useState } from "react"
import { Text, YStack } from "@hanzo/gui"
import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@hanzo/ui"

/** Default — a trigger that shows a placeholder until a row is picked, and rows that open beneath it in the order written. */
export function Default() {
  return (
    <Select>
      <SelectTrigger width={240}>
        <SelectValue placeholder="Region" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="nyc1">New York</SelectItem>
        <SelectItem value="sfo3">San Francisco</SelectItem>
        <SelectItem value="fra1">Frankfurt</SelectItem>
        <SelectItem value="sgp1">Singapore</SelectItem>
      </SelectContent>
    </Select>
  )
}

/** Disabled — `disabled` on the root dims the trigger and stops it opening, for a choice that is not available yet. */
export function Disabled() {
  return (
    <Select disabled>
      <SelectTrigger width={240}>
        <SelectValue placeholder="Region" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="nyc1">New York</SelectItem>
        <SelectItem value="fra1">Frankfurt</SelectItem>
      </SelectContent>
    </Select>
  )
}

/** Groups — a `SelectLabel` heads each group and a `SelectSeparator` divides them, and a form `Label` bound by `htmlFor` to the root's `id` names the field. */
export function Groups() {
  return (
    <YStack gap="$2">
      <Label htmlFor="runtime">Runtime</Label>
      <Select id="runtime">
        <SelectTrigger width={240}>
          <SelectValue placeholder="Pick a runtime" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Node</SelectLabel>
            <SelectItem value="node-22">Node 22</SelectItem>
            <SelectItem value="node-20">Node 20</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Python</SelectLabel>
            <SelectItem value="python-3.13">Python 3.13</SelectItem>
            <SelectItem value="python-3.12">Python 3.12</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Go</SelectLabel>
            <SelectItem value="go-1.26">Go 1.26</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </YStack>
  )
}

/** Controlled — `value` and `onValueChange` keep the pick in React state, and `renderValue` names it during server render, before the rows have mounted. */
export function Controlled() {
  const [visibility, setVisibility] = useState("private")
  const levels: Record<string, { label: string; hint: string }> = {
    public: { label: "Public", hint: "Anyone with the link can view" },
    unlisted: {
      label: "Unlisted",
      hint: "Hidden from search, open to anyone with the link",
    },
    private: { label: "Private", hint: "Only members of the workspace" },
  }
  return (
    <YStack gap="$2">
      <Select
        value={visibility}
        onValueChange={setVisibility}
        renderValue={(v) => levels[v].label}
      >
        <SelectTrigger width={240}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(levels).map(([value, { label }]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Text fontSize="$2" color="$quiet">
        {levels[visibility].hint}
      </Text>
    </YStack>
  )
}

/** Long list — an arrow appears at whichever edge has rows past it; `SelectContent` places both, and content built by hand from `Select.Content` and `Select.Viewport` places them itself and numbers each row's `index`. */
export function LongList() {
  const zones = [
    "UTC",
    "America/Los_Angeles",
    "America/Denver",
    "America/Chicago",
    "America/New_York",
    "America/Sao_Paulo",
    "Europe/London",
    "Europe/Berlin",
    "Europe/Istanbul",
    "Africa/Lagos",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Pacific/Auckland",
  ]
  return (
    <Select>
      <SelectTrigger width={260}>
        <SelectValue placeholder="Time zone" />
      </SelectTrigger>
      <Select.Content>
        <SelectScrollUpButton />
        <Select.Viewport
          p="$1"
          bg="$panel"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$4"
        >
          {zones.map((zone, index) => (
            <SelectItem key={zone} value={zone} index={index}>
              {zone}
            </SelectItem>
          ))}
        </Select.Viewport>
        <SelectScrollDownButton />
      </Select.Content>
    </Select>
  )
}
