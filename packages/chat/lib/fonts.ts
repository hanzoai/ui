import { JetBrains_Mono as FontMono, Inter } from 'next/font/google'

export const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
})

export const fontMono = FontMono({
  subsets: ['latin'],
  variable: '--font-mono'
})
