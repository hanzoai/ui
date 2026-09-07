import { useState } from "react"
import { SizableText, XStack, YStack } from "@hanzo/gui"
import { Button, Spotlight, type SpotlightItem } from "@hanzo/ui"

const appItems: SpotlightItem[] = [
  { id: "terminal", title: "Terminal", category: "Applications" },
  { id: "settings", title: "System Preferences", category: "Applications" },
  { id: "music", title: "Music", category: "Applications" },
  { id: "documents", title: "Documents", category: "Folders" },
  { id: "downloads", title: "Downloads", category: "Folders" },
]

/** Application launcher — a button opens the spotlight; type to filter, Enter or a click runs the highlighted app. */
export function Default() {
  const [isOpen, setIsOpen] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)

  return (
    <YStack gap="$3" items="flex-start">
      <Button onPress={() => setIsOpen(true)}>Open Spotlight</Button>
      {picked ? <SizableText size="$2" color="$quiet">Last picked: {picked}</SizableText> : null}
      <Spotlight
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={appItems}
        onSelect={(item) => setPicked(item.title)}
      />
    </YStack>
  )
}

const withSubtitles: SpotlightItem[] = [
  { id: "invoice-102", title: "Invoice #102", subtitle: "Acme Corp — $4,200", category: "Documents" },
  { id: "invoice-103", title: "Invoice #103", subtitle: "Globex — $1,050", category: "Documents" },
  { id: "contact-jane", title: "Jane Rivera", subtitle: "jane@example.com", category: "Contacts" },
  { id: "contact-max", title: "Max Chen", subtitle: "max@example.com", category: "Contacts" },
]

/** Search with subtitles — each row carries a secondary line, useful for records that need more than a title to tell apart. */
export function WithSubtitles() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <YStack gap="$3" items="flex-start">
      <Button variant="outline" onPress={() => setIsOpen(true)}>
        Search records
      </Button>
      <Spotlight
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={withSubtitles}
        placeholder="Search invoices and contacts..."
      />
    </YStack>
  )
}

const commandItems: SpotlightItem[] = [
  { id: "new-file", title: "New File", category: "Actions", keywords: ["create", "add"] },
  { id: "new-folder", title: "New Folder", category: "Actions", keywords: ["create", "directory"] },
  { id: "toggle-theme", title: "Toggle Theme", category: "Actions", keywords: ["dark", "light"] },
  { id: "readme", title: "README.md", category: "Recent Files" },
  { id: "config", title: "config.json", category: "Recent Files" },
]

/** Command runner — actions and recent files share the list under separate category headings; picking an action logs it instead of opening anything. */
export function CommandRunner() {
  const [isOpen, setIsOpen] = useState(false)
  const [log, setLog] = useState<string[]>([])

  return (
    <YStack gap="$3" items="flex-start">
      <Button onPress={() => setIsOpen(true)}>⌘K</Button>
      <XStack gap="$2" flexWrap="wrap">
        {log.map((entry, i) => (
          <SizableText key={i} size="$1" color="$quiet">
            {entry}
          </SizableText>
        ))}
      </XStack>
      <Spotlight
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={commandItems}
        placeholder="Type a command or search files..."
        onSelect={(item) => setLog((prev) => [...prev, `Ran: ${item.title}`])}
      />
    </YStack>
  )
}
