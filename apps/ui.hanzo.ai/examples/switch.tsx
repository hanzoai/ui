import { useState, type FormEvent } from "react"
import { Paragraph, Text, XStack, YStack } from "@hanzo/gui"
import { Button, Label, Switch } from "@hanzo/ui"

/** Default — a switch bound to its label by `id` and `htmlFor`, so clicking the words flips it as well as the pill. */
export function Default() {
  return (
    <XStack gap="$3" items="center">
      <Switch id="auto-deploy" />
      <Label htmlFor="auto-deploy">Deploy on every merge to main</Label>
    </XStack>
  )
}

/** States — off, on by `defaultChecked`, then a disabled switch held in either position. */
export function States() {
  return (
    <YStack gap="$3">
      <XStack gap="$3" items="center">
        <Switch id="off" />
        <Label htmlFor="off">Off</Label>
      </XStack>
      <XStack gap="$3" items="center">
        <Switch id="on" defaultChecked />
        <Label htmlFor="on">On</Label>
      </XStack>
      <XStack gap="$3" items="center">
        <Switch id="locked-off" disabled />
        <Label htmlFor="locked-off">Disabled</Label>
      </XStack>
      <XStack gap="$3" items="center">
        <Switch id="locked-on" disabled defaultChecked />
        <Label htmlFor="locked-on">Disabled and on</Label>
      </XStack>
    </YStack>
  )
}

/** Controlled — `checked` and `onCheckedChange` keep the switch in React state, here to say what visitors will see. */
export function Controlled() {
  const [maintenance, setMaintenance] = useState(false)
  return (
    <YStack gap="$3">
      <XStack gap="$3" items="center">
        <Switch
          id="maintenance"
          checked={maintenance}
          onCheckedChange={setMaintenance}
        />
        <Label htmlFor="maintenance">Maintenance mode</Label>
      </XStack>
      <Paragraph color="$color10">
        {maintenance
          ? "Visitors see a holding page until this is turned off."
          : "The site is serving traffic."}
      </Paragraph>
    </YStack>
  )
}

/** Settings — the row a switch is made for: a name and a line of detail on the left, the control on the right, one row per preference. */
export function Settings() {
  const rows = [
    {
      id: "push",
      name: "Push notifications",
      detail: "Failed builds and finished deploys, as they happen.",
      on: true,
    },
    {
      id: "digest",
      name: "Weekly digest",
      detail: "One email on Monday with usage and spend for the week.",
      on: false,
    },
    {
      id: "mentions",
      name: "Mentions only",
      detail: "Quiet every thread you are not named in.",
      on: true,
    },
  ]
  return (
    <YStack width={360} gap="$4">
      {rows.map((row) => (
        <XStack key={row.id} gap="$4" items="center" justify="space-between">
          <YStack flex={1} gap="$1">
            <Label htmlFor={row.id}>{row.name}</Label>
            <Text fontSize="$2" color="$color10">
              {row.detail}
            </Text>
          </YStack>
          <Switch id={row.id} defaultChecked={row.on} />
        </XStack>
      ))}
    </YStack>
  )
}

/** In a form — `name` and `value` put the switch on the form as a checkbox input, so a submit reads it like any other field. */
export function InForm() {
  const [saved, setSaved] = useState("")
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const backups = new FormData(event.currentTarget).get("backups")
    setSaved(
      backups === "nightly" ? "Nightly backups are on." : "Backups are off."
    )
  }
  return (
    <form onSubmit={submit}>
      <YStack gap="$3" items="flex-start">
        <XStack gap="$3" items="center">
          <Switch id="backups" name="backups" value="nightly" defaultChecked />
          <Label htmlFor="backups">Back up the database every night</Label>
        </XStack>
        <Button type="submit" variant="outline">
          Save
        </Button>
        {saved ? <Paragraph color="$color10">{saved}</Paragraph> : null}
      </YStack>
    </form>
  )
}
