"use client"

/**
 * A compact source reference — the repo (`owner/name` + branch), image
 * (`repository:tag`), template, database engine, or managed origin a service
 * ships from, with a matching glyph. Monospace ref for scannability; the text
 * uses a neutral design token, the decorative glyph a muted neutral hue.
 */
import { Text, XStack } from "@hanzo/gui"

import { sourceGlyph } from "./glyphs"
import type { ServiceSource } from "./types"

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace"

export interface SourceRefProps {
  source: ServiceSource
  size?: "sm" | "md"
}

export function SourceRef({ source, size = "md" }: SourceRefProps) {
  const Glyph = sourceGlyph(source.kind)
  const fs = size === "sm" ? "$1" : "$2"
  const glyphSize = size === "sm" ? 12 : 13
  return (
    <XStack items="center" gap="$1.5" minW={0}>
      <span style={{ display: "inline-flex", color: "#8b949e", flexShrink: 0 }}>
        <Glyph size={glyphSize} />
      </span>
      <Text
        fontSize={fs}
        color="$color10"
        numberOfLines={1}
        style={{ fontFamily: MONO }}
        minW={0}
      >
        {source.ref}
      </Text>
      {source.branch ? (
        <Text
          fontSize={fs}
          color="$color9"
          numberOfLines={1}
          style={{ fontFamily: MONO }}
        >
          {source.branch}
        </Text>
      ) : null}
    </XStack>
  )
}
