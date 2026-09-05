import { useState } from "react"
import { XStack, YStack } from "@hanzo/gui"
import { Checkbox, Input, Label } from "@hanzo/ui"

/** Default — a box bound to its label by `id` and `htmlFor`, so clicking the words toggles it too; the shape of any single yes-or-no line in a form. */
export function Default() {
  return (
    <XStack gap="$2" items="center">
      <Checkbox id="terms" />
      <Label htmlFor="terms">I agree to the terms of service</Label>
    </XStack>
  )
}

/** States — the three values a box can show, then a disabled box off and on, for a setting the reader may see but not change. */
export function States() {
  return (
    <YStack gap="$3">
      <XStack gap="$2" items="center">
        <Checkbox id="unchecked" />
        <Label htmlFor="unchecked">Unchecked</Label>
      </XStack>
      <XStack gap="$2" items="center">
        <Checkbox id="checked" defaultChecked />
        <Label htmlFor="checked">Checked</Label>
      </XStack>
      <XStack gap="$2" items="center">
        <Checkbox id="indeterminate" defaultChecked="indeterminate" />
        <Label htmlFor="indeterminate">Indeterminate</Label>
      </XStack>
      <XStack gap="$2" items="center">
        <Checkbox id="off" disabled />
        <Label htmlFor="off">Disabled</Label>
      </XStack>
      <XStack gap="$2" items="center">
        <Checkbox id="off-checked" disabled defaultChecked />
        <Label htmlFor="off-checked">Disabled and checked</Label>
      </XStack>
    </YStack>
  )
}

/** Controlled — `checked` and `onCheckedChange` hold the value in React state, so the form shows a billing address field only while the box is off. */
export function Controlled() {
  const [same, setSame] = useState(true)
  return (
    <YStack gap="$3" width={320}>
      <XStack gap="$2" items="center">
        <Checkbox
          id="billing"
          checked={same}
          onCheckedChange={(next) => setSame(next === true)}
        />
        <Label htmlFor="billing">Billing address is the same as shipping</Label>
      </XStack>
      {same ? null : <Input placeholder="Billing address" />}
    </YStack>
  )
}

/** Select all — a parent box shows `indeterminate` while only some rows are checked and checks or clears them all when pressed, the head of any list with bulk actions. */
export function SelectAll() {
  const files = ["README.md", "package.json", "src/index.ts"]
  const [picked, setPicked] = useState(["README.md"])
  const all: boolean | "indeterminate" =
    picked.length === files.length
      ? true
      : picked.length === 0
        ? false
        : "indeterminate"
  return (
    <YStack gap="$2">
      <XStack gap="$2" items="center">
        <Checkbox
          id="all-files"
          checked={all}
          onCheckedChange={(next) => setPicked(next === true ? files : [])}
        />
        <Label htmlFor="all-files">All files</Label>
      </XStack>
      <YStack gap="$2" pl="$5">
        {files.map((file) => (
          <XStack key={file} gap="$2" items="center">
            <Checkbox
              id={file}
              name="files"
              value={file}
              checked={picked.includes(file)}
              onCheckedChange={(next) =>
                setPicked(
                  next === true
                    ? [...picked, file]
                    : picked.filter((f) => f !== file)
                )
              }
            />
            <Label htmlFor={file}>{file}</Label>
          </XStack>
        ))}
      </YStack>
    </YStack>
  )
}
