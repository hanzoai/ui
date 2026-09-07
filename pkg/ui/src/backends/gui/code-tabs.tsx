'use client'

/**
 * CodeTabs — a set of code snippets sharing one tab strip, one tab per
 * language or variant (JavaScript, TypeScript, Python, …); choosing a tab
 * swaps the `CodeBlock` shown beneath it. Composes the backend's own `Tabs`
 * and `CodeBlock` rather than reimplementing either.
 */
import { SizableText, YStack } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { CodeBlock, type CodeBlockSize, type CodeBlockTheme } from './code-block'
import { slot } from './slot'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

export interface CodeTabsTab {
  label: string
  code: string
  language?: string
  filename?: string
}

export interface CodeTabsProps extends Omit<ComponentProps<typeof Tabs>, 'children' | 'defaultValue' | 'theme' | 'size'> {
  tabs: CodeTabsTab[]
  /** Index of the tab shown first, for an uncontrolled `CodeTabs`. */
  defaultTab?: number
  showLineNumbers?: boolean
  showCopyButton?: boolean
  theme?: CodeBlockTheme | null
  size?: CodeBlockSize | null
  /** The body's ceiling, in px or any CSS length; past it a tab's body scrolls. */
  maxHeight?: number | string
}

export function CodeTabs({
  tabs,
  defaultTab = 0,
  showLineNumbers,
  showCopyButton,
  theme,
  size,
  maxHeight,
  ...props
}: CodeTabsProps) {
  if (tabs.length === 0) {
    return (
      <YStack {...slot('code-tabs')} borderWidth={1} rounded="$4" p="$6" bg="$panel">
        <SizableText size="$2" color="$soft">
          No code tabs available. Add tabs to display code snippets.
        </SizableText>
      </YStack>
    )
  }

  return (
    <Tabs {...slot('code-tabs')} defaultValue={String(defaultTab)} {...props}>
      <TabsList {...slot('code-tabs-list')}>
        {tabs.map((tab, index) => (
          <TabsTrigger key={index} value={String(index)}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab, index) => (
        <TabsContent key={index} value={String(index)}>
          <CodeBlock
            code={tab.code}
            language={tab.language}
            filename={tab.filename}
            theme={theme}
            size={size}
            showLineNumbers={showLineNumbers}
            showCopyButton={showCopyButton}
            maxHeight={maxHeight}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
