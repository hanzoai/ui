import { useState } from "react"
import { Text, XStack, YStack } from "@hanzo/gui"
import { Button, DesktopWindow } from "@hanzo/ui"

/** Default — a title bar with traffic lights over a content area; drag the bar to move it, drag the corner to resize. */
export function Default() {
  return (
    <YStack height={360} position="relative">
      <DesktopWindow
        title="Editor"
        initialPosition={{ x: 20, y: 20 }}
        initialSize={{ width: 420, height: 260 }}
      >
        <YStack p="$4" gap="$2">
          <Text fontWeight="600">Window content</Text>
          <Text color="$color11">Drag the title bar to move it.</Text>
        </YStack>
      </DesktopWindow>
    </YStack>
  )
}

/** Window types — the four documented surfaces: default, dark, light and transparent. */
export function WindowTypes() {
  return (
    <XStack height={220} gap="$4" flexWrap="wrap">
      {(["default", "dark", "light", "transparent"] as const).map((windowType, i) => (
        <YStack key={windowType} height={200} width={220} position="relative">
          <DesktopWindow
            title={windowType}
            windowType={windowType}
            initialPosition={{ x: 0, y: 0 }}
            initialSize={{ width: 200, height: 140 }}
            draggable={false}
            resizable={false}
            hideControls={i === 3}
          >
            <YStack p="$3">
              <Text>{windowType} window</Text>
            </YStack>
          </DesktopWindow>
        </YStack>
      ))}
    </XStack>
  )
}

/** Controlled close — the close light calls back into your own state, so the window can be reopened from a button. */
export function ControlledClose() {
  const [open, setOpen] = useState(true)
  return (
    <YStack height={300} position="relative" gap="$3">
      {!open ? (
        <Button variant="outline" onPress={() => setOpen(true)}>
          Reopen Settings
        </Button>
      ) : null}
      {open ? (
        <DesktopWindow
          title="Settings"
          onClose={() => setOpen(false)}
          initialPosition={{ x: 10, y: 10 }}
          initialSize={{ width: 360, height: 220 }}
        >
          <YStack p="$4" gap="$2">
            <Text>Settings content goes here.</Text>
          </YStack>
        </DesktopWindow>
      ) : null}
    </YStack>
  )
}

/** No controls — `hideControls` drops the traffic lights for a window whose state is shown elsewhere. */
export function NoControls() {
  return (
    <YStack height={220} position="relative">
      <DesktopWindow
        title="Read-only preview"
        hideControls
        draggable={false}
        resizable={false}
        initialPosition={{ x: 0, y: 0 }}
        initialSize={{ width: 320, height: 180 }}
      >
        <YStack p="$4">
          <Text>No traffic lights, no drag, no resize.</Text>
        </YStack>
      </DesktopWindow>
    </YStack>
  )
}
