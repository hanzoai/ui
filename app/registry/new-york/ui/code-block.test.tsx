import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CodeBlock } from "./code-block"

// Mock clipboard
const mockWriteText = vi.fn().mockResolvedValue(undefined)
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: mockWriteText,
    readText: vi.fn().mockResolvedValue(""),
  },
  writable: true,
})

// Mock shiki
vi.mock("shiki", () => ({
  codeToHtml: vi
    .fn()
    .mockResolvedValue('<pre><code>const test = "hello"</code></pre>'),
}))

describe("CodeBlock", () => {
  const defaultProps = {
    code: 'const test = "hello"',
    language: "javascript",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders code block with basic props", async () => {
    render(<CodeBlock {...defaultProps} />)

    // Should show loading initially (20 = 10 lines × 2 skeletons per line: line number + code)
    expect(screen.getAllByTestId("skeleton")).toHaveLength(20)

    // Wait for syntax highlighting to complete
    await waitFor(() => {
      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument()
    })
  })

  it("displays filename when provided", async () => {
    render(<CodeBlock {...defaultProps} filename="test.js" />)

    await waitFor(() => {
      expect(screen.getByText("test.js")).toBeInTheDocument()
    })
  })

  it("displays language badge", async () => {
    render(<CodeBlock {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText("javascript")).toBeInTheDocument()
    })
  })

  it("shows copy button by default", async () => {
    render(<CodeBlock {...defaultProps} />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /copy code/i })
      ).toBeInTheDocument()
    })
  })

  it("hides copy button when showCopyButton is false", async () => {
    render(<CodeBlock {...defaultProps} showCopyButton={false} />)

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /copy code/i })
      ).not.toBeInTheDocument()
    })
  })

  it("copies code to clipboard when copy button is clicked", async () => {
    render(<CodeBlock {...defaultProps} />)

    await waitFor(() => {
      const copyButton = screen.getByRole("button", { name: /copy code/i })
      fireEvent.click(copyButton)
    })

    expect(mockWriteText).toHaveBeenCalledWith(defaultProps.code)
  })

  it("shows success state after copying", async () => {
    render(<CodeBlock {...defaultProps} />)

    await waitFor(() => {
      const copyButton = screen.getByRole("button", { name: /copy code/i })
      fireEvent.click(copyButton)
    })

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /copied/i })
      ).toBeInTheDocument()
    })
  })

  it("applies correct theme classes", () => {
    const { rerender } = render(<CodeBlock {...defaultProps} theme="light" />)

    expect(screen.getByTestId("code-block")).toHaveClass(
      "bg-slate-50",
      "border-slate-200"
    )

    rerender(<CodeBlock {...defaultProps} theme="dracula" />)
    expect(screen.getByTestId("code-block")).toHaveClass(
      "bg-slate-900",
      "border-purple-800/30"
    )
  })

  it("applies correct size classes", () => {
    const { rerender } = render(<CodeBlock {...defaultProps} size="sm" />)

    expect(screen.getByTestId("code-block")).toHaveClass("text-xs")

    rerender(<CodeBlock {...defaultProps} size="lg" />)
    expect(screen.getByTestId("code-block")).toHaveClass("text-base")
  })

  it("renders without line numbers when showLineNumbers is false", async () => {
    render(<CodeBlock {...defaultProps} showLineNumbers={false} />)

    await waitFor(() => {
      // Line numbers should not be rendered
      expect(screen.queryByText("1")).not.toBeInTheDocument()
    })
  })

  it("applies custom max height", () => {
    render(<CodeBlock {...defaultProps} maxHeight="300px" />)

    const codeContainer = screen
      .getByTestId("code-block")
      .querySelector('[style*="max-height"]')
    expect(codeContainer).toHaveStyle({ maxHeight: "300px" })
  })

  it("handles diff highlighting correctly", async () => {
    const diff = {
      added: [1, 3],
      removed: [2],
    }

    render(<CodeBlock {...defaultProps} diff={diff} />)

    await waitFor(() => {
      // Should render diff indicators
      expect(screen.getAllByText("+")).toHaveLength(2)
      expect(screen.getByText("-")).toBeInTheDocument()
    })
  })

  it("handles highlighted lines correctly", async () => {
    render(<CodeBlock {...defaultProps} highlightLines={[1, 3]} />)

    await waitFor(() => {
      const lines = screen.getAllByText(/const test/)
      expect(lines[0].closest("div")).toHaveClass(
        "bg-blue-500/10",
        "border-l-blue-500"
      )
    })
  })

  it("handles errors gracefully during syntax highlighting", async () => {
    const { codeToHtml } = require("shiki")
    codeToHtml.mockRejectedValueOnce(new Error("Syntax highlighting failed"))

    render(<CodeBlock {...defaultProps} />)

    await waitFor(() => {
      // Should fall back to plain text
      expect(screen.getByText('const test = "hello"')).toBeInTheDocument()
    })
  })
})
