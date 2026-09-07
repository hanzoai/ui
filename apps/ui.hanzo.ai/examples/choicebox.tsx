import { useState } from "react"
import { Paragraph, YStack } from "@hanzo/gui"
import { Choicebox } from "@hanzo/ui"

const plans = [
  { value: "starter", label: "Starter", description: "For a single project, 5 seats." },
  { value: "team", label: "Team", description: "Unlimited projects, 25 seats." },
  { value: "enterprise", label: "Enterprise", description: "SSO, audit logs, no seat cap." },
]

/** Default — one plan at a time; clicking a card never clears the choice. */
export function Default() {
  return (
    <YStack maxW={420} width="100%">
      <Choicebox options={plans} defaultValue="team" />
    </YStack>
  )
}

/** Multiple — `multiple` turns each card into its own checkbox, so any number can be on. */
export function Multiple() {
  const notifications = [
    { value: "email", label: "Email", description: "A digest every morning." },
    { value: "push", label: "Push", description: "As soon as it happens." },
    { value: "sms", label: "SMS", description: "Only for incidents." },
  ]
  return (
    <YStack maxW={420} width="100%">
      <Choicebox options={notifications} defaultValue="email,push" multiple />
    </YStack>
  )
}

/** Controlled — `value` and `onChange` hand the choice to you, as a plain string. */
export function Controlled() {
  const [plan, setPlan] = useState("starter")
  return (
    <YStack gap="$3" maxW={420} width="100%">
      <Choicebox options={plans} value={plan} onChange={setPlan} />
      <Paragraph color="$quiet">You picked {plan}.</Paragraph>
    </YStack>
  )
}

/** Without a description — the label alone is enough for a short list of options. */
export function LabelOnly() {
  const sizes = [
    { value: "s", label: "Small" },
    { value: "m", label: "Medium" },
    { value: "l", label: "Large" },
  ]
  return (
    <YStack maxW={280} width="100%">
      <Choicebox options={sizes} defaultValue="m" />
    </YStack>
  )
}
