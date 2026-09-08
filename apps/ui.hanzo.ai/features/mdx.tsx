import { H2, H3, H4, Paragraph, Separator, Text, YStack } from '@hanzo/gui'
import {
  ApplyTypography,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Switch,
  Text as UIText,
  XStack,
  YStack as UIYStack,
} from '@hanzo/ui'
import { Content } from '@hanzo/ui/blocks'
import { Cell, Grid } from '@hanzo/ui/grid'
import { BarChart, BarRows, Donut, LineChart, Sparkline } from '@hanzo/ui/product'
import { getMDXComponent } from '@vxrn/mdx-rust/client'
import type { Href } from 'one'
import { Link } from 'one'
import type { ComponentProps, ComponentType, ReactNode } from 'react'

import { brand } from '~/brand'
import { Blocks as ProseBlocks } from '~/examples/prose'

/**
 * How a docs page renders.
 *
 * The compiled body is evaluated with the brand in scope, so a page writes
 * `{brand.name}` and never the name itself. What Markdown emits is drawn with
 * the primitives the module pages use; what a page names by tag — a grid, a
 * chart, a block list — is the package's own, so a sample on a page is the
 * thing it shows.
 */
export const render = (code: string) => getMDXComponent(`const { brand } = arguments[0];${code}`, { brand })

/** A block of code: the fence's title above the highlighted source. */
const Code = ({ html, title }: { html: string; title?: string }) => (
  <YStack gap="$1">
    {title ? (
      <Text fontFamily="$mono" fontSize={11} color="$color10">
        {title}
      </Text>
    ) : null}
    <pre className="code" dangerouslySetInnerHTML={{ __html: html }} />
  </YStack>
)

/** The frame a module page draws an example in. */
const Preview = ({ children }: { children?: ReactNode }) => (
  <YStack p="$5" rounded="$4" borderWidth={1} borderColor="$borderColor" gap="$3">
    {children}
  </YStack>
)

/** A cell with its number on it, for showing where a grid puts things. */
const Tile = ({ children }: { children?: ReactNode }) => (
  <YStack minH={56} items="center" justify="center" rounded="$3" bg="$color3" borderWidth={1} borderColor="$borderColor">
    <Text fontFamily="$mono" fontSize={12} color="$color11">
      {children}
    </Text>
  </YStack>
)

type Head = ComponentProps<'h2'>

export const components: Record<string, ComponentType<any>> = {
  h2: ({ id, children }: Head) => (
    <H2 id={id} size="$6" mt="$4">
      {children}
    </H2>
  ),
  h3: ({ id, children }: Head) => (
    <H3 id={id} size="$4" mt="$2">
      {children}
    </H3>
  ),
  h4: ({ id, children }: Head) => (
    <H4 id={id} size="$3">
      {children}
    </H4>
  ),
  p: ({ children }: ComponentProps<'p'>) => <Paragraph>{children}</Paragraph>,
  a: ({ href = '', children }: ComponentProps<'a'>) => (
    <Link href={href as Href} {...(href.startsWith('http') && { target: '_blank' })}>
      {children}
    </Link>
  ),
  pre: ({ children }: ComponentProps<'pre'>) => <>{children}</>,
  code: ({ html, title, children }: ComponentProps<'code'> & { html?: string }) =>
    html === undefined ? <code>{children}</code> : <Code html={html} title={title} />,
  hr: () => <Separator />,
  Preview,
  Tile,
  Grid,
  Cell,
  Content,
  Sparkline,
  LineChart,
  BarChart,
  Donut,
  BarRows,
  ApplyTypography,
  ProseBlocks,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Switch,
  Text: UIText,
  XStack,
  YStack: UIYStack,
}
