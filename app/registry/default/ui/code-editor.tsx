"use client"

import * as React from "react"
import Editor, { OnChange, OnMount } from "@monaco-editor/react"
import { Check, ChevronDown, Copy } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/default/ui/dropdown-menu"

export interface CodeEditorProps {
  value?: string
  defaultValue?: string
  language?: string
  height?: string | number
  theme?: "light" | "dark" | "auto"
  onChange?: OnChange
  onMount?: OnMount
  readOnly?: boolean
  lineNumbers?: boolean
  minimap?: boolean
  wordWrap?: "on" | "off" | "wordWrapColumn" | "bounded"
  fontSize?: number
  className?: string
  showCopyButton?: boolean
  showLanguageSelector?: boolean
  availableLanguages?: string[]
}

const defaultLanguages = [
  "javascript",
  "typescript",
  "python",
  "java",
  "csharp",
  "cpp",
  "c",
  "go",
  "rust",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "dart",
  "html",
  "css",
  "scss",
  "json",
  "xml",
  "yaml",
  "sql",
  "markdown",
  "shell",
  "plaintext",
]

const languageDisplayNames: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  csharp: "C#",
  cpp: "C++",
  c: "C",
  go: "Go",
  rust: "Rust",
  ruby: "Ruby",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
  dart: "Dart",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  json: "JSON",
  xml: "XML",
  yaml: "YAML",
  sql: "SQL",
  markdown: "Markdown",
  shell: "Shell",
  plaintext: "Plain Text",
}

const CodeEditor = React.forwardRef<HTMLDivElement, CodeEditorProps>(
  (
    {
      value,
      defaultValue = "",
      language = "javascript",
      height = "400px",
      theme: themeProp = "auto",
      onChange,
      onMount,
      readOnly = false,
      lineNumbers = true,
      minimap = false,
      wordWrap = "on",
      fontSize = 14,
      className,
      showCopyButton = true,
      showLanguageSelector = true,
      availableLanguages = defaultLanguages,
    },
    ref
  ) => {
    const { theme: systemTheme } = useTheme()
    const [selectedLanguage, setSelectedLanguage] = React.useState(language)
    const [copied, setCopied] = React.useState(false)
    const [editorValue, setEditorValue] = React.useState(value || defaultValue)

    React.useEffect(() => {
      if (value !== undefined) {
        setEditorValue(value)
      }
    }, [value])

    const handleCopy = React.useCallback(async () => {
      try {
        await navigator.clipboard.writeText(editorValue)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    }, [editorValue])

    const handleChange: OnChange = React.useCallback(
      (newValue, ev) => {
        setEditorValue(newValue || "")
        if (onChange) {
          onChange(newValue, ev)
        }
      },
      [onChange]
    )

    const resolveTheme = React.useMemo(() => {
      if (themeProp === "auto") {
        return systemTheme === "dark" ? "vs-dark" : "light"
      }
      return themeProp === "dark" ? "vs-dark" : "light"
    }, [themeProp, systemTheme])

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-md border bg-background",
          className
        )}
      >
        {(showLanguageSelector || showCopyButton) && (
          <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2">
            {showLanguageSelector && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 px-2 text-xs font-mono"
                  >
                    {languageDisplayNames[selectedLanguage] || selectedLanguage}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-h-80 overflow-auto"
                >
                  {availableLanguages.map((lang) => (
                    <DropdownMenuItem
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className="font-mono text-xs"
                    >
                      {languageDisplayNames[lang] || lang}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {showCopyButton && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2 text-xs"
                onClick={handleCopy}
                disabled={!editorValue}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </div>
        )}
        <Editor
          height={height}
          defaultLanguage={language}
          language={selectedLanguage}
          value={editorValue}
          defaultValue={defaultValue}
          theme={resolveTheme}
          onChange={handleChange}
          onMount={onMount}
          options={{
            readOnly,
            lineNumbers: lineNumbers ? "on" : "off",
            minimap: {
              enabled: minimap,
            },
            wordWrap,
            fontSize,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            padding: {
              top: 16,
              bottom: 16,
            },
          }}
        />
      </div>
    )
  }
)

CodeEditor.displayName = "CodeEditor"

export { CodeEditor }
