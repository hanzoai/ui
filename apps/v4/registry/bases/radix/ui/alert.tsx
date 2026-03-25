import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/registry/bases/radix/lib/utils"

<<<<<<< HEAD
const alertVariants = cva("cn-alert w-full relative group/alert", {
=======
const alertVariants = cva("cn-alert group/alert relative w-full", {
>>>>>>> shadcn/main
  variants: {
    variant: {
      default: "cn-alert-variant-default",
      destructive: "cn-alert-variant-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
<<<<<<< HEAD
        "cn-alert-title [&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3",
=======
        "cn-alert-title cn-font-heading [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
>>>>>>> shadcn/main
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
<<<<<<< HEAD
        "cn-alert-description [&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3",
=======
        "cn-alert-description [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
>>>>>>> shadcn/main
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("cn-alert-action", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
