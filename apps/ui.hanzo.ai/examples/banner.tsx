import { useState } from "react"
import { YStack } from "@hanzo/gui"
import { Banner, Button } from "@hanzo/ui"

/** Default — a full-width strip with a message and no icon or close button. */
export function Default() {
  return <Banner>A new version of the app is available.</Banner>
}

/** Dismissible — a leading icon indents the message, and `onClose` reports the press; the banner keeps no visibility state, so the caller unmounts it. */
export function Dismissible() {
  const [open, setOpen] = useState(true)
  return (
    <YStack gap="$3" items="flex-start" width="100%">
      {open ? (
        <Banner variant="info" onClose={() => setOpen(false)}>
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx={12} cy={12} r={10} />
            <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Scheduled maintenance runs tonight from 2am to 3am UTC.
        </Banner>
      ) : (
        <Button variant="outline" onPress={() => setOpen(true)}>
          Show the banner again
        </Button>
      )}
    </YStack>
  )
}

/** Variants — `default`, `info`, `success`, `warning` and `error` each tint the border, background, icon and text. */
export function Variants() {
  return (
    <YStack gap="$2">
      <Banner>Default banner.</Banner>
      <Banner variant="info">Informational banner.</Banner>
      <Banner variant="success">Your changes were saved.</Banner>
      <Banner variant="warning">Your trial ends in three days.</Banner>
      <Banner variant="error">Payment failed — update your billing details.</Banner>
    </YStack>
  )
}
