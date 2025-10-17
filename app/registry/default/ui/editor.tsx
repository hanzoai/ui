"use client"

import * as React from "react"
import { Bold, Italic, List, ListOrdered } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

export interface EditorProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

const Editor = React.forwardRef<HTMLDivElement, EditorProps>(
  (
    { className, value, onChange, placeholder = "Start typing...", ...props },
    ref
  ) => {
    const editorRef = React.useRef<HTMLDivElement>(null)

    const executeCommand = (command: string, value?: string) => {
      document.execCommand(command, false, value)
      editorRef.current?.focus()
    }

    const handleInput = () => {
      if (editorRef.current) {
        onChange?.(editorRef.current.innerHTML)
      }
    }

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        <div className="flex gap-1 border-b pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("bold")}
            type="button"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("italic")}
            type="button"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("insertUnorderedList")}
            type="button"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("insertOrderedList")}
            type="button"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[200px] rounded-lg border p-4 focus:outline-none focus:ring-2 focus:ring-ring"
          onInput={handleInput}
          dangerouslySetInnerHTML={{ __html: value || "" }}
          data-placeholder={placeholder}
        />
      </div>
    )
  }
)
Editor.displayName = "Editor"

export { Editor }
