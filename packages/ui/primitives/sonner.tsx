"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-muted-3 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-muted-3",
          cancelButton:
            "group-[.toast]:bg-level-3 group-[.toast]:text-muted-3",
        },
      }}
      {...props}
    />
  )
}

export {
  toast,
  Toaster
}