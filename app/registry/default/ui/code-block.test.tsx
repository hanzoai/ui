import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { CodeBlock } from "./code-block"

// Mock shiki
jest.mock("shiki", () => ({
  codeToHtml: jest
    .fn()
    .mockResolvedValue('<pre><code>const test = "hello"</code></pre>'),
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
})

describe("CodeBlock", () => {
  const defaultProps = {
    code: 'const test = "hello"',
    language: "javascript",
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders code block with basic props", async () => {
    render(<CodeBlock {...defaultProps} />)

    // Should show loading initially
    expect(screen.getAllByTestId("skeleton")).toHaveLength(10)

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

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      defaultProps.code
    )
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

    expect(screen.getByRole("group")).toHaveClass(
      "bg-slate-50",
      "border-slate-200"
    )

    rerender(<CodeBlock {...defaultProps} theme="dracula" />)
    expect(screen.getByRole("group")).toHaveClass(
      "bg-slate-900",
      "border-purple-800/30"
    )
  })

  it("applies correct size classes", () => {
    const { rerender } = render(<CodeBlock {...defaultProps} size="sm" />)

    expect(screen.getByRole("group")).toHaveClass("text-xs")

    rerender(<CodeBlock {...defaultProps} size="lg" />)
    expect(screen.getByRole("group")).toHaveClass("text-base")
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
      .getByRole("group")
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
