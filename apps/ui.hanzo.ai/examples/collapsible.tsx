import { useState } from "react"
import { Paragraph, Text, XStack, YStack } from "@hanzo/gui"
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@hanzo/ui"
import {
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
} from "@hanzogui/lucide-icons-2"

/** Default — closed until the trigger is pressed, and the content is not in the tree while closed. */
export function Default() {
  return (
    <Collapsible width="100%" maxW={360}>
      <CollapsibleTrigger>
        Why did the build take fourteen minutes?
      </CollapsibleTrigger>
      <CollapsibleContent pt="$2">
        <Paragraph fontSize={13} color="$color11">
          The CUDA kernels rebuilt from scratch: the cache key changed when the
          toolchain moved to 13.1, so nothing from the previous run could be
          reused.
        </Paragraph>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** Controlled — `open` and `onOpenChange` hand the state to you, so the trigger can show it and something outside can change it. */
export function Controlled() {
  const [open, setOpen] = useState(false)
  return (
    <YStack gap="$3" width="100%" maxW={360}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger>
          <XStack gap="$2" items="center">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Text fontWeight="600">Advanced settings</Text>
          </XStack>
        </CollapsibleTrigger>
        <CollapsibleContent pt="$2" pl="$6" gap="$1">
          <Text fontSize={13} color="$color11">
            Request timeout: 30s
          </Text>
          <Text fontSize={13} color="$color11">
            Retries: 3
          </Text>
          <Text fontSize={13} color="$color11">
            Region: eu-west-1
          </Text>
        </CollapsibleContent>
      </Collapsible>
      <Button size="sm" variant="outline" onClick={() => setOpen(!open)}>
        {open ? "Hide advanced settings" : "Show advanced settings"}
      </Button>
    </YStack>
  )
}

/** Disabled — the trigger takes no clicks, so the section stays where it sits: closed, or open by way of `defaultOpen`. */
export function Disabled() {
  return (
    <YStack gap="$4" width="100%" maxW={360}>
      <Collapsible disabled>
        <XStack gap="$2" items="center">
          <CollapsibleTrigger>Audit log</CollapsibleTrigger>
          <Text fontSize={12} color="$color10">
            Team plan only
          </Text>
        </XStack>
        <CollapsibleContent pt="$2">
          <Text fontSize={13} color="$color11">
            No entries
          </Text>
        </CollapsibleContent>
      </Collapsible>
      <Collapsible disabled defaultOpen>
        <CollapsibleTrigger>Required scopes</CollapsibleTrigger>
        <CollapsibleContent pt="$2">
          <Text fontFamily="$mono" fontSize={13} color="$color11">
            read:org read:user
          </Text>
        </CollapsibleContent>
      </Collapsible>
    </YStack>
  )
}

/** Show more — the first row of a list stays visible and the rest sit behind an icon trigger in the heading. */
export function ShowMore() {
  return (
    <Collapsible width="100%" maxW={360} gap="$2">
      <XStack items="center" justify="space-between">
        <Text fontSize={13} fontWeight="600">
          3 open pull requests
        </Text>
        <CollapsibleTrigger aria-label="Show the rest">
          <ChevronsUpDown size={16} />
        </CollapsibleTrigger>
      </XStack>
      <Text fontFamily="$mono" fontSize={13}>
        #412 Add the missing peer
      </Text>
      <CollapsibleContent gap="$2">
        <Text fontFamily="$mono" fontSize={13}>
          #409 Pin the linker tmpdir
        </Text>
        <Text fontFamily="$mono" fontSize={13}>
          #403 Drop the gorm bridge
        </Text>
      </CollapsibleContent>
    </Collapsible>
  )
}
