import { useState } from "react"
import { Text } from "@hanzo/gui"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@hanzo/ui"
import { Copy, Link, Mail, Pencil, Trash2 } from "@hanzogui/lucide-icons-2"

/** Default — right-click or long-press the area to open a menu anchored at the cursor. */
export function Default() {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        height={120}
        items="center"
        justify="center"
        rounded="$4"
        borderWidth={1}
        borderStyle="dashed"
        borderColor="$borderColor"
      >
        <Text color="$quiet">Right-click here</Text>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          Back
          <ContextMenuShortcut>⌘[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Forward
          <ContextMenuShortcut>⌘]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Reload
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Save page as…</ContextMenuItem>
        <ContextMenuItem>Print…</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/** Variants — a destructive row for an action that removes something, a disabled row that cannot be chosen, and inset rows that line up with rows carrying an icon. */
export function Variants() {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        height={120}
        items="center"
        justify="center"
        rounded="$4"
        borderWidth={1}
        borderStyle="dashed"
        borderColor="$borderColor"
      >
        <Text color="$quiet">quarterly-report.pdf</Text>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem variant="default">
          <Pencil size={16} />
          Rename
        </ContextMenuItem>
        <ContextMenuItem>
          <Copy size={16} />
          Duplicate
        </ContextMenuItem>
        <ContextMenuItem inset>Move to…</ContextMenuItem>
        <ContextMenuItem inset disabled>
          Paste
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          <Trash2 size={16} />
          Delete
          <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/** Controlled — checkbox rows toggle view options and a radio group picks one sort order, both held in React state so the trigger can show them. */
export function Controlled() {
  const [wrap, setWrap] = useState(true)
  const [minimap, setMinimap] = useState(false)
  const [sort, setSort] = useState("name")
  return (
    <ContextMenu>
      <ContextMenuTrigger
        height={120}
        items="center"
        justify="center"
        rounded="$4"
        borderWidth={1}
        borderStyle="dashed"
        borderColor="$borderColor"
      >
        <Text color="$quiet">
          Word wrap {wrap ? "on" : "off"} · minimap {minimap ? "on" : "off"} ·
          sorted by {sort}
        </Text>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel inset>View</ContextMenuLabel>
          <ContextMenuCheckboxItem checked={wrap} onCheckedChange={setWrap}>
            Word wrap
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem
            checked={minimap}
            onCheckedChange={setMinimap}
          >
            Minimap
          </ContextMenuCheckboxItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuLabel inset>Sort by</ContextMenuLabel>
        <ContextMenuRadioGroup value={sort} onValueChange={setSort}>
          <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
          <ContextMenuRadioItem value="modified">
            Date modified
          </ContextMenuRadioItem>
          <ContextMenuRadioItem value="size">Size</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/** Nested — a sub trigger opens a second panel beside the first; wrap it in `ContextMenuPortal` so it escapes the root panel, which portals itself. */
export function Nested() {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        height={120}
        items="center"
        justify="center"
        rounded="$4"
        borderWidth={1}
        borderStyle="dashed"
        borderColor="$borderColor"
      >
        <Text color="$quiet">launch-notes.md</Text>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Open</ContextMenuItem>
        <ContextMenuItem>Rename</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger key="share">Share</ContextMenuSubTrigger>
          <ContextMenuPortal>
            <ContextMenuSubContent>
              <ContextMenuItem>
                <Link size={16} />
                Copy link
              </ContextMenuItem>
              <ContextMenuItem>
                <Mail size={16} />
                Email
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>Publish to web</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuPortal>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">Move to trash</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/** Open state — `onOpenChange` reports each open and close, so the target can stay highlighted while its menu is up. */
export function OpenState() {
  const [open, setOpen] = useState(false)
  return (
    <ContextMenu onOpenChange={setOpen}>
      <ContextMenuTrigger
        height={120}
        items="center"
        justify="center"
        rounded="$4"
        borderWidth={1}
        borderStyle={open ? "solid" : "dashed"}
        borderColor={open ? "$ink" : "$borderColor"}
        bg={open ? "$raised" : undefined}
      >
        <Text color={open ? "$ink" : "$quiet"}>
          {open ? "Menu open" : "Right-click here"}
        </Text>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Cut</ContextMenuItem>
        <ContextMenuItem>Copy</ContextMenuItem>
        <ContextMenuItem>Paste</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
