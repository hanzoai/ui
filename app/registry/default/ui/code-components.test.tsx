import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { CodeCompare } from "./code-compare"
import { CodeDiff } from "./code-diff"
import { CodeExplorer } from "./code-explorer"
import { CodePreview } from "./code-preview"
import { CodeSnippet, InlineCode } from "./code-snippet"
import { CodeTerminal } from "./code-terminal"

// Mock Shiki
vi.mock("shiki", () => ({
  codeToHtml: vi.fn().mockResolvedValue("<span>mocked code</span>"),
}))

describe("Code Components", () => {
  describe("CodeDiff", () => {
    it("renders with basic props", async () => {
      render(
        <CodeDiff
          oldCode="line 1\nline 2"
          newCode="line 1\nline 2 modified"
          language="text"
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Comparison/)).toBeInTheDocument()
      })
    })

    it("shows file statistics", async () => {
      render(
        <CodeDiff oldCode="old content" newCode="new content" language="text" />
      )

      await waitFor(() => {
        expect(screen.getByText(/\+\d+/)).toBeInTheDocument()
        expect(screen.getByText(/-\d+/)).toBeInTheDocument()
      })
    })
  })

  describe("CodeSnippet", () => {
    it("renders code content", async () => {
      render(<CodeSnippet code="console.log('hello')" language="javascript" />)

      await waitFor(() => {
        expect(screen.getByText(/mocked code/)).toBeInTheDocument()
      })
    })

    it("shows copy button when enabled", () => {
      render(<CodeSnippet code="test code" showCopyButton={true} />)

      expect(
        screen.getByRole("button", { name: /copy code/i })
      ).toBeInTheDocument()
    })

    it("renders inline variant", async () => {
      render(
        <InlineCode language="javascript">const test = 'hello'</InlineCode>
      )

      await waitFor(() => {
        expect(screen.getByText(/mocked code/)).toBeInTheDocument()
      })
    })
  })

  describe("CodePreview", () => {
    const mockFiles = [
      {
        filename: "index.html",
        content: "<h1>Hello World</h1>",
        language: "html",
        type: "html" as const,
      },
      {
        filename: "style.css",
        content: "h1 { color: red; }",
        language: "css",
        type: "css" as const,
      },
    ]

    it("renders file tabs", () => {
      render(<CodePreview files={mockFiles} />)

      expect(screen.getByText("index.html")).toBeInTheDocument()
      expect(screen.getByText("style.css")).toBeInTheDocument()
    })

    it("shows run button", () => {
      render(<CodePreview files={mockFiles} />)

      expect(screen.getByRole("button", { name: /run/i })).toBeInTheDocument()
    })

    it("toggles preview visibility", () => {
      render(<CodePreview files={mockFiles} showPreview={true} />)

      const previewToggle = screen.getByLabelText(/toggle preview/i)
      fireEvent.click(previewToggle)

      // Preview should be toggled
      expect(previewToggle).toHaveAttribute("aria-pressed", "false")
    })
  })

  describe("CodeTerminal", () => {
    it("renders terminal header", () => {
      render(<CodeTerminal title="Test Terminal" allowInput={true} />)

      expect(screen.getByText("Test Terminal")).toBeInTheDocument()
    })

    it("handles command input", async () => {
      const mockOnCommand = vi.fn()
      render(<CodeTerminal allowInput={true} onCommand={mockOnCommand} />)

      const input = screen.getByPlaceholderText(/enter command/i)
      fireEvent.change(input, { target: { value: "ls" } })
      fireEvent.submit(input.closest("form")!)

      expect(mockOnCommand).toHaveBeenCalledWith("ls")
    })

    it("shows clear button when enabled", () => {
      render(<CodeTerminal allowClear={true} />)

      expect(screen.getByRole("button")).toBeInTheDocument()
    })
  })

  describe("CodeExplorer", () => {
    const mockFiles = [
      {
        id: "1",
        name: "src",
        type: "folder" as const,
        path: "/src",
        children: [
          {
            id: "2",
            name: "index.js",
            type: "file" as const,
            path: "/src/index.js",
            language: "javascript",
          },
        ],
      },
    ]

    it("renders file tree", () => {
      render(<CodeExplorer files={mockFiles} />)

      expect(screen.getByText("src")).toBeInTheDocument()
      expect(screen.getByText("index.js")).toBeInTheDocument()
    })

    it("handles file selection", () => {
      const mockOnFileSelect = vi.fn()
      render(<CodeExplorer files={mockFiles} onFileSelect={mockOnFileSelect} />)

      fireEvent.click(screen.getByText("index.js"))
      expect(mockOnFileSelect).toHaveBeenCalled()
    })

    it("shows search when enabled", () => {
      render(<CodeExplorer files={mockFiles} showSearch={true} />)

      expect(screen.getByPlaceholderText(/search files/i)).toBeInTheDocument()
    })
  })

  describe("CodeCompare", () => {
    const mockFiles = [
      {
        id: "1",
        filename: "old.js",
        content: "old content",
        language: "javascript",
        label: "Old",
      },
      {
        id: "2",
        filename: "new.js",
        content: "new content",
        language: "javascript",
        label: "New",
      },
    ]

    it("renders file selector buttons", () => {
      render(<CodeCompare files={mockFiles} />)

      expect(screen.getByText("Old")).toBeInTheDocument()
      expect(screen.getByText("New")).toBeInTheDocument()
    })

    it("shows view mode tabs", () => {
      render(<CodeCompare files={mockFiles} />)

      expect(screen.getByText("Side by Side")).toBeInTheDocument()
      expect(screen.getByText("Unified")).toBeInTheDocument()
      expect(screen.getByText("Three-way")).toBeInTheDocument()
    })

    it("handles file selection", () => {
      const mockOnFileSelect = vi.fn()
      render(<CodeCompare files={mockFiles} onFileSelect={mockOnFileSelect} />)

      fireEvent.click(screen.getByText("Old"))
      expect(mockOnFileSelect).toHaveBeenCalledWith("1")
    })
  })
})
