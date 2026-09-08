import { useState } from "react"
import { YStack } from "@hanzo/gui"
import { Button, MessageDock, type MessageDockMessage } from "@hanzo/ui"

/** Default — three typed cards, docked to the bottom-right corner. */
export function Default() {
  const messages: MessageDockMessage[] = [
    { id: "1", type: "success", title: "Success", description: "Your changes have been saved successfully." },
    { id: "2", type: "info", title: "Info", description: "New update available." },
    { id: "3", type: "warning", title: "Warning", description: "Please review your settings." },
  ]
  return (
    <YStack minH={200} position="relative">
      <MessageDock messages={messages} />
    </YStack>
  )
}

/** Positions — the same stack anchored to each of the four corners in turn. */
export function Positions() {
  const [position, setPosition] = useState<
    "top" | "bottom" | "top-right" | "bottom-right"
  >("bottom-right")
  const messages: MessageDockMessage[] = [
    { id: "1", type: "info", title: `Docked ${position}` },
  ]
  return (
    <YStack minH={200} position="relative" gap="$2">
      <YStack flexDirection="row" gap="$2" flexWrap="wrap">
        {(["top", "bottom", "top-right", "bottom-right"] as const).map((p) => (
          <Button key={p} size="sm" variant="outline" onPress={() => setPosition(p)}>
            {p}
          </Button>
        ))}
      </YStack>
      <MessageDock messages={messages} position={position} />
    </YStack>
  )
}

/** Dismissable — `onClose` removes a message from the caller's own state. */
export function Dismissable() {
  const [messages, setMessages] = useState<MessageDockMessage[]>([
    { id: "1", type: "error", title: "Upload failed", description: "The file exceeded 10 MB." },
    { id: "2", type: "success", title: "Profile updated" },
  ])
  return (
    <YStack minH={200} position="relative">
      <MessageDock
        messages={messages}
        onClose={(id) => setMessages((prev) => prev.filter((m) => m.id !== id))}
      />
    </YStack>
  )
}
