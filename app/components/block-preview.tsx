"use client"

import * as React from "react"
import Image from "next/image"

import { useConfig } from "@/hooks/use-config"
import { type Style } from "@/registry/styles"

interface BlockPreviewProps {
  name: string
  styleName?: Style["name"]
}

export function BlockPreview({ name, styleName }: BlockPreviewProps) {
  const [config] = useConfig()
  const style = styleName || config.style

  // Just show static images for now - no iframe to avoid loading registry chunks
  return (
    <div className="relative aspect-[4/2.5] w-full overflow-hidden rounded-md border md:-mx-1">
      <Image
        src={`/r/styles/${style}/${name}-light.png`}
        alt={name}
        width={1440}
        height={900}
        className="bg-background absolute top-0 left-0 z-20 w-[970px] max-w-none sm:w-[1280px] dark:hidden"
      />
      <Image
        src={`/r/styles/${style}/${name}-dark.png`}
        alt={name}
        width={1440}
        height={900}
        className="bg-background absolute top-0 left-0 z-20 hidden w-[970px] max-w-none sm:w-[1280px] dark:block"
      />
    </div>
  )
}
