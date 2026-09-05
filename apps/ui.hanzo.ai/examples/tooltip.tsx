import { useState } from "react"
import { Text, XStack } from "@hanzo/gui"
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@hanzo/ui"
import { Bold, Italic, Link, Underline } from "@hanzogui/lucide-icons-2"

/** Default — rest the pointer on the button, or tab to it, and the hint appears; an icon button keeps its name here and in `aria-label`. */
export function Default() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Copy link">
          <Link size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy link</TooltipContent>
    </Tooltip>
  )
}

/** Placement — `placement` on the root names the side the hint opens on, with `-start` or `-end` to pull it to one end of the trigger, and `sideOffset` on the content sets the gap. */
export function Placement() {
  return (
    <XStack flexWrap="wrap" gap="$3">
      <Tooltip placement="top">
        <TooltipTrigger asChild>
          <Button variant="outline">Top</Button>
        </TooltipTrigger>
        <TooltipContent>Above the trigger</TooltipContent>
      </Tooltip>
      <Tooltip placement="right">
        <TooltipTrigger asChild>
          <Button variant="outline">Right</Button>
        </TooltipTrigger>
        <TooltipContent>Right of the trigger</TooltipContent>
      </Tooltip>
      <Tooltip placement="bottom">
        <TooltipTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </TooltipTrigger>
        <TooltipContent>Below the trigger</TooltipContent>
      </Tooltip>
      <Tooltip placement="left">
        <TooltipTrigger asChild>
          <Button variant="outline">Left</Button>
        </TooltipTrigger>
        <TooltipContent>Left of the trigger</TooltipContent>
      </Tooltip>
      <Tooltip placement="bottom-start">
        <TooltipTrigger asChild>
          <Button variant="outline">Bottom start</Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={12}>
          Left edges meet, 12 px below
        </TooltipContent>
      </Tooltip>
    </XStack>
  )
}

/** Delay — `delay` on the root is how long the pointer rests before the hint opens, one number or separate open and close waits in milliseconds; without it the hint opens at once. */
export function Delay() {
  return (
    <XStack flexWrap="wrap" gap="$3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Instant</Button>
        </TooltipTrigger>
        <TooltipContent>Opens with no wait</TooltipContent>
      </Tooltip>
      <Tooltip delay={400}>
        <TooltipTrigger asChild>
          <Button variant="outline">400 ms</Button>
        </TooltipTrigger>
        <TooltipContent>
          Opens after 400 ms, closes 400 ms after you leave
        </TooltipContent>
      </Tooltip>
      <Tooltip delay={{ open: 1000, close: 500 }}>
        <TooltipTrigger asChild>
          <Button variant="outline">Slow</Button>
        </TooltipTrigger>
        <TooltipContent>
          Opens after 1 s, closes 500 ms after you leave
        </TooltipContent>
      </Tooltip>
    </XStack>
  )
}

/** Grouped — `TooltipProvider` shares one delay across the tooltips inside it, each named by `groupId`: the first waits for it, and while one is showing the next opens at once, so a toolbar reads as one hint that follows the pointer. */
export function Grouped() {
  return (
    <TooltipProvider delay={{ open: 600, close: 100 }}>
      <XStack gap="$1">
        <Tooltip groupId="bold">
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Bold">
              <Bold size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bold ⌘B</TooltipContent>
        </Tooltip>
        <Tooltip groupId="italic">
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Italic">
              <Italic size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Italic ⌘I</TooltipContent>
        </Tooltip>
        <Tooltip groupId="underline">
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Underline">
              <Underline size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Underline ⌘U</TooltipContent>
        </Tooltip>
      </XStack>
    </TooltipProvider>
  )
}

/** Controlled — `open` and `onOpenChange` hand the state to you, so a button can open the hint without the pointer while hover and focus still report through the same callback. */
export function Controlled() {
  const [open, setOpen] = useState(false)
  return (
    <XStack gap="$3" items="center">
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <Button variant="outline">Rotate key</Button>
        </TooltipTrigger>
        <TooltipContent>The current key stops working at once</TooltipContent>
      </Tooltip>
      <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
        {open ? "Hide hint" : "Show hint"}
      </Button>
      <Text fontSize={13} color="$color11">
        {open ? "Open" : "Closed"}
      </Text>
    </XStack>
  )
}
