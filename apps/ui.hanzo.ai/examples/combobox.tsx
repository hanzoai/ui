import { useState } from "react"
import { Circle, CheckCircle2, HelpCircle } from "@hanzogui/lucide-icons-2"
import { Text, XStack } from "@hanzo/gui"
import { Combobox, ComboboxWithIcons } from "@hanzo/ui"

const frameworks = [
  { value: "next.js", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt.js", label: "Nuxt.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
]

/** Default — a button trigger shows the picked framework and drops a searchable list; picking the same row again clears it. */
export function Default() {
  const [value, setValue] = useState("")
  return (
    <Combobox
      options={frameworks}
      value={value}
      onChange={setValue}
      placeholder="Select framework..."
      searchPlaceholder="Search framework..."
      emptyText="No framework found."
    />
  )
}

const statuses = [
  { value: "backlog", label: "Backlog", icon: HelpCircle },
  { value: "todo", label: "Todo", icon: Circle },
  { value: "done", label: "Done", icon: CheckCircle2 },
]

/** With icons — each option, and the trigger once one is picked, carries a leading glyph. */
export function WithIcons() {
  const [value, setValue] = useState("todo")
  return (
    <XStack items="center" gap="$4">
      <Text color="$quiet" fontSize="$3">
        Status
      </Text>
      <ComboboxWithIcons
        options={statuses}
        value={value}
        onChange={setValue}
        placeholder="Set status..."
        searchPlaceholder="Change status..."
        width={160}
      />
    </XStack>
  )
}

/** Disabled — the trigger reports itself unusable and the panel never opens. */
export function Disabled() {
  return (
    <Combobox
      options={frameworks}
      placeholder="Select framework..."
      disabled
    />
  )
}
