import { useState } from "react"
import { Text, YStack } from "@hanzo/gui"
import { ColorPicker } from "@hanzo/ui"

/** Default — a swatch button opens a hue and saturation panel plus a hex field; drag either, or type a hex value, and the swatch and label update together. */
export function Default() {
  return <ColorPicker value="#3b82f6" />
}

/** Presets — `presets` renders a row of swatches under the fields for a one-click pick, alongside the hue, saturation and hex controls. */
export function Presets() {
  return (
    <ColorPicker
      value="#f97316"
      presets={["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"]}
    />
  )
}

/** Disabled — `disabled` dims the trigger and ignores every drag, keystroke and preset click. */
export function Disabled() {
  return <ColorPicker value="#22c55e" disabled />
}

/** Controlled — `onChange` fires on every hue drag, saturation drag, hex edit and preset click, so the picked value can drive anything else on the page. */
export function Controlled() {
  const [color, setColor] = useState("#8b5cf6")
  return (
    <YStack gap="$3" items="flex-start">
      <ColorPicker value={color} onChange={setColor} />
      <Text fontFamily="$mono" fontSize="$2" color="$color11">
        {color}
      </Text>
    </YStack>
  )
}
