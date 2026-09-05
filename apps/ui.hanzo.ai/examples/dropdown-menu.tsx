import { useState } from "react"
import { Text, YStack } from "@hanzo/gui"
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@hanzo/ui"
import {
  Copy,
  CreditCard,
  Download,
  FolderInput,
  GitBranch,
  Keyboard,
  Link,
  LogOut,
  Mail,
  MoreHorizontal,
  Pencil,
  Settings,
  Share2,
  Trash2,
  User,
} from "@hanzogui/lucide-icons-2"

/** Default — a trigger opens a panel of grouped rows, each with an icon on the left and a shortcut hint on the right. */
export function Default() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Account</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Signed in as Ada</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User size={16} />
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard size={16} />
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings size={16} />
            Settings
            <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Keyboard size={16} />
            Keyboard shortcuts
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut size={16} />
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Variants — a destructive row goes red, and a disabled row dims and takes no clicks. */
export function Variants() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">invoice-0042.pdf</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem variant="default">
          <Pencil size={16} />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy size={16} />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem>
          <FolderInput size={16} />
          Move to…
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Download size={16} />
          Download
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 size={16} />
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Controlled — checkbox rows and a radio group keep their state in React, so the caption outside the menu follows every change. */
export function Controlled() {
  const [lineNumbers, setLineNumbers] = useState(true)
  const [minimap, setMinimap] = useState(false)
  const [wrap, setWrap] = useState("off")
  return (
    <YStack gap="$3" items="flex-start">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">View</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Editor</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={lineNumbers}
              onCheckedChange={setLineNumbers}
            >
              Line numbers
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={minimap}
              onCheckedChange={setMinimap}
            >
              Minimap
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Word wrap</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={wrap} onValueChange={setWrap}>
            <DropdownMenuRadioItem value="off">Off</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="column">
              At column 80
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="viewport">
              At viewport
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Text fontSize="$2" color="$quiet">
        Line numbers {lineNumbers ? "on" : "off"} · minimap{" "}
        {minimap ? "on" : "off"} · wrap {wrap}
      </Text>
    </YStack>
  )
}

/** Nested — a sub trigger opens a second panel beside the first, wrapped in `DropdownMenuPortal` so it can reach past the first panel's edge; `align="end"` lines the menu up with the right edge of an icon trigger and `sideOffset` sets the gap. */
export function Nested() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="More">
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuItem>
          <Pencil size={16} />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Download size={16} />
          Download
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Share2 size={16} />
            Share
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem>
                <Link size={16} />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail size={16} />
                Email
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 size={16} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Declarative — `trigger` and `items` build the same rows from a spec, for a menu whose entries come from data; `selected` marks the current row, `disabled` and `destructive` follow state, and `minWidth` makes room for a description line. */
export function Declarative() {
  const [branch, setBranch] = useState("main")
  const branches = ["main", "develop", "release/2.4"]
  return (
    <YStack gap="$3" items="flex-start">
      <DropdownMenu
        minWidth={240}
        trigger={
          <Button variant="outline">
            <GitBranch size={16} />
            {branch}
          </Button>
        }
        items={[
          { type: "label", label: "Switch to" },
          ...branches.map((name) => ({
            key: name,
            label: name,
            icon: <GitBranch size={16} />,
            selected: branch === name,
            onSelect: () => setBranch(name),
          })),
          { type: "separator" },
          {
            key: "delete",
            label: "Delete branch",
            description:
              branch === "main"
                ? "The default branch stays"
                : `Removes ${branch}`,
            destructive: true,
            disabled: branch === "main",
            onSelect: () => setBranch("main"),
          },
        ]}
      />
      <Text fontSize="$2" color="$quiet">
        On {branch}
      </Text>
    </YStack>
  )
}
