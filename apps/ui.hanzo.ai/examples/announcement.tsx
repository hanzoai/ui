import { useState } from "react"
import { Paragraph, YStack } from "@hanzo/gui"
import { Announcement, Button } from "@hanzo/ui"

/** Default — a dismissible strip; the corner button removes it from the page. */
export function Default() {
  return (
    <Announcement>
      🎉 <strong>New feature!</strong> Check out our latest component updates
      and improvements.
    </Announcement>
  )
}

/** Not dismissible — `dismissible={false}` drops the close button for a message that must stay. */
export function NotDismissible() {
  return (
    <Announcement dismissible={false}>
      Scheduled maintenance tonight from 11pm to 1am UTC.
    </Announcement>
  )
}

/** With callback — `onDismiss` fires once as the strip removes itself; the strip keeps its own visibility, so bringing it back means mounting a fresh one. */
export function WithCallback() {
  const [shown, setShown] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  return (
    <YStack gap="$3" items="flex-start">
      <Announcement key={shown} onDismiss={() => setDismissed(true)}>
        We use cookies to improve your experience.
      </Announcement>
      {dismissed ? (
        <YStack gap="$2" items="flex-start">
          <Paragraph color="$color11">Dismissed — onDismiss ran.</Paragraph>
          <Button
            variant="outline"
            onPress={() => {
              setShown((n) => n + 1)
              setDismissed(false)
            }}
          >
            Show it again
          </Button>
        </YStack>
      ) : null}
    </YStack>
  )
}

/** Stacked — several announcements one after another, each dismissed independently. */
export function Stacked() {
  return (
    <YStack gap="$3">
      <Announcement>New: dark mode is here.</Announcement>
      <Announcement dismissible={false}>
        Your trial ends in 3 days.
      </Announcement>
    </YStack>
  )
}
