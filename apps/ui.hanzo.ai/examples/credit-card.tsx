import { XStack, YStack } from "@hanzo/gui"
import { CreditCard } from "@hanzo/ui"

/** Default — a dark plate with a placeholder number, holder name and expiry. */
export function Default() {
  return <CreditCard />
}

/** Filled in — every field set, including the CVV badge in the corner. */
export function FilledIn() {
  return (
    <CreditCard
      number="4111 1111 1111 1111"
      name="ADA LOVELACE"
      expiry="09/30"
      cvv="123"
    />
  )
}

/** Minimal — a bordered surface instead of the dark plate, for a page that already carries its own color. */
export function Minimal() {
  return (
    <CreditCard
      variant="minimal"
      number="5500 0000 0000 0004"
      name="GRACE HOPPER"
      expiry="12/29"
    />
  )
}

/** Side by side — both variants at once, to compare the two treatments. */
export function SideBySide() {
  return (
    <XStack flexWrap="wrap" gap="$4">
      <YStack width={320}>
        <CreditCard name="ALAN TURING" expiry="06/28" />
      </YStack>
      <YStack width={320}>
        <CreditCard variant="minimal" name="ALAN TURING" expiry="06/28" />
      </YStack>
    </XStack>
  )
}
