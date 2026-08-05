'use client'

/**
 * useCommandK — the ONE keybinding for the command palette.
 *
 * ⌘K / Ctrl-K always toggles (even from a text field — it is the universal
 * palette shortcut and nothing else may claim it). `/` also opens it, but ONLY
 * when the user is NOT typing in a field, so a slash inside an input, a textarea
 * or a contenteditable types a slash. Pass `slash: false` to bind ⌘K alone.
 *
 * That second rule is why chat needs no exception written for it. Its composer is
 * a TEXTAREA, so the global `/` never fires there and the composer's own prompts
 * popover keeps the key it has. The same rule makes a `/` typed into the palette's
 * own input a literal slash. There is no precedence to encode — the one condition
 * already answers all three, and the instinct to add an exception would be adding
 * dead code.
 *
 * One hook, so every surface that hosts the palette shares identical behaviour
 * instead of a divergent inline listener each. It moved here from hanzo.app,
 * which is where it was already correct.
 */
import { useEffect } from "react"

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || typeof HTMLElement === "undefined" || !(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable
}

export function useCommandK(onTrigger: () => void, opts?: { slash?: boolean }): void {
  const slash = opts?.slash !== false
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmdK = (e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k"
      const slashKey =
        slash && e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !isEditable(e.target)
      if (cmdK || slashKey) {
        e.preventDefault()
        onTrigger()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onTrigger, slash])
}
