import { useState } from "react"
import { Paragraph, Text, XStack, YStack } from "@hanzo/gui"
import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
  type SheetSide,
} from "@hanzo/ui"

/** Default — a trigger opens a panel from the right edge with a title, a description, a body and a footer that closes it. */
export function Default() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Recent activity</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Recent activity</SheetTitle>
          <SheetDescription>
            What changed in this workspace today.
          </SheetDescription>
        </SheetHeader>
        <YStack gap="$3">
          <YStack>
            <Text>Mara merged the attachments search</Text>
            <Text fontSize="$2" color="$color11">
              12 minutes ago
            </Text>
          </YStack>
          <YStack>
            <Text>Deploy to production finished</Text>
            <Text fontSize="$2" color="$color11">
              1 hour ago
            </Text>
          </YStack>
          <YStack>
            <Text>Tomas opened a pull request on billing</Text>
            <Text fontSize="$2" color="$color11">
              3 hours ago
            </Text>
          </YStack>
        </YStack>
        <SheetFooter>
          <SheetClose asChild>
            <Button>Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/** Sides — `side` picks the edge; right and left fill the height, top and bottom fill the width. */
export function Sides() {
  const sides: SheetSide[] = ["top", "right", "bottom", "left"]
  return (
    <XStack flexWrap="wrap" gap="$3">
      {sides.map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button variant="outline">{side}</Button>
          </SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>From the {side}</SheetTitle>
              <SheetDescription>
                {side === "top" || side === "bottom"
                  ? "Full width, at most 80% of the viewport tall."
                  : "Full height, at most 384px wide."}
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      ))}
    </XStack>
  )
}

/** Controlled — `open` and `onOpenChange` hand the state to you, so choosing a section can close the menu itself. */
export function Controlled() {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState("Overview")
  const sections = ["Overview", "Deployments", "Logs", "Settings"]
  return (
    <YStack gap="$3" items="flex-start">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline">Menu</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Navigate</SheetTitle>
            <SheetDescription>Pick a section to jump to.</SheetDescription>
          </SheetHeader>
          <YStack gap="$1" items="stretch">
            {sections.map((name) => (
              <Button
                key={name}
                variant={name === section ? "secondary" : "ghost"}
                onPress={() => {
                  setSection(name)
                  setOpen(false)
                }}
              >
                {name}
              </Button>
            ))}
          </YStack>
        </SheetContent>
      </Sheet>
      <Paragraph color="$color11">Viewing {section}</Paragraph>
    </YStack>
  )
}

/** Own overlay — `SheetPortal` and `SheetOverlay` are what Content mounts for you; mount them yourself when the scrim carries a hint, with Content's own switched off through `overlay={{ display: 'none' }}`. */
export function OwnOverlay() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Share</Button>
      </SheetTrigger>
      <SheetPortal>
        <SheetOverlay
          bg="black"
          opacity={0.8}
          justify="flex-start"
          items="center"
          pt="$6"
        >
          <Text color="white" fontSize="$2">
            Tap outside to close
          </Text>
        </SheetOverlay>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          overlay={{ display: "none" }}
        >
          <SheetHeader>
            <SheetTitle>Share quarterly-report.pdf</SheetTitle>
            <SheetDescription>Anyone with the link can view.</SheetDescription>
          </SheetHeader>
          <XStack gap="$2" flexWrap="wrap">
            <Button variant="secondary">Copy link</Button>
            <Button variant="secondary">Email</Button>
            <Button variant="secondary">Slack</Button>
          </XStack>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="ghost">Cancel</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </SheetPortal>
    </Sheet>
  )
}
