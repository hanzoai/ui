import { XStack } from "@hanzo/gui"
import { Android, Button } from "@hanzo/ui"

/** Default — the robot at its largest size, in Android green. */
export function Default() {
  return <Android size="xl" color="#3DDC84" />
}

/** Sizes — sm, default, lg and xl are 16, 24, 32 and 48px. */
export function Sizes() {
  return (
    <XStack gap="$4" items="center">
      <Android size="sm" />
      <Android size="default" />
      <Android size="lg" />
      <Android size="xl" />
    </XStack>
  )
}

/** Colors — any CSS color fills the robot, and the eyes turn black so they stay visible on it; `currentColor` hands the fill back to the text around it. */
export function Colors() {
  return (
    <XStack gap="$4" items="center">
      <Android color="#3DDC84" size="xl" />
      <Android color="#FF6B6B" size="xl" />
      <Android color="#4ECDC4" size="xl" />
      <Android color="currentColor" size="xl" />
    </XStack>
  )
}

/** In a button — with no color set the robot takes the button's ink, on hover too, so icon and label read as one control; the icon is `aria-hidden`, so the words carry the name. */
export function InButton() {
  return (
    <XStack gap="$3" items="center">
      <Button variant="outline">
        <Android size="sm" aria-hidden />
        Get it on Android
      </Button>
      <Button variant="primary" size="lg">
        <Android aria-hidden />
        Download the app
      </Button>
    </XStack>
  )
}
