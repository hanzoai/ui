import { useState, type FormEvent } from "react"
import { Paragraph, XStack, YStack } from "@hanzo/gui"
import { Button, Label, RadioGroup, RadioGroupItem } from "@hanzo/ui"

/** Default — a column of choices where exactly one is on, each item bound to its label by `id` and `htmlFor` so the words select it too. */
export function Default() {
  return (
    <RadioGroup defaultValue="failed">
      <XStack gap="$2" items="center">
        <RadioGroupItem value="every" id="notify-every" />
        <Label htmlFor="notify-every">Every push</Label>
      </XStack>
      <XStack gap="$2" items="center">
        <RadioGroupItem value="failed" id="notify-failed" />
        <Label htmlFor="notify-failed">Failed builds only</Label>
      </XStack>
      <XStack gap="$2" items="center">
        <RadioGroupItem value="never" id="notify-never" />
        <Label htmlFor="notify-never">Never</Label>
      </XStack>
    </RadioGroup>
  )
}

/** Horizontal — `orientation="horizontal"` lays the items out in a row and moves arrow-key focus onto left and right, instead of the up and down of the default, `vertical`. */
export function Horizontal() {
  return (
    <RadioGroup defaultValue="system" orientation="horizontal" gap="$5">
      <XStack gap="$2" items="center">
        <RadioGroupItem value="light" id="theme-light" />
        <Label htmlFor="theme-light">Light</Label>
      </XStack>
      <XStack gap="$2" items="center">
        <RadioGroupItem value="dark" id="theme-dark" />
        <Label htmlFor="theme-dark">Dark</Label>
      </XStack>
      <XStack gap="$2" items="center">
        <RadioGroupItem value="system" id="theme-system" />
        <Label htmlFor="theme-system">System</Label>
      </XStack>
    </RadioGroup>
  )
}

/** Disabled — a disabled item dims, takes no clicks and is skipped by the arrow keys, while the rest of the group stays live. */
export function Disabled() {
  return (
    <RadioGroup defaultValue="shared">
      <XStack gap="$2" items="center">
        <RadioGroupItem value="shared" id="runner-shared" />
        <Label htmlFor="runner-shared">Shared runner</Label>
      </XStack>
      <XStack gap="$2" items="center">
        <RadioGroupItem value="dedicated" id="runner-dedicated" />
        <Label htmlFor="runner-dedicated">Dedicated runner</Label>
      </XStack>
      <XStack gap="$2" items="center">
        <RadioGroupItem value="gpu" id="runner-gpu" disabled />
        <Label htmlFor="runner-gpu" opacity={0.5}>
          GPU runner, not on this plan
        </Label>
      </XStack>
    </RadioGroup>
  )
}

/** Controlled — `value` and `onValueChange` keep the choice in React state, here to show the price it implies. */
export function Controlled() {
  const [cadence, setCadence] = useState("monthly")
  return (
    <YStack gap="$3">
      <RadioGroup value={cadence} onValueChange={setCadence}>
        <XStack gap="$2" items="center">
          <RadioGroupItem value="monthly" id="bill-monthly" />
          <Label htmlFor="bill-monthly">Monthly</Label>
        </XStack>
        <XStack gap="$2" items="center">
          <RadioGroupItem value="yearly" id="bill-yearly" />
          <Label htmlFor="bill-yearly">Yearly</Label>
        </XStack>
      </RadioGroup>
      <Paragraph color="$color10">
        {cadence === "yearly"
          ? "Billed $192 once a year, two months free."
          : "Billed $20 on the first of each month."}
      </Paragraph>
    </YStack>
  )
}

/** In a form — `name` puts the chosen value on the form as a radio input, and `required` holds the submit until one is picked. */
export function InForm() {
  const [region, setRegion] = useState("")
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRegion(String(new FormData(event.currentTarget).get("region") ?? ""))
  }
  return (
    <form onSubmit={submit}>
      <YStack gap="$3" items="flex-start">
        <RadioGroup name="region" required>
          <XStack gap="$2" items="center">
            <RadioGroupItem value="nyc3" id="region-nyc3" />
            <Label htmlFor="region-nyc3">New York</Label>
          </XStack>
          <XStack gap="$2" items="center">
            <RadioGroupItem value="fra1" id="region-fra1" />
            <Label htmlFor="region-fra1">Frankfurt</Label>
          </XStack>
          <XStack gap="$2" items="center">
            <RadioGroupItem value="sgp1" id="region-sgp1" />
            <Label htmlFor="region-sgp1">Singapore</Label>
          </XStack>
        </RadioGroup>
        <Button type="submit" variant="outline">
          Create cluster
        </Button>
        {region ? (
          <Paragraph color="$color10">
            The cluster will be created in {region}.
          </Paragraph>
        ) : null}
      </YStack>
    </form>
  )
}
