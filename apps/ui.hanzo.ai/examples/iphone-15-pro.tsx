import { SizableText, YStack } from "@hanzo/gui"
import { IPhone15Pro } from "@hanzo/ui"

/** Default — a black iPhone 15 Pro frame with a plain screen. */
export function Default() {
  return <IPhone15Pro />
}

/** Sizes — the default, pro-max and mini frames side by side. */
export function Sizes() {
  return (
    <YStack flexDirection="row" flexWrap="wrap" gap="$6" items="flex-start">
      <IPhone15Pro variant="mini" />
      <IPhone15Pro variant="default" />
      <IPhone15Pro variant="pro-max" />
    </YStack>
  )
}

/** Colors — the four documented finishes. */
export function Colors() {
  return (
    <YStack flexDirection="row" flexWrap="wrap" gap="$6" items="flex-start">
      <IPhone15Pro color="black" />
      <IPhone15Pro color="white" />
      <IPhone15Pro color="blue" />
      <IPhone15Pro color="natural" />
    </YStack>
  )
}

/** With content — arbitrary UI filling the screen, clipped to its corners. */
export function WithContent() {
  return (
    <IPhone15Pro variant="mini">
      <YStack flex={1} items="center" justify="center" bg="$background">
        <SizableText size="$6" fontWeight="600">
          9:41
        </SizableText>
      </YStack>
    </IPhone15Pro>
  )
}
