// Removed "use server" for static export compatibility
import { promises as fs } from "fs"
import path from "path"

// Enable syntax highlighting in development
// For static exports, we can use client-side highlighting instead
const highlightCodeEnabled =
  process.env.NODE_ENV === "development" || !process.env.GITHUB_ACTIONS

export async function highlightCode(code: string) {
  if (!highlightCodeEnabled) {
    // Return code wrapped in basic HTML for static export
    return `<pre><code class="language-typescript">${escapeHtml(code)}</code></pre>`
  }

  try {
    const { createHighlighter } = await import("shiki")

    const editorTheme = await fs.readFile(
      path.join(process.cwd(), "lib/themes/dark.json"),
      "utf-8"
    )

    const highlighter = await createHighlighter({
      langs: ["typescript"],
      themes: [JSON.parse(editorTheme)],
    })

    const html = await highlighter.codeToHtml(code, {
      lang: "typescript",
      theme: "Lambda Studio — Blackout",
    })

    return html
  } catch (error) {
    console.error("Syntax highlighting failed:", error)
    return `<pre><code class="language-typescript">${escapeHtml(code)}</code></pre>`
  }
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
