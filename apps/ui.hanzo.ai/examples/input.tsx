import { useState } from "react"
import { Text, XStack, YStack } from "@hanzo/gui"
import { Button, Input, Label } from "@hanzo/ui"
import { Mail, Search } from "@hanzogui/lucide-icons-2"

/** Default — a single-line text field with a placeholder, for any free text short enough to fit on one line. */
export function Default() {
  return (
    <YStack width={320}>
      <Input placeholder="Organization name" />
    </YStack>
  )
}

/** States — a disabled field takes no focus or input; a read-only one shows a value you can select and copy but not change. */
export function States() {
  return (
    <YStack width={320} gap="$3">
      <Input disabled defaultValue="us-east-1" />
      <Input readOnly defaultValue="api.hanzo.ai" />
    </YStack>
  )
}

/** Adornments — an icon at the start or a unit at the end is drawn inside the field, for a search icon, a currency or a domain suffix. */
export function Adornments() {
  return (
    <YStack width={320} gap="$3">
      <Input
        startAdornment={<Search size={16} />}
        placeholder="Search models"
      />
      <Input
        endAdornment={<Text fontSize="$2">USD</Text>}
        placeholder="0.00"
        inputMode="decimal"
      />
      <Input
        startAdornment={<Mail size={16} />}
        endAdornment={<Text fontSize="$2">@hanzo.ai</Text>}
        placeholder="name"
      />
    </YStack>
  )
}

/** Password — `type="password"` masks the value and draws an eye that reveals it; with `reveal={false}` the eye is left out and the toggle is yours to draw. */
export function Password() {
  const [shown, setShown] = useState(false)
  return (
    <YStack width={320} gap="$3">
      <Input type="password" defaultValue="correct horse battery staple" />
      <XStack gap="$2" items="center">
        <YStack flex={1}>
          <Input
            type={shown ? "text" : "password"}
            reveal={false}
            defaultValue="correct horse battery staple"
          />
        </YStack>
        <Button variant="outline" size="sm" onPress={() => setShown((v) => !v)}>
          {shown ? "Hide" : "Show"}
        </Button>
      </XStack>
    </YStack>
  )
}

/** Controlled — `value` and `onChangeText` keep the text in React state, `maxLength` caps it, and a Label bound by `htmlFor` focuses the field when clicked. */
export function Controlled() {
  const [name, setName] = useState("")
  return (
    <YStack width={320} gap="$2">
      <Label htmlFor="project-name">Project name</Label>
      <Input
        id="project-name"
        value={name}
        onChangeText={setName}
        placeholder="my-agent"
        maxLength={32}
      />
      <Text fontSize="$2" color="$quiet">
        {name.length}/32
      </Text>
    </YStack>
  )
}
