"use client"

import * as React from "react"

import { ColorFormat } from "@/lib/colors"

interface ColorsContextType {
  format: ColorFormat
  setFormat: (format: ColorFormat) => void
  isLoading: boolean
}

const ColorsContext = React.createContext<ColorsContextType | undefined>(
  undefined
)

export function ColorsProvider({ children }: { children: React.ReactNode }) {
  const [format, setFormat] = React.useState<ColorFormat>("hex")
  const [isLoading, setIsLoading] = React.useState(false)

  return (
    <ColorsContext.Provider value={{ format, setFormat, isLoading }}>
      {children}
    </ColorsContext.Provider>
  )
}

export function useColors() {
  const context = React.useContext(ColorsContext)
  if (!context) {
    // Return default values if not in provider
    return {
      format: "hex" as ColorFormat,
      setFormat: () => {},
      isLoading: false,
    }
  }
  return context
}
