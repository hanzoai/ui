import { XStack } from '@hanzo/gui'
import { StatusTag } from '@hanzo/ui/product'

/** The vocabulary maps free-form status strings to one of four tones. */
export function Variants() {
  return (
    <XStack flexWrap="wrap" gap="$3" items="center">
      <StatusTag status="running" />
      <StatusTag status="deploying" />
      <StatusTag status="failed" />
      <StatusTag status="archived" />
    </XStack>
  )
}

/** Unrecognized still renders, honestly, rather than guessing a tone. */
export function Unknown() {
  return <StatusTag status="flurbled" />
}

/** A caller can override the tone the vocabulary would have chosen. */
export function OverrideTone() {
  return <StatusTag status="on hold" tone="stopped" />
}
