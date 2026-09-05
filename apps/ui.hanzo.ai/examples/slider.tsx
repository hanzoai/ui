import { useState } from "react"
import { Paragraph, Text, XStack, YStack } from "@hanzo/gui"
import { Label, Slider } from "@hanzo/ui"

/** Default — one thumb on a full-width track, 0 to 100 unless `min` and `max` say otherwise; `defaultValue` is an array, and `aria-label` names the control for a screen reader. */
export function Default() {
  return (
    <YStack width={320}>
      <Slider defaultValue={[40]} aria-label="Volume" />
    </YStack>
  )
}

/** Bounds and step — `min` and `max` bound the track and `step` fixes where between them the thumb can land; `aria-labelledby` names each slider after the label above it. */
export function BoundsAndStep() {
  return (
    <YStack width={320} gap="$5">
      <YStack gap="$2">
        <Label id="temperature">Temperature</Label>
        <Slider
          defaultValue={[0.7]}
          min={0}
          max={2}
          step={0.1}
          aria-labelledby="temperature"
        />
      </YStack>
      <YStack gap="$2">
        <Label id="context">Context window, thousands of tokens</Label>
        <Slider
          defaultValue={[32]}
          min={8}
          max={128}
          step={8}
          aria-labelledby="context"
        />
      </YStack>
    </YStack>
  )
}

/** Disabled — `disabled` takes the thumb out of the tab order and ignores every pointer and key; `aria-describedby` points at the line that says why. */
export function Disabled() {
  return (
    <YStack width={320} gap="$2">
      <Label id="replicas" opacity={0.5}>
        Replicas
      </Label>
      <Slider
        defaultValue={[1]}
        min={1}
        max={10}
        disabled
        aria-labelledby="replicas"
        aria-describedby="replicas-plan"
      />
      <Text id="replicas-plan" fontSize="$2" color="$color10">
        Fixed at one on the free plan.
      </Text>
    </YStack>
  )
}

/** Controlled — `value` and `onValueChange` keep the number in React state, so the label can show it and `aria-valuetext` can say it in words. */
export function Controlled() {
  const [tokens, setTokens] = useState([2048])
  return (
    <YStack width={320} gap="$2">
      <XStack justify="space-between" items="center">
        <Label id="max-tokens">Max tokens</Label>
        <Text fontSize="$2" color="$color11">
          {tokens[0]}
        </Text>
      </XStack>
      <Slider
        value={tokens}
        onValueChange={setTokens}
        min={256}
        max={8192}
        step={256}
        aria-labelledby="max-tokens"
        aria-valuetext={`${tokens[0]} tokens`}
      />
      <Paragraph color="$color10">
        {tokens[0] >= 4096
          ? "Long answers, slower and pricier."
          : "Short answers, fast and cheap."}
      </Paragraph>
    </YStack>
  )
}
