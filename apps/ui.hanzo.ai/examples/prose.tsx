import type { ComponentProps } from "react"
import { YStack } from "@hanzo/gui"
import { ApplyTypography } from "@hanzo/ui"

type Size = NonNullable<ComponentProps<typeof ApplyTypography>["size"]>

const SIZES: Size[] = ["responsive", "sm", "base", "lg", "xl"]

/** Default — bare tags styled by their ancestor, which is how content from a CMS field or an .mdx file arrives. */
export function Default() {
  return (
    <ApplyTypography>
      <h1>Streaming on every model</h1>
      <h6>Mara Okafor, 4 min read</h6>
      <p>
        Responses now stream token by token from every model behind the API,
        with the same <code>stream: true</code> flag and the same event shape
        for all of them.
      </p>
      <ul>
        <li>Time to first token drops under 200 ms on the hosted models.</li>
        <li>
          Tool calls arrive as they are decided, not after the whole reply.
        </li>
        <li>
          The Node and Python SDKs expose the stream as an async iterator.
        </li>
      </ul>
    </ApplyTypography>
  )
}

/** Sizes — the responsive default follows the viewport; the four fixed rungs hold the size they were given on any screen. */
export function Sizes() {
  return (
    <YStack gap="$5">
      {SIZES.map((size) => (
        <ApplyTypography key={size} asTag="section" size={size}>
          <h3>Rate limits</h3>
          <p>
            Each key is allowed 600 requests a minute, counted across every
            model it calls.
          </p>
        </ApplyTypography>
      ))}
    </YStack>
  )
}

/** Blocks — headings, lists, links, inline and block code and a quote, each given its type back by tag alone. */
export function Blocks() {
  return (
    <ApplyTypography size="base">
      <h2>Install</h2>
      <p>
        Add the package, then wrap the app once at the root. The full guide is
        at <a href="https://ui.hanzo.ai">ui.hanzo.ai</a>.
      </p>
      <pre>
        <code>{"pnpm add @hanzo/ui\npnpm dev"}</code>
      </pre>
      <ol>
        <li>
          Render <strong>Hanzo</strong> once, around the whole tree.
        </li>
        <li>
          Import <code>Button</code> or any other component from the same
          package.
        </li>
        <li>Pass it the props its type declares.</li>
      </ol>
      <blockquote>
        Components read their colours from the theme, so a token changed there
        changes every surface at once.
      </blockquote>
    </ApplyTypography>
  )
}

/** Nested — the rules reach one level of children, so an aside that is its own container keeps the size it asked for. */
export function Nested() {
  return (
    <ApplyTypography asTag="article">
      <h2>Keys</h2>
      <p>
        A key belongs to one organisation and calls every model that
        organisation has enabled.
      </p>
      <ApplyTypography asTag="aside" size="sm">
        <h4>Rotation</h4>
        <p>
          Rotating issues the new key before the old one stops, so a deploy in
          flight keeps working.
        </p>
      </ApplyTypography>
      <p>Revoking a key takes effect at once and cannot be undone.</p>
    </ApplyTypography>
  )
}
