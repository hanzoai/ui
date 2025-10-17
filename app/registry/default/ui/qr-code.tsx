"use client"

import * as React from "react"
import { QRCodeSVG } from "qrcode.react"

import { cn } from "@/lib/utils"

interface QRCodeProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  size?: number
  level?: "L" | "M" | "Q" | "H"
  bgColor?: string
  fgColor?: string
  includeMargin?: boolean
  imageSettings?: {
    src: string
    height: number
    width: number
    excavate?: boolean
  }
}

const QRCode = React.forwardRef<HTMLDivElement, QRCodeProps>(
  (
    {
      className,
      value,
      size = 256,
      level = "M",
      bgColor = "#FFFFFF",
      fgColor = "#000000",
      includeMargin = false,
      imageSettings,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center justify-center", className)}
        {...props}
      >
        <QRCodeSVG
          value={value}
          size={size}
          level={level}
          bgColor={bgColor}
          fgColor={fgColor}
          includeMargin={includeMargin}
          imageSettings={imageSettings}
        />
      </div>
    )
  }
)
QRCode.displayName = "QRCode"

export { QRCode }
