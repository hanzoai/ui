import { useState } from "react"
import { Paragraph, Text, YStack } from "@hanzo/gui"
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerHandle,
  DrawerTrigger,
} from "@hanzo/ui"

/** Default — a sheet that slides up from the bottom edge, with its own handle. */
export function Default() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open</Button>
      </DrawerTrigger>
      <DrawerContent>
        <YStack p="$5" gap="$2">
          <Text fontWeight="600">Move to trash?</Text>
          <Paragraph color="$color11">
            The file stays recoverable for thirty days.
          </Paragraph>
        </YStack>
      </DrawerContent>
    </Drawer>
  )
}

/** Snap points — the sheet rests at a third of the viewport, then the top. */
export function SnapPoints() {
  return (
    <Drawer snapPoints={[0.33, 1]}>
      <DrawerTrigger asChild>
        <Button variant="outline">Open at a third</Button>
      </DrawerTrigger>
      <DrawerContent>
        <YStack p="$5" gap="$2">
          <Text fontWeight="600">Nearby</Text>
          <Paragraph color="$color11">
            Drag the handle up for the full list.
          </Paragraph>
        </YStack>
      </DrawerContent>
    </Drawer>
  )
}

/** Controlled — the app owns `open`, so a button inside can close it. */
export function Controlled() {
  const [open, setOpen] = useState(false)
  return (
    <Drawer open={open} onOpenChange={setOpen} dragHandleOnly>
      <DrawerTrigger asChild>
        <Button variant="outline">{open ? "Opened" : "Open"}</Button>
      </DrawerTrigger>
      <DrawerContent defaultHandle={false}>
        <DrawerHandle />
        <YStack p="$5" gap="$3">
          <Paragraph>
            Only the handle drags, so this content can scroll.
          </Paragraph>
          <Button onPress={() => setOpen(false)}>Done</Button>
        </YStack>
      </DrawerContent>
    </Drawer>
  )
}
