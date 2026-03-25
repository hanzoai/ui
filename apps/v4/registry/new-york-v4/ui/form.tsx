"use client"

import * as React from "react"
import type { Label as LabelPrimitive } from "radix-ui"
import { Slot } from "radix-ui"
import {
  Controller,
  FormProvider,
  useFormContext,
<<<<<<< HEAD
  useFormState,
=======
<<<<<<<< HEAD:app/registry/default/ui/form.tsx
========
  useFormState,
>>>>>>>> shadcn/main:apps/v4/registry/new-york-v4/ui/form.tsx
>>>>>>> shadcn/main
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/registry/new-york-v4/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

<<<<<<< HEAD
const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)
=======
const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)
>>>>>>> shadcn/main

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
<<<<<<< HEAD
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)
=======
<<<<<<<< HEAD:app/registry/default/ui/form.tsx
  const { getFieldState, formState } = useFormContext()
========
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)
>>>>>>>> shadcn/main:apps/v4/registry/new-york-v4/ui/form.tsx
>>>>>>> shadcn/main

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

<<<<<<< HEAD
=======
  if (!itemContext) {
    throw new Error("useFormField should be used within <FormItem>")
  }

  const fieldState = getFieldState(fieldContext.name, formState)

>>>>>>> shadcn/main
  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

<<<<<<< HEAD
const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)
=======
const FormItemContext = React.createContext<FormItemContextValue | null>(null)
>>>>>>> shadcn/main

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot.Root>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
<<<<<<< HEAD
      className={cn("text-muted-foreground text-sm", className)}
=======
      className={cn("text-sm text-muted-foreground", className)}
>>>>>>> shadcn/main
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField()
<<<<<<< HEAD
  const body = error ? String(error?.message ?? "") : props.children
=======
<<<<<<<< HEAD:app/registry/default/ui/form.tsx
  const body = error ? String(error?.message ?? "") : children
========
  const body = error ? String(error?.message ?? "") : props.children
>>>>>>>> shadcn/main:apps/v4/registry/new-york-v4/ui/form.tsx
>>>>>>> shadcn/main

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
<<<<<<< HEAD
      className={cn("text-destructive text-sm", className)}
=======
      className={cn("text-sm text-destructive", className)}
>>>>>>> shadcn/main
      {...props}
    >
      {body}
    </p>
  )
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
