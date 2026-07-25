// Removed "use server" for static export compatibility
import { promises as fs } from "fs"
import path from "path"
import type { Highlighter } from "shiki"

// Highlight on the server while developing. A production build is a static
// export, which highlights on the client instead — so the build stays cheap.
const highlightCodeEnabled = process.env.NODE_ENV === "development"

// Singleton highlighter instance to prevent memory leaks
let highlighterInstance: Highlighter | null = null
let highlighterPromise: Promise<Highlighter> | null = null

async function getHighlighter(): Promise<Highlighter> {
  if (highlighterInstance) {
    return highlighterInstance
  }

  if (highlighterPromise) {
    return highlighterPromise
  }

  highlighterPromise = (async () => {
    const { createHighlighter } = await import("shiki")

    const editorTheme = await fs.readFile(
      path.join(process.cwd(), "lib/themes/dark.json"),
      "utf-8"
    )

    const highlighter = await createHighlighter({
      langs: ["typescript"],
      themes: [JSON.parse(editorTheme)],
    })

    highlighterInstance = highlighter
    return highlighter
  })()

  return highlighterPromise
}

export async function highlightCode(code: string) {
  if (!highlightCodeEnabled) {
    // Return code wrapped in basic HTML for static export
    return `<pre><code class="language-typescript">${escapeHtml(code)}</code></pre>`
  }

  try {
    const highlighter = await getHighlighter()

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

// Clean up highlighter on process exit (for server)
if (typeof process !== "undefined") {
  process.on("exit", () => {
    if (highlighterInstance) {
      highlighterInstance.dispose()
      highlighterInstance = null
    }
  })
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
