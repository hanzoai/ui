import { Transformer } from "@/src/utils/transformers"
<<<<<<< HEAD
import { SyntaxKind } from "ts-morph"

// Transforms cn-menu-target class based on config.menuColor.
// If menuColor is "inverted", replaces cn-menu-target with "dark".
// Otherwise, removes cn-menu-target entirely.
export const transformMenu: Transformer = async ({ sourceFile, config }) => {
  const menuColor = config.menuColor

  // If menuColor is not set or is "default", we remove the placeholder.
  const replacement = menuColor === "inverted" ? "dark" : ""
=======
import { twMerge } from "tailwind-merge"
import { SyntaxKind } from "ts-morph"

// Hardcoded translucent classes inlined at install time.
const TRANSLUCENT_CLASSES =
  "animate-none! relative bg-popover/70 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 **:data-[slot$=-item]:focus:bg-foreground/10 **:data-[slot$=-item]:data-highlighted:bg-foreground/10 **:data-[slot$=-separator]:bg-foreground/5 **:data-[slot$=-trigger]:focus:bg-foreground/10 **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10! **:data-[variant=destructive]:focus:bg-foreground/10! **:data-[variant=destructive]:text-accent-foreground! **:data-[variant=destructive]:**:text-accent-foreground!"

// Transforms cn-menu-target and cn-menu-translucent classes based on config.menuColor.
// If menuColor is "inverted", replaces cn-menu-target with "dark" and removes cn-menu-translucent.
// If menuColor is "default-translucent", removes cn-menu-target and inlines cn-menu-translucent styles.
// If menuColor is "inverted-translucent", replaces cn-menu-target with "dark" and inlines cn-menu-translucent styles.
// Otherwise, removes both cn-menu-target and cn-menu-translucent.
export const transformMenu: Transformer = async ({ sourceFile, config }) => {
  const menuColor = config.menuColor
  const isTranslucent =
    menuColor === "default-translucent" || menuColor === "inverted-translucent"
>>>>>>> shadcn/main

  for (const attr of sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute)) {
    const attrName = attr.getNameNode().getText()
    if (attrName !== "className") {
      continue
    }

    const initializer = attr.getInitializer()
    if (!initializer) {
      continue
    }

    const text = initializer.getText()
<<<<<<< HEAD
    if (!text.includes("cn-menu-target")) {
      continue
    }

    // Replace cn-menu-target with the replacement value.
    let newText = text.replace(/cn-menu-target/g, replacement)

    // Clean up extra spaces if we removed the class.
    if (!replacement) {
      // Remove double spaces.
      newText = newText.replace(/\s{2,}/g, " ")
      // Clean up leading/trailing spaces in strings.
=======
    if (
      !text.includes("cn-menu-target") &&
      !text.includes("cn-menu-translucent")
    ) {
      continue
    }

    let newText = text
    let needsCleanup = false

    if (menuColor === "inverted" || menuColor === "inverted-translucent") {
      // Replace cn-menu-target with "dark".
      newText = newText.replace(/cn-menu-target/g, "dark")
    } else {
      // Remove cn-menu-target for both "default-translucent" and "default".
      newText = newText.replace(/cn-menu-target/g, "")
      needsCleanup = true
    }

    if (isTranslucent) {
      // Merge translucent classes with existing classes, then remove the placeholder.
      newText = newText.replace(
        /"([^"]*cn-menu-translucent[^"]*)"/g,
        (_, classes) => {
          const merged = twMerge(classes, TRANSLUCENT_CLASSES)
          return `"${merged.replace(/\s*\bcn-menu-translucent\b\s*/g, " ").trim()}"`
        }
      )
    } else {
      // Remove cn-menu-translucent.
      if (newText.includes("cn-menu-translucent")) {
        newText = newText.replace(/cn-menu-translucent/g, "")
        needsCleanup = true
      }
    }

    // Clean up extra spaces only when classes were removed.
    if (needsCleanup) {
      newText = newText.replace(/\s{2,}/g, " ")
>>>>>>> shadcn/main
      newText = newText.replace(/"\s+/g, '"')
      newText = newText.replace(/\s+"/g, '"')
      // Clean up empty strings in cn() calls.
      newText = newText.replace(/,\s*""\s*,/g, ",")
      newText = newText.replace(/\(\s*""\s*,/g, "(")
      newText = newText.replace(/,\s*""\s*\)/g, ")")
    }

    attr.setInitializer(newText)
  }

  return sourceFile
}
