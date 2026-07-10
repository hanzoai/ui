"use client"

/**
 * A segmented environment switcher (production / preview / …). Controlled: the
 * host owns `value` and re-scopes its data on `onChange`. Neutral design tokens
 * only, so it renders in any brand.
 */
import { Text, XStack } from "@hanzo/gui"

import type { EnvOption } from "./types"

export interface EnvSwitcherProps {
  options: EnvOption[]
  value: string
  onChange: (id: string) => void
  size?: "sm" | "md"
}

export function EnvSwitcher({
  options,
  value,
  onChange,
  size = "md",
}: EnvSwitcherProps) {
  const fs = size === "sm" ? "$1" : "$2"
  return (
    <XStack
      items="center"
      gap="$1"
      p="$1"
      rounded="$4"
      bg="$color2"
      borderWidth={1}
      borderColor="$borderColor"
      style={{ flexShrink: 0 }}
    >
      {options.map((o) => {
        const active = o.id === value
        return (
          <XStack
            key={o.id}
            items="center"
            gap="$1.5"
            px="$2.5"
            py="$1.5"
            rounded="$3"
            bg={active ? "$color1" : "transparent"}
            borderWidth={1}
            borderColor={active ? "$borderColor" : "transparent"}
            hoverStyle={active ? undefined : { bg: "$color3" }}
            onPress={() => onChange(o.id)}
            style={{
              cursor: "pointer",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,0.12)" : undefined,
            }}
          >
            <Text
              fontSize={fs}
              fontWeight={active ? "700" : "500"}
              color={active ? "$color12" : "$color10"}
            >
              {o.label}
            </Text>
            {o.count != null ? (
              <XStack
                bg={active ? "$color4" : "$color3"}
                px="$1.5"
                rounded={999}
                items="center"
              >
                <Text fontSize="$1" color="$color11" fontWeight="600">
                  {o.count}
                </Text>
              </XStack>
            ) : null}
          </XStack>
        )
      })}
    </XStack>
  )
}
