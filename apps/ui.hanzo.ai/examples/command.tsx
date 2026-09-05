import { useState } from "react"
import { H3, Paragraph, XStack, YStack } from "@hanzo/gui"
import {
  Button,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@hanzo/ui"
import {
  Calculator,
  Calendar,
  GitBranch,
  Globe,
  Mail,
  Moon,
  Plus,
  Rocket,
  Settings,
  Smile,
  Sun,
  Terminal,
  User,
} from "@hanzogui/lucide-icons-2"

/** Default — an input over grouped rows; typing narrows the list, arrow keys move the cursor and Enter runs the row. */
export function Default() {
  return (
    <Command
      label="Command menu"
      maxW={440}
      borderWidth={1}
      borderColor="$borderColor"
    >
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Calendar size={16} />
            Calendar
          </CommandItem>
          <CommandItem>
            <Smile size={16} />
            Search emoji
          </CommandItem>
          <CommandItem>
            <Calculator size={16} />
            Calculator
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem value="Profile">
            <User size={16} />
            Profile
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem value="Mail">
            <Mail size={16} />
            Mail
            <CommandShortcut>⌘M</CommandShortcut>
          </CommandItem>
          <CommandItem value="Settings">
            <Settings size={16} />
            Settings
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

/** Matching — `keywords` widen what a row answers to, a `disabled` row stays listed but cannot be chosen, and `alwaysRender` keeps the rule while a search is active. */
export function Matching() {
  return (
    <Command maxW={440} borderWidth={1} borderColor="$borderColor">
      <CommandInput placeholder="Try “night” or “leave”" />
      <CommandList>
        <CommandEmpty>Nothing matches.</CommandEmpty>
        <CommandGroup heading="Appearance">
          <CommandItem keywords={["night"]}>
            <Moon size={16} />
            Dark theme
          </CommandItem>
          <CommandItem keywords={["day"]}>
            <Sun size={16} />
            Light theme
          </CommandItem>
        </CommandGroup>
        <CommandSeparator alwaysRender />
        <CommandGroup heading="Account">
          <CommandItem keywords={["leave", "log out"]}>Sign out</CommandItem>
          <CommandItem disabled>Delete account</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

/** Own filter — `shouldFilter={false}` leaves the matching to you: the search string comes back through `CommandInput`'s `onValueChange` and only the rows you render are listed. */
export function OwnFilter() {
  const [search, setSearch] = useState("")
  const branches = [
    "main",
    "release/8.27",
    "feature/palette",
    "fix/dialog-forwarding",
  ]
  const shown = branches.filter((b) =>
    b.startsWith(search.trim().toLowerCase())
  )
  return (
    <Command
      shouldFilter={false}
      maxW={440}
      borderWidth={1}
      borderColor="$borderColor"
    >
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Branch name starts with…"
      />
      <CommandList>
        <CommandEmpty>No branch starts with that.</CommandEmpty>
        <CommandGroup heading="Branches">
          {shown.map((b) => (
            <CommandItem key={b} value={b}>
              <GitBranch size={16} />
              {b}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

/** Controlled — `value` and `onValueChange` expose the highlighted row, here driving a preview beside the list; `loop` wraps the arrow keys at either end. */
export function Controlled() {
  const [value, setValue] = useState("deploy")
  const actions = [
    {
      value: "deploy",
      label: "Deploy",
      help: "Build the current branch and roll it out to production.",
    },
    {
      value: "rollback",
      label: "Roll back",
      help: "Return production to the previous release.",
    },
    {
      value: "logs",
      label: "Logs",
      help: "Tail the production logs in a new pane.",
    },
    {
      value: "scale",
      label: "Scale",
      help: "Change the replica count of one service.",
    },
  ]
  const current = actions.find((a) => a.value === value)
  return (
    <XStack
      maxW={600}
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$4"
      overflow="hidden"
    >
      <Command value={value} onValueChange={setValue} loop flex={1} rounded={0}>
        <CommandInput placeholder="Search actions" />
        <CommandList>
          <CommandEmpty>No such action.</CommandEmpty>
          <CommandGroup heading="Production">
            {actions.map((a) => (
              <CommandItem key={a.value} value={a.value}>
                {a.value === "deploy" ? <Rocket size={16} /> : null}
                {a.value === "logs" ? <Terminal size={16} /> : null}
                {a.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
      <YStack
        flex={1}
        p="$4"
        gap="$2"
        borderLeftWidth={1}
        borderColor="$borderColor"
      >
        <H3 size="$4">{current?.label}</H3>
        <Paragraph color="$color11">{current?.help}</Paragraph>
      </YStack>
    </XStack>
  )
}

/** In a dialog — the same palette inside a modal; a button opens it and a row's `onSelect` closes it with the value that ran. */
export function InDialog() {
  const [open, setOpen] = useState(false)
  const [ran, setRan] = useState("")
  const run = (value: string) => {
    setRan(value)
    setOpen(false)
  }
  return (
    <YStack gap="$3" items="flex-start">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open command palette
      </Button>
      <Paragraph color="$color11">
        {ran ? `Ran “${ran}”` : "Nothing has run yet."}
      </Paragraph>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Repository actions"
        description="Search for an action and press Enter to run it"
      >
        <CommandInput placeholder="What do you want to do?" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Repository">
            <CommandItem onSelect={run}>
              <Plus size={16} />
              New issue
            </CommandItem>
            <CommandItem onSelect={run}>
              <GitBranch size={16} />
              New branch
            </CommandItem>
            <CommandItem onSelect={run}>
              <Globe size={16} />
              Open on GitHub
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </YStack>
  )
}
