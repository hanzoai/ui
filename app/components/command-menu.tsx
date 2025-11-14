"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DialogProps } from "@radix-ui/react-dialog"
import {
  CircleIcon,
  FileIcon,
  LaptopIcon,
  MoonIcon,
  SunIcon,
} from "@radix-ui/react-icons"
import { Clock, X } from "lucide-react"
import { useTheme } from "next-themes"

import { docsConfig } from "@/config/docs"
import { cn } from "@/lib/utils"
import { useRecentSearches } from "@/hooks/use-recent-searches"
import { Button } from "@/registry/default/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/registry/default/ui/command"

// Helper to detect macOS
const isMacOS = () =>
  typeof window !== "undefined" &&
  window.navigator.userAgent.toLowerCase().includes("mac")

// Keyboard shortcut badge component
interface KbdBadgeProps {
  keys: string[]
  className?: string
}

function KbdBadge({ keys, className }: KbdBadgeProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {keys.map((key, index) => (
        <kbd
          key={index}
          className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100"
        >
          {key}
        </kbd>
      ))}
    </div>
  )
}

export function CommandMenu({ ...props }: DialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const { setTheme } = useTheme()
  const { recentSearches, addRecentSearch, clearRecentSearches } =
    useRecentSearches()

  const modKey = React.useMemo(() => (isMacOS() ? "⌘" : "Ctrl"), [])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K to toggle command menu
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return
        }

        e.preventDefault()
        setOpen((open) => !open)
      }

      // ⌘P or Ctrl+P as alternative (common in many editors)
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return
        }

        e.preventDefault()
        setOpen((open) => !open)
      }

      // "/" to focus search
      if (e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return
        }

        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback(
    (command: () => unknown, title?: string, href?: string) => {
      // Track in recent searches if we have the metadata
      if (title && href) {
        addRecentSearch({
          id: href,
          title,
          href,
        })
      }

      setOpen(false)
      setSearchQuery("")
      command()
    },
    [addRecentSearch]
  )

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-8 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        <span className="hidden lg:inline-flex">Search documentation...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">{modKey}</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type a command or search..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Recent Searches - only show when no search query */}
          {!searchQuery && recentSearches.length > 0 && (
            <>
              <CommandGroup
                heading={
                  <div className="flex items-center justify-between">
                    <span>Recent</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearRecentSearches()
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                }
              >
                {recentSearches.map((search) => (
                  <CommandItem
                    key={search.id}
                    value={search.title}
                    onSelect={() => {
                      runCommand(
                        () => router.push(search.href),
                        search.title,
                        search.href
                      )
                    }}
                    className="group"
                  >
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{search.title}</span>
                    <CommandShortcut className="opacity-0 group-hover:opacity-100">
                      <X className="h-3 w-3" />
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          <CommandGroup heading="Navigation">
            {docsConfig.mainNav
              .filter((navitem) => !navitem.external)
              .map((navItem) => (
                <CommandItem
                  key={navItem.href}
                  value={navItem.title}
                  onSelect={() => {
                    runCommand(
                      () => router.push(navItem.href as string),
                      navItem.title,
                      navItem.href as string
                    )
                  }}
                >
                  <FileIcon className="mr-2 h-4 w-4" />
                  {navItem.title}
                  <CommandShortcut>
                    <KbdBadge keys={["G", navItem.title[0].toUpperCase()]} />
                  </CommandShortcut>
                </CommandItem>
              ))}
          </CommandGroup>

          {docsConfig.sidebarNav.map((group, groupIndex) => (
            <CommandGroup key={group.title} heading={group.title}>
              {group.items.map((navItem, itemIndex) => (
                <CommandItem
                  key={navItem.href}
                  value={navItem.title}
                  keywords={[navItem.title, group.title]}
                  onSelect={() => {
                    runCommand(
                      () => router.push(navItem.href as string),
                      navItem.title,
                      navItem.href as string
                    )
                  }}
                >
                  <div className="mr-2 flex h-4 w-4 items-center justify-center">
                    <CircleIcon className="h-3 w-3" />
                  </div>
                  <span className="flex-1">{navItem.title}</span>
                  {itemIndex < 9 && (
                    <CommandShortcut>
                      <KbdBadge keys={[String(itemIndex + 1)]} />
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

          <CommandSeparator />

          <CommandGroup heading="Theme">
            <CommandItem
              onSelect={() => runCommand(() => setTheme("light"))}
              keywords={["light", "theme", "appearance"]}
            >
              <SunIcon className="mr-2 h-4 w-4" />
              Light
              <CommandShortcut>
                <KbdBadge keys={["T", "L"]} />
              </CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setTheme("dark"))}
              keywords={["dark", "theme", "appearance"]}
            >
              <MoonIcon className="mr-2 h-4 w-4" />
              Dark
              <CommandShortcut>
                <KbdBadge keys={["T", "D"]} />
              </CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setTheme("system"))}
              keywords={["system", "theme", "appearance", "auto"]}
            >
              <LaptopIcon className="mr-2 h-4 w-4" />
              System
              <CommandShortcut>
                <KbdBadge keys={["T", "S"]} />
              </CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
