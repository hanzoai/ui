import { useState } from "react"
import { YStack } from "@hanzo/gui"
import { DialogStack, type DialogStackItem } from "@hanzo/ui"

const initial: DialogStackItem[] = [
  { id: "1", title: "Welcome", content: "This is the first dialog in the stack." },
  { id: "2", title: "Settings", content: "Configure your application settings here." },
  { id: "3", title: "Confirmation", content: "Are you sure you want to proceed?" },
]

/** Default — three panels offset diagonally, the last one in the list on top. */
export function Default() {
  return (
    <YStack width="100%" minH={220} items="center" justify="center">
      <DialogStack width={320} height={160} dialogs={initial} />
    </YStack>
  )
}

/** Closeable — each corner button removes its own panel from the stack, revealing the one behind it. */
export function Closeable() {
  const [dialogs, setDialogs] = useState(initial)
  return (
    <YStack width="100%" minH={220} items="center" justify="center">
      <DialogStack
        width={320}
        height={160}
        dialogs={dialogs}
        onClose={(id) => setDialogs((rest) => rest.filter((d) => d.id !== id))}
      />
    </YStack>
  )
}

/** Two panels — the stack works with any number of dialogs, not only three. */
export function TwoPanels() {
  return (
    <YStack width="100%" minH={200} items="center" justify="center">
      <DialogStack
        width={280}
        height={140}
        dialogs={[
          { id: "a", title: "Draft", content: "Unsaved changes." },
          { id: "b", title: "Review", content: "Ready to publish." },
        ]}
      />
    </YStack>
  )
}
