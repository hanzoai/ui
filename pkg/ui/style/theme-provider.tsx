"use client"

import React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ThemeProviderProps } from "next-themes/dist/types"

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, ...props }) => (
  <NextThemesProvider 
    attribute="class" 
    {...props}
    value={{
      light: 'hanzo-ui-light-theme',
      dark: 'hanzo-ui-dark-theme'
    }}
  >
    {children}
  </NextThemesProvider>
)

export default ThemeProvider
