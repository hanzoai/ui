// Removed "use server" for static export compatibility
import { promises as fs } from "fs"
import path from "path"

// Highlighting is disabled for static exports due to Shiki compatibility issues
// Return plain code wrapped in pre/code tags for static builds
const highlightCodeEnabled = false

export async function highlightCode(code: string) {
  if (!highlightCodeEnabled) {
    // Return code wrapped in basic HTML for static export
    return `<pre><code class="language-typescript">${escapeHtml(code)}</code></pre>`
  }

  try {
    const { getHighlighter } = await import("shiki")

    const editorTheme = await fs.readFile(
      path.join(process.cwd(), "lib/themes/dark.json"),
      "utf-8"
    )

    const highlighter = await getHighlighter({
      langs: ["typescript"],
      themes: [],
    })

    await highlighter.loadTheme(JSON.parse(editorTheme))

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
