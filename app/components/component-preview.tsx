"use client"

import * as React from "react"
import Image from "next/image"
import { Index } from "@/__registry__"

import { cn } from "@/lib/utils"
import { useConfig } from "@/hooks/use-config"
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
} from "@/registry/new-york/ui/tabs"
import { styles, type Style } from "@/registry/styles"

interface ComponentPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  extractClassname?: boolean
  extractedClassNames?: string
  align?: "center" | "start" | "end"
  description?: string
  type?: "block" | "component" | "example"
  hideCode?: boolean
  styleName?: Style["name"]
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
  ...props
}: ComponentPreviewProps) {
  const [config] = useConfig()
  const index = styles.findIndex((style) => style.name === config.style)

  // Render blocks with static images for mobile, iframe for desktop
  // This matches shadcn's approach and avoids chunk loading issues
  if (type === "block") {
    const style = styleName || config.style
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
          <iframe src={`/view/${style}/${name}`} className="size-full" />
        </div>
      </div>
    )
  }

  const Codes = React.Children.toArray(children) as React.ReactElement[]
  const Code = Codes[index]

  const Component = Index[config.style][name]?.component

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

  const codeString = React.useMemo(() => {
    const codeProps = Code?.props as CodeBlockProps | undefined
    if (
      typeof codeProps?.["data-rehype-pretty-code-fragment"] !== "undefined"
    ) {
      const [Button] = React.Children.toArray(
        codeProps.children
      ) as React.ReactElement[]
      const buttonProps = Button?.props as CodeButtonProps | undefined
      return buttonProps?.value || buttonProps?.__rawString__ || null
    }
  }, [Code])

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
              {config.style === "default" && description && codeString ? (
                <V0Button
                  block={{
                    code: codeString,
                    name,
                    style: config.style,
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
                "preview flex min-h-[350px] w-full justify-center p-10",
                {
                  "items-center": align === "center",
                  "items-start": align === "start",
                  "items-end": align === "end",
                }
              )}
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
              {Code}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
