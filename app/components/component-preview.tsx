"use client"

import * as React from "react"
import Image from "next/image"
import { Index } from "@/__registry__"

import { cn } from "@/lib/utils"
import { CopyButton, CopyWithClassNames } from "@/components/copy-button"
import { Icons } from "@/components/icons"
import { StyleSwitcher } from "@/components/style-switcher"
import { ThemeWrapper } from "@/components/theme-wrapper"
import { V0Button } from "@/components/v0-button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/default/ui/tabs"
import { getActiveStyle, styles, type Style } from "@/registry/styles"

interface ComponentPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  extractClassname?: boolean
  extractedClassNames?: string
  align?: "center" | "start" | "end"
  description?: string
  type?: "block" | "component" | "example"
  hideCode?: boolean
  styleName?: Style["name"]
  minHeight?: string
}

interface CodeBlockProps {
  "data-rehype-pretty-code-fragment"?: string
  children?: React.ReactNode
}

interface CodeButtonProps {
  value?: string
  __rawString__?: string
}

export function ComponentPreview({
  name,
  children,
  className,
  extractClassname,
  extractedClassNames,
  align = "center",
  description,
  type,
  hideCode = false,
  styleName,
  minHeight,
  ...props
}: ComponentPreviewProps) {
  // Use provided styleName or default to active style
  const activeStyle = styleName || getActiveStyle().name
  const index = styles.findIndex((style) => style.name === activeStyle)

  // Check if this is a finance component - they need more height
  const isFinanceComponent = name.includes('chart') || name.includes('market') ||
    name.includes('screener') || name.includes('trading') || name.includes('order') ||
    name.includes('position') || name.includes('symbol') || name.includes('company') ||
    name.includes('financial') || name.includes('technical') || name.includes('news')

  // Set default min height based on component type
  const defaultMinHeight = isFinanceComponent ? "600px" : "350px"
  const previewMinHeight = minHeight || defaultMinHeight

  // Render blocks with static images for mobile, iframe for desktop
  // This matches shadcn's approach and avoids chunk loading issues
  if (type === "block") {
    const style = activeStyle
    return (
      <div className="relative aspect-[4/2.5] w-full overflow-hidden rounded-md border md:-mx-1">
        <Image
          src={`/r/styles/${style}/${name}-light.png`}
          alt={name}
          width={1440}
          height={900}
          className="bg-background absolute top-0 left-0 z-20 w-[970px] max-w-none sm:w-[1280px] md:hidden dark:hidden md:dark:hidden"
        />
        <Image
          src={`/r/styles/${style}/${name}-dark.png`}
          alt={name}
          width={1440}
          height={900}
          className="bg-background absolute top-0 left-0 z-20 hidden w-[970px] max-w-none sm:w-[1280px] md:hidden dark:block md:dark:hidden"
        />
        <div className="bg-background absolute inset-0 hidden w-[1600px] md:block">
          <iframe src={`/view/${name}`} className="size-full" />
        </div>
      </div>
    )
  }

  const Codes = React.Children.toArray(children) as React.ReactElement[]
  const Code = Codes[index]

  // Single theme system - no style nesting in Index
  const Component = Index[name]?.component

  if (!Component) {
    return (
      <p className="text-sm text-muted-foreground">
        Component{" "}
        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
          {name}
        </code>{" "}
        not found in registry.
      </p>
    )
  }

  const Preview = React.useMemo(() => {
    return <Component />
  }, [Component])

  // Fetch code from registry JSON if not provided as children
  const [registryCode, setRegistryCode] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Only fetch if no children were provided
    if (!Code) {
      fetch(`/registry/styles/${activeStyle}/${name}.json`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.files?.[0]?.content) {
            setRegistryCode(data.files[0].content)
          }
        })
        .catch(() => {
          // Silently fail - component will still render preview
        })
    }
  }, [activeStyle, name, Code])

  const codeString = React.useMemo(() => {
    // First try to get code from MDX children (backward compatibility)
    const codeProps = Code?.props as CodeBlockProps | undefined
    if (
      typeof codeProps?.["data-rehype-pretty-code-fragment"] !== "undefined"
    ) {
      const [Button] = React.Children.toArray(
        codeProps.children
      ) as React.ReactElement[]
      const buttonProps = Button?.props as CodeButtonProps | undefined
      const childrenCode =
        buttonProps?.value || buttonProps?.__rawString__ || null
      if (childrenCode) return childrenCode
    }

    // Fall back to registry code
    return registryCode
  }, [Code, registryCode])

  return (
    <div
      className={cn("group relative my-4 flex flex-col space-y-2", className)}
      {...props}
    >
      <Tabs defaultValue="preview" className="relative mr-auto w-full">
        <div className="flex items-center justify-between pb-3">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="preview"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Preview
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Code
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="preview" className="relative rounded-md border">
          <div className="flex items-center justify-between p-4">
            <StyleSwitcher />
            <div className="flex items-center gap-2">
              {activeStyle === "default" && description && codeString ? (
                <V0Button
                  block={{
                    code: codeString,
                    name,
                    style: activeStyle,
                    description,
                  }}
                />
              ) : null}
              {codeString ? (
                <CopyButton
                  value={codeString}
                  variant="outline"
                  className="h-7 w-7 text-foreground opacity-100 hover:bg-muted hover:text-foreground [&_svg]:size-3.5"
                />
              ) : null}
            </div>
          </div>
          <ThemeWrapper defaultTheme="zinc">
            <div
              className={cn(
                "preview flex w-full justify-center",
                isFinanceComponent ? "p-4" : "p-10",
                {
                  "items-center": align === "center",
                  "items-start": align === "start",
                  "items-end": align === "end",
                }
              )}
              style={{ minHeight: previewMinHeight }}
            >
              <React.Suspense
                fallback={
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                }
              >
                {Preview}
              </React.Suspense>
            </div>
          </ThemeWrapper>
        </TabsContent>
        <TabsContent value="code">
          <div className="flex flex-col space-y-4">
            <div className="w-full rounded-md [&_pre]:my-0 [&_pre]:max-h-[350px] [&_pre]:overflow-auto">
              {Code ||
                (codeString && (
                  <pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 dark:bg-zinc-900">
                    <code className="text-sm text-zinc-50">{codeString}</code>
                  </pre>
                ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
