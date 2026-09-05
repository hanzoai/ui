import { useState } from "react"
import { Paragraph, Text, XStack, YStack } from "@hanzo/gui"
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from "@hanzo/ui"

/** Default — a button opens a modal panel with a title, a description, a body and a footer; Escape, the corner X, a click outside or the Done button closes it. */
export function Default() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Keyboard shortcuts</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Press ? anywhere to open this list.
          </DialogDescription>
        </DialogHeader>
        <YStack gap="$2">
          <XStack justify="space-between">
            <Text>Open the command palette</Text>
            <Text fontFamily="$mono">⌘ K</Text>
          </XStack>
          <XStack justify="space-between">
            <Text>Search files</Text>
            <Text fontFamily="$mono">⌘ P</Text>
          </XStack>
          <XStack justify="space-between">
            <Text>Toggle the sidebar</Text>
            <Text fontFamily="$mono">⌘ B</Text>
          </XStack>
        </YStack>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Without close button — `showCloseButton={false}` removes the corner X, so the footer's Got it is the panel's only button; Escape and a click outside still close it. */
export function WithoutCloseButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Release notes</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Version 2.4</DialogTitle>
          <DialogDescription>
            Three changes, released this week.
          </DialogDescription>
        </DialogHeader>
        <YStack gap="$2">
          <Text>Threads can be pinned to the top of a channel.</Text>
          <Text>Search now covers attachments.</Text>
          <Text>Exports run in the background and notify you when done.</Text>
        </YStack>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="primary">Got it</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Overlay — `overlay` takes the scrim's own props and `maxW` sets the panel's width: a faint dim and a narrow box for a one-field rename. */
export function Overlay() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Rename branch</Button>
      </DialogTrigger>
      <DialogContent maxW={360} overlay={{ opacity: 0.2 }}>
        <DialogHeader>
          <DialogTitle>Rename branch</DialogTitle>
          <DialogDescription>
            Open pull requests follow the new name.
          </DialogDescription>
        </DialogHeader>
        <YStack gap="$2">
          <Label htmlFor="branch-name">Name</Label>
          <Input id="branch-name" defaultValue="feature/search" />
        </YStack>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary">Rename</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Controlled — `open` and `onOpenChange` hand the state to you, so Send invite can do its work and then close the panel itself. */
export function Controlled() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState("")
  return (
    <YStack gap="$3" items="flex-start">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="primary">Invite a teammate</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a teammate</DialogTitle>
            <DialogDescription>
              They get editor access to this workspace.
            </DialogDescription>
          </DialogHeader>
          <YStack gap="$2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              placeholder="ada@example.com"
              value={email}
              onChangeText={setEmail}
            />
          </YStack>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              disabled={email === ""}
              onPress={() => {
                setSent(email)
                setEmail("")
                setOpen(false)
              }}
            >
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {sent ? (
        <Paragraph color="$color11">Invite sent to {sent}</Paragraph>
      ) : null}
    </YStack>
  )
}

/** Own overlay — `DialogPortal` and `DialogOverlay` are what Content mounts for you; mount them yourself when the scrim carries content of its own, with Content's overlay hidden through `overlay={{ display: 'none' }}`. */
export function OwnOverlay() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open hero.png</Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay
          bg="black"
          opacity={0.92}
          justify="flex-end"
          items="center"
          pb="$6"
        >
          <Text color="white" fontSize="$2">
            3 of 12 · Esc to close
          </Text>
        </DialogOverlay>
        <DialogContent
          maxW={720}
          showCloseButton={false}
          overlay={{ display: "none" }}
        >
          <DialogHeader>
            <DialogTitle>hero.png</DialogTitle>
            <DialogDescription>1920 × 1080 · 412 KB</DialogDescription>
          </DialogHeader>
          <YStack width="100%" aspectRatio={16 / 9} rounded="$3" bg="$color3" />
          <DialogFooter>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
