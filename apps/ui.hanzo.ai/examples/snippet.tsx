import { Paragraph, Text, XStack, YStack } from "@hanzo/gui"
import { InlineCode, Snippet } from "@hanzo/ui"

const FIBONACCI = `function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

console.log(fibonacci(10))`

/** Default — a bordered panel with a filename, a language badge, numbered lines, one highlighted, and a copy button. */
export function Default() {
  return (
    <Snippet
      code={FIBONACCI}
      language="typescript"
      filename="fibonacci.ts"
      showLineNumbers
      highlightLines={[3]}
    />
  )
}

/** Themes — the same code on six fixed syntax surfaces, independent of the page's own theme. */
export function Themes() {
  const code = `const greet = (name: string) => \`Hello, \${name}!\``
  return (
    <YStack gap="$3">
      <Snippet code={code} language="ts" theme="dark" />
      <Snippet code={code} language="ts" theme="light" />
      <Snippet code={code} language="ts" theme="github" />
      <Snippet code={code} language="ts" theme="github-dark" />
      <Snippet code={code} language="ts" theme="terminal" />
      <Snippet code={code} language="ts" theme="retro" />
    </YStack>
  )
}

/** Expandable and minimal — a tall file clamped to `collapsedHeight` until Expand is pressed, next to the borderless variant. */
export function ExpandableAndMinimal() {
  const long = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join("\n")
  return (
    <YStack gap="$4">
      <Snippet
        code={long}
        language="text"
        filename="log.txt"
        showLineNumbers
        expandable
        collapsedHeight={120}
        maxHeight={480}
      />
      <Snippet code={long.slice(0, 40)} language="text" variant="minimal" />
    </YStack>
  )
}

/** Inline — `InlineCode` drops a short code phrase into a sentence with no panel or gutter. */
export function Inline() {
  return (
    <Paragraph>
      <Text>Run </Text>
      <InlineCode language="bash">npm install @hanzo/ui</InlineCode>
      <Text> to add the package, then import </Text>
      <InlineCode language="ts">Snippet</InlineCode>
      <Text> from it.</Text>
    </Paragraph>
  )
}
