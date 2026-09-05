import { useState } from "react"
import { Paragraph, Text, XStack, YStack } from "@hanzo/gui"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@hanzo/ui"
import { Archive, Inbox, Send } from "@hanzogui/lucide-icons-2"

/** Default — two panels share the width evenly, and the handle between them moves the boundary by drag or, once focused, by the arrow keys: five percent a press, one with Shift held. */
export function Default() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      height={200}
      maxW={560}
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$3"
    >
      <ResizablePanel p="$3" gap="$1">
        <Text fontSize={13} fontWeight="600">
          Files
        </Text>
        <Text fontFamily="$mono" fontSize={13} color="$color11">
          src/index.ts
        </Text>
        <Text fontFamily="$mono" fontSize={13} color="$color11">
          src/resizable.tsx
        </Text>
        <Text fontFamily="$mono" fontSize={13} color="$color11">
          package.json
        </Text>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel p="$3">
        <Paragraph fontSize={13} color="$color11">
          Pick a file to see its contents.
        </Paragraph>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

/** Vertical — `direction="vertical"` stacks the panels top to bottom, `defaultSize` gives the lower one its starting share, and `withHandle` draws a grip on the divider so it reads as draggable. */
export function Vertical() {
  return (
    <ResizablePanelGroup
      direction="vertical"
      height={240}
      maxW={560}
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$3"
    >
      <ResizablePanel p="$3" gap="$1">
        <Text fontFamily="$mono" fontSize={13}>
          const server = createServer(handler)
        </Text>
        <Text fontFamily="$mono" fontSize={13}>
          server.listen(3000)
        </Text>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={35} p="$3" gap="$1" bg="$raised">
        <Text fontFamily="$mono" fontSize={13} color="$color11">
          $ pnpm test
        </Text>
        <Text fontFamily="$mono" fontSize={13} color="$color11">
          14 passed in 1.2s
        </Text>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

/** Limits — `minSize` and `maxSize` clamp how far a boundary moves, a disabled handle keeps one in place, and `onLayout` reports every change as percentages of the group. */
export function Limits() {
  const [sizes, setSizes] = useState([25, 55, 20])
  return (
    <YStack gap="$2" maxW={560}>
      <ResizablePanelGroup
        direction="horizontal"
        height={180}
        borderWidth={1}
        borderColor="$borderColor"
        rounded="$3"
        onLayout={setSizes}
      >
        <ResizablePanel
          defaultSize={25}
          minSize={15}
          maxSize={40}
          p="$3"
          gap="$1"
        >
          <Text fontSize={13} fontWeight="600">
            Navigation
          </Text>
          <Text fontSize={12} color="$color11">
            15% to 40%
          </Text>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel p="$3">
          <Text fontSize={13} fontWeight="600">
            Document
          </Text>
        </ResizablePanel>
        <ResizableHandle disabled />
        <ResizablePanel defaultSize={20} p="$3" gap="$1">
          <Text fontSize={13} fontWeight="600">
            Inspector
          </Text>
          <Text fontSize={12} color="$color11">
            Pinned
          </Text>
        </ResizablePanel>
      </ResizablePanelGroup>
      <Text fontSize={12} color="$color10">
        {sizes.map((s) => `${Math.round(s)}%`).join(" / ")}
      </Text>
    </YStack>
  )
}

/** Collapsible — a collapsible panel's floor is `collapsedSize` rather than `minSize`, and `onResize` reports its share so the content can turn into icons once the rail is narrow. */
export function Collapsible() {
  const [rail, setRail] = useState(24)
  const narrow = rail < 15
  const rows = [
    { icon: Inbox, label: "Inbox" },
    { icon: Send, label: "Sent" },
    { icon: Archive, label: "Archive" },
  ]
  return (
    <ResizablePanelGroup
      direction="horizontal"
      height={200}
      maxW={560}
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$3"
    >
      <ResizablePanel
        defaultSize={24}
        minSize={20}
        collapsible
        collapsedSize={10}
        onResize={setRail}
        p="$3"
        gap="$2"
      >
        {rows.map(({ icon: Icon, label }) => (
          <XStack
            key={label}
            gap="$2"
            items="center"
            justify={narrow ? "center" : "flex-start"}
          >
            <Icon size={16} />
            {!narrow && <Text fontSize={13}>{label}</Text>}
          </XStack>
        ))}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel p="$3">
        <Paragraph fontSize={13} color="$color11">
          Drag the rail narrower than 15% and the labels give way to icons.
        </Paragraph>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

/** Nested — a group inside a panel splits the other axis, and `autoSaveId` on each group keeps its arrangement in the browser, keyed by the panels' `id`s, so it comes back on the next visit. */
export function Nested() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      autoSaveId="docs.workbench"
      height={260}
      maxW={560}
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$3"
    >
      <ResizablePanel id="explorer" defaultSize={30} p="$3" gap="$1">
        <Text fontSize={13} fontWeight="600">
          Explorer
        </Text>
        <Text fontFamily="$mono" fontSize={13} color="$color11">
          src/app.tsx
        </Text>
        <Text fontFamily="$mono" fontSize={13} color="$color11">
          src/routes.ts
        </Text>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel id="workbench">
        <ResizablePanelGroup
          direction="vertical"
          autoSaveId="docs.workbench.editor"
        >
          <ResizablePanel id="editor" p="$3">
            <Text fontFamily="$mono" fontSize={13}>
              export const routes = defineRoutes(app)
            </Text>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel id="problems" defaultSize={30} p="$3" gap="$1">
            <Text fontSize={13} fontWeight="600">
              Problems
            </Text>
            <Text fontFamily="$mono" fontSize={13} color="$color11">
              src/app.tsx:12 unused import Router
            </Text>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
