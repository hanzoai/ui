import { useState } from "react"
import { Text, XStack, YStack } from "@hanzo/gui"
import { Button, CodeEditor } from "@hanzo/ui"

/** Default — a language menu, a copy button and a short JavaScript sample. */
export function Default() {
  return (
    <CodeEditor
      language="javascript"
      height={220}
      defaultValue={`function fibonacci(n) {\n  if (n <= 1) return n\n  return fibonacci(n - 1) + fibonacci(n - 2)\n}\n\nconsole.log(fibonacci(10))`}
    />
  )
}

/** Controlled — the field's value lives in the parent's own state, reset and cleared from outside it. */
export function Controlled() {
  const [code, setCode] = useState("// type some code here\n")

  return (
    <YStack gap="$3">
      <CodeEditor value={code} onChange={setCode} language="typescript" height={180} />
      <XStack gap="$2" items="center">
        <Button variant="outline" size="sm" onClick={() => setCode("// reset\n")}>
          Reset
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCode("")}>
          Clear
        </Button>
        <Text fontFamily="$mono" fontSize="$1" color="$soft">
          {code.length} chars
        </Text>
      </XStack>
    </YStack>
  )
}

/** Read only — no toolbar, no gutter, and the field refuses every keystroke. */
export function ReadOnly() {
  return (
    <CodeEditor
      readOnly
      showLanguageSelector={false}
      showCopyButton={false}
      lineNumbers={false}
      language="sql"
      height={140}
      defaultValue={`SELECT id, email\nFROM users\nWHERE created_at >= NOW() - INTERVAL '30 days'`}
    />
  )
}

/** Fixed language — the menu is hidden and word wrap is off, so a long Go line scrolls sideways instead of breaking. */
export function FixedLanguage() {
  return (
    <CodeEditor
      showLanguageSelector={false}
      wordWrap="off"
      language="go"
      height={160}
      defaultValue={`func worker(id int, jobs <-chan int, results chan<- int) {\n\tfor job := range jobs {\n\t\tresults <- job * 2\n\t}\n}`}
    />
  )
}

/** JSON — highlighted, checked on every keystroke, re-indented by Format; the footer names a broken line and resizes the editor. */
export function Json() {
  return (
    <CodeEditor
      language="json"
      showLanguageSelector={false}
      defaultValue={`{\n  "customer": "Acme Corp",\n  "plan": "Enterprise"\n  "seats": 40\n}`}
    />
  )
}

/** JSON or text — `allowText` lets prose through and still holds anything that opens an object or array to JSON. */
export function JsonOrText() {
  return (
    <CodeEditor
      language="json"
      allowText
      showLanguageSelector={false}
      placeholder="JSON object, array, or text"
      defaultValue="We are receiving 502 Bad Gateway errors since 14:00 UTC."
    />
  )
}
