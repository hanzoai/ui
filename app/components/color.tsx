"use client"

import { Check, Clipboard } from "lucide-react"
import { type Color } from "@/lib/colors"
import { useColors } from "@/hooks/use-colors"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

export function Color({ color }: { color: Color }) {
  const { format } = useColors()
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  const getColorValue = () => {
    switch (format) {
      case "hex":
        return color.hex
      case "rgb":
        return `rgb(${color.rgb})`
      case "hsl":
        return `hsl(${color.hsl})`
      case "className":
        return color.className
      default:
        return color.hex
    }
  }

  return (
    <button
      key={color.hex}
      className="group relative flex aspect-[3/1] w-full flex-1 flex-col gap-2 text-[--text] sm:aspect-[2/3] sm:h-auto sm:w-auto [&>svg]:absolute [&>svg]:right-4 [&>svg]:top-4 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:opacity-0 [&>svg]:transition-opacity"
      style={
        {
          "--bg": `hsl(${color.hsl})`,
          "--text": color.foreground,
        } as React.CSSProperties
      }
      onClick={() => {
        const value = getColorValue()
        copyToClipboard(value)
      }}
    >
      {isCopied ? (
        <Check className="group-hover:opacity-100" />
      ) : (
        <Clipboard className="group-hover:opacity-100" />
      )}
      <div className="w-full flex-1 rounded-md bg-[--bg] md:rounded-lg" />
      <div className="flex w-full flex-col items-center justify-center gap-1">
        <span className="hidden font-mono text-xs tabular-nums text-muted-foreground transition-colors group-hover:text-foreground lg:flex">
          {color.className}
        </span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground transition-colors group-hover:text-foreground lg:hidden">
          {color.scale}
        </span>
      </div>
    </button>
  )
}