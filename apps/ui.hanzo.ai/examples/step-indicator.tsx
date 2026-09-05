import { useState } from "react"
import { Paragraph, XStack, YStack } from "@hanzo/gui"
import { Button, StepIndicator } from "@hanzo/ui"

/** Default — a checkout on its second step: the first dot and the rule after it are filled, the rest wait. */
export function Default() {
  return (
    <YStack maxW={480}>
      <StepIndicator
        steps={["Cart", "Shipping", "Payment", "Review"]}
        currentStep={1}
      />
    </YStack>
  )
}

/** Dot size — `dotSizeRem` is a number in rem, so the dot keeps its size when the type size changes. */
export function DotSize() {
  return (
    <YStack gap="$5" maxW={480}>
      <StepIndicator
        steps={["Upload", "Map columns", "Import"]}
        currentStep={1}
        dotSizeRem={0.5}
      />
      <StepIndicator
        steps={["Upload", "Map columns", "Import"]}
        currentStep={1}
      />
      <StepIndicator
        steps={["Upload", "Map columns", "Import"]}
        currentStep={1}
        dotSizeRem={1.5}
      />
    </YStack>
  )
}

/** Controlled — `currentStep` comes from the form's state; the indicator only shows where you are, the buttons move you. */
export function Controlled() {
  const steps = ["Account", "Workspace", "Invite team", "Done"]
  const [step, setStep] = useState(0)
  return (
    <YStack gap="$4" maxW={480}>
      <StepIndicator steps={steps} currentStep={step} />
      <Paragraph color="$quiet">
        Step {step + 1} of {steps.length}: {steps[step]}
      </Paragraph>
      <XStack gap="$2">
        <Button
          variant="outline"
          disabled={step === 0}
          onPress={() => setStep(step - 1)}
        >
          Back
        </Button>
        <Button
          variant="primary"
          disabled={step === steps.length - 1}
          onPress={() => setStep(step + 1)}
        >
          Next
        </Button>
      </XStack>
    </YStack>
  )
}

/** Finished — the last step is current, so every dot and rule is filled and the progressbar reads its maximum. */
export function Finished() {
  return (
    <YStack maxW={480}>
      <StepIndicator steps={["Build", "Test", "Publish"]} currentStep={2} />
    </YStack>
  )
}
