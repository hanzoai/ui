import { useEffect, useState } from "react"
import { Text, XStack, YStack } from "@hanzo/gui"
import { Button, Spinner } from "@hanzo/ui"
import { Check } from "@hanzogui/lucide-icons-2"

/** Default — a 16-pixel arc in the color of the text around it, the size a button label or a table row wants. */
export function Default() {
  return <Spinner />
}

/** Sizes — `size` is the edge of the arc in pixels: 12 inside a line of small text, 16 beside body text, 24 in a list row, 40 in an empty panel. */
export function Sizes() {
  return (
    <XStack gap="$4" items="center">
      <Spinner size={12} />
      <Spinner size={16} />
      <Spinner size={24} />
      <Spinner size={40} />
    </XStack>
  )
}

/** Color — the arc is stroked in `currentColor`, so it takes the ink of the text or button it sits in; `color` sets it outright with a theme token or any CSS color. */
export function Color() {
  return (
    <XStack gap="$4" items="center">
      <Text color="$red10">
        <Spinner />
      </Text>
      <Button variant="primary">
        <Spinner size={14} />
        Publishing
      </Button>
      <Spinner color="$blue10" />
      <Spinner color="#0a8f5c" />
    </XStack>
  )
}

/** Steps — the step in flight gets the spinner, on the same 16-pixel grid as the check beside a finished one; the arc is `aria-hidden`, so the words carry the state. */
export function Steps() {
  return (
    <YStack gap="$2">
      <XStack gap="$2" items="center">
        <Check size={16} color="$green10" />
        <Text>Build image</Text>
      </XStack>
      <XStack gap="$2" items="center">
        <Spinner />
        <Text>Push to oci.hanzo.ai</Text>
      </XStack>
      <XStack gap="$2" items="center" opacity={0.5}>
        <YStack width={16} />
        <Text>Roll out to production</Text>
      </XStack>
    </YStack>
  )
}

/** Controlled — the spinner is mounted for exactly as long as the request is in flight, and the text beside it says which state you are in. */
export function Controlled() {
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!busy) return
    const timer = setTimeout(() => setBusy(false), 1500)
    return () => clearTimeout(timer)
  }, [busy])
  return (
    <XStack gap="$3" items="center">
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onPress={() => setBusy(true)}
      >
        Refresh
      </Button>
      {busy ? <Spinner /> : <Check size={16} />}
      <Text color="$color11">
        {busy ? "Fetching latest prices" : "Prices are current"}
      </Text>
    </XStack>
  )
}
