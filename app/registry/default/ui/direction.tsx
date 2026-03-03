"use client"

import * as React from "react"
import {
  DirectionProvider as RadixDirectionProvider,
  useDirection as useRadixDirection,
} from "@radix-ui/react-direction"

function DirectionProvider({
  dir,
  direction,
  children,
}: React.ComponentProps<typeof RadixDirectionProvider> & {
  direction?: React.ComponentProps<typeof RadixDirectionProvider>["dir"]
}) {
  return (
    <RadixDirectionProvider dir={direction ?? dir}>
      {children}
    </RadixDirectionProvider>
  )
}

const useDirection = useRadixDirection

export { DirectionProvider, useDirection }
