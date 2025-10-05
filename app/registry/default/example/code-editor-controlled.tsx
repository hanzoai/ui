"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import { CodeEditor } from "@/registry/default/ui/code-editor"

export default function CodeEditorControlledDemo() {
  const [code, setCode] = React.useState(`// Type some code here
function greet(name) {
  return \`Hello, \${name}!\`
}`)

  const handleReset = () => {
    setCode(`// Code has been reset
function greet(name) {
  return \`Hello, \${name}!\`
}`)
  }

  const handleClear = () => {
    setCode("")
  }

  return (
    <div className="space-y-4">
      <CodeEditor
        value={code}
        onChange={(value) => setCode(value || "")}
        language="javascript"
        height="250px"
      />
      <div className="flex gap-2">
        <Button onClick={handleReset} variant="outline" size="sm">
          Reset Code
        </Button>
        <Button onClick={handleClear} variant="outline" size="sm">
          Clear
        </Button>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground">
          Characters: {code.length}
        </span>
      </div>
    </div>
  )
}
