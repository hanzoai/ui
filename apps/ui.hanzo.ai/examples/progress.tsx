import { useState } from "react"
import { Text, XStack, YStack } from "@hanzo/gui"
import { Button, Progress } from "@hanzo/ui"

/** Default — a track and a bar filled to `value`, out of 100 unless `max` says otherwise. */
export function Default() {
  return (
    <YStack width={320}>
      <Progress value={40} />
    </YStack>
  )
}

/** Sizes — `height` sets the thickness; 8 is the default, 4 suits a table row and 12 a page-level task. */
export function Sizes() {
  return (
    <YStack width={320} gap="$4">
      <Progress value={65} height={4} />
      <Progress value={65} />
      <Progress value={65} height={12} />
    </YStack>
  )
}

/** Thresholds — `indicatorClassName` colours the moving bar and not the track, so a quota keeps the default ink until it nears its limit, then turns amber and red. */
export function Thresholds() {
  const quotas = [
    { name: "Storage", used: 42 },
    { name: "API requests", used: 78 },
    { name: "Seats", used: 96 },
  ]
  const tone = (used: number) =>
    used >= 90 ? "bg-red9" : used >= 75 ? "bg-yellow9" : undefined
  return (
    <YStack width={320} gap="$4">
      {quotas.map((q) => (
        <YStack key={q.name} gap="$2">
          <XStack justify="space-between">
            <Text fontSize="$2">{q.name}</Text>
            <Text fontSize="$2" color="$color11">
              {q.used}%
            </Text>
          </XStack>
          <Progress value={q.used} indicatorClassName={tone(q.used)} />
        </YStack>
      ))}
    </YStack>
  )
}

/** Controlled — `value` and `max` come from state, here the step of a setup flow, and `getValueLabel` is the text a screen reader announces. */
export function Controlled() {
  const steps = [
    "Create a workspace",
    "Invite your team",
    "Connect a repository",
    "Run the first build",
  ]
  const [step, setStep] = useState(1)
  return (
    <YStack width={320} gap="$3">
      <XStack justify="space-between">
        <Text fontSize="$2">{steps[step - 1]}</Text>
        <Text fontSize="$2" color="$color11">
          {step} of {steps.length}
        </Text>
      </XStack>
      <Progress
        value={step}
        max={steps.length}
        getValueLabel={(v, m) => `Step ${v} of ${m}`}
      />
      <XStack gap="$2" justify="flex-end">
        <Button
          variant="outline"
          size="sm"
          disabled={step === 1}
          onPress={() => setStep(step - 1)}
        >
          Back
        </Button>
        <Button
          size="sm"
          disabled={step === steps.length}
          onPress={() => setStep(step + 1)}
        >
          Next
        </Button>
      </XStack>
    </YStack>
  )
}
