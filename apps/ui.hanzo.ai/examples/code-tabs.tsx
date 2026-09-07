import { YStack } from "@hanzo/gui"
import { CodeTabs } from "@hanzo/ui"

const greet = [
  {
    label: "JavaScript",
    language: "javascript",
    code: `function greet(name) {\n  return \`Hello, \${name}!\`\n}\n\nconsole.log(greet("World"))`,
  },
  {
    label: "TypeScript",
    language: "typescript",
    code: `function greet(name: string): string {\n  return \`Hello, \${name}!\`\n}\n\nconsole.log(greet("World"))`,
  },
  {
    label: "Python",
    language: "python",
    code: `def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))`,
  },
]

/** Default — one tab per language, switching the code shown beneath the strip. */
export function Default() {
  return (
    <YStack width="100%" maxW={640}>
      <CodeTabs tabs={greet} />
    </YStack>
  )
}

/** Starting tab — `defaultTab` opens on Python rather than the first entry. */
export function StartingTab() {
  return (
    <YStack width="100%" maxW={640}>
      <CodeTabs tabs={greet} defaultTab={2} />
    </YStack>
  )
}

/** Themed — a fixed syntax palette and a shorter body before it scrolls. */
export function Themed() {
  return (
    <YStack width="100%" maxW={640}>
      <CodeTabs tabs={greet} theme="dracula" maxHeight={160} />
    </YStack>
  )
}

/** Empty — the message shown when a `CodeTabs` is given no tabs at all. */
export function Empty() {
  return (
    <YStack width="100%" maxW={640}>
      <CodeTabs tabs={[]} />
    </YStack>
  )
}
