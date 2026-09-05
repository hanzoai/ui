import { Text, XStack, YStack } from "@hanzo/gui"
import { Checkbox, Input, Label, Switch, Textarea } from "@hanzo/ui"

/** Default — a caption bound to the field below it by `htmlFor`, so a click on the words focuses the input. */
export function Default() {
  return (
    <YStack gap="$2" width={280}>
      <Label htmlFor="work-email">Work email</Label>
      <Input id="work-email" type="email" placeholder="you@company.com" />
    </YStack>
  )
}

/** Sizes — `size` takes a font token and brings the matching line height and weight with it; left unset, a label is `$2` at medium weight. */
export function Sizes() {
  return (
    <YStack gap="$3">
      <Label size="$1">Card number</Label>
      <Label size="$2">Card number</Label>
      <Label size="$4">Card number</Label>
      <Label size="$6">Card number</Label>
    </YStack>
  )
}

/** Unstyled — `unstyled` drops gui's flex row, press colour and 44px line height and keeps only the caption styling, for a compact row the label must not make taller. */
export function Unstyled() {
  return (
    <XStack gap="$2" items="center">
      <Label unstyled htmlFor="per-page">
        Rows per page
      </Label>
      <Input id="per-page" width={64} defaultValue="25" inputMode="numeric" />
    </XStack>
  )
}

/** With controls — beside a checkbox or a switch the words are the larger target, and `htmlFor` makes the whole line toggle the control. */
export function WithControls() {
  return (
    <YStack gap="$3" width={320}>
      <XStack gap="$2" items="center">
        <Checkbox id="terms" />
        <Label htmlFor="terms">I agree to the terms of service</Label>
      </XStack>
      <XStack items="center" justify="space-between">
        <Label htmlFor="build-alerts">Email me when a build fails</Label>
        <Switch id="build-alerts" />
      </XStack>
    </YStack>
  )
}

/** Required — the mark sits inside the label, so it is read with the caption and a click on it reaches the field like the rest of the words. */
export function Required() {
  return (
    <YStack gap="$4" width={320}>
      <YStack gap="$2">
        <Label htmlFor="full-name">
          Full name
          <Text color="$red10">*</Text>
        </Label>
        <Input id="full-name" placeholder="Ada Lovelace" />
      </YStack>
      <YStack gap="$2">
        <Label htmlFor="delivery-notes">Delivery notes</Label>
        <Textarea
          id="delivery-notes"
          placeholder="Gate code, floor, or where to leave the parcel"
        />
      </YStack>
    </YStack>
  )
}
