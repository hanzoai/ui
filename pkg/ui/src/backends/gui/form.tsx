'use client'

/**
 * Form — the five pieces that connect react-hook-form to a rendered field.
 *
 *   <Form {...form}>
 *     <FormField name="email" control={form.control} render={({ field }) => (
 *       <FormItem>
 *         <FormLabel>Email</FormLabel>
 *         <FormControl><Input {...field} /></FormControl>
 *         <FormMessage />
 *       </FormItem>
 *     )} />
 *   </Form>
 *
 * What they buy is the ACCESSIBILITY wiring, which is the part hand-written
 * forms get wrong: the control is described by its message, the message has an
 * id to be described BY, `aria-invalid` follows the field's error state, and a
 * message renders only when there is one to render. Each is one id agreeing in
 * three places, and each is a place for the three to drift apart.
 *
 * react-hook-form is an OPTIONAL peer, like `next`. This subpath is the only
 * thing here that reaches for it, so an app with no forms never installs it.
 */
import * as React from 'react'
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

import { Box } from '../../box'
import { cn } from '../../core/cn'
import { Label } from './label'

/** The provider. Spread a `useForm()` result straight into it. */
export const Form = FormProvider

type FieldContext = { name: string }
const Field = /* @__PURE__ */ React.createContext<FieldContext>({} as FieldContext)

type ItemContext = { id: string }
const Item = /* @__PURE__ */ React.createContext<ItemContext>({} as ItemContext)

/**
 * One field's worth of state, plus the three ids the pieces below agree on.
 *
 * The ids are derived from ONE `useId`, so the control, its description and its
 * message cannot disagree about what they are pointing at.
 */
export function useFormField() {
  const field = React.useContext(Field)
  const item = React.useContext(Item)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: field.name })
  const state = getFieldState(field.name, formState)

  if (!field.name) {
    throw new Error('useFormField must be used inside a <FormField>')
  }

  return {
    name: field.name,
    formItemId: `${item.id}-item`,
    formDescriptionId: `${item.id}-description`,
    formMessageId: `${item.id}-message`,
    ...state,
  }
}

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => (
  <Field.Provider value={{ name: props.name }}>
    <Controller {...props} />
  </Field.Provider>
)

export const FormItem = ({ className, ...props }: React.ComponentProps<typeof Box>) => {
  const id = React.useId()
  return (
    <Item.Provider value={{ id }}>
      {/* A field is a small stack — label, control, message — so it is a grid
          with one column, floored at 0 so a long message wraps. */}
      <Box className={cn('grid grid-cols-1 gap-2', className)} {...props} />
    </Item.Provider>
  )
}

export const FormLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof Label>) => {
  const { error, formItemId } = useFormField()
  return (
    <Label
      data-error={!!error}
      className={cn(error && 'text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

/**
 * Wires the control it wraps to its own ids without rendering anything.
 *
 * `asChild` on Slot would be the shadcn shape; this clones instead, because
 * gui's Slot participates in its own styled context and a bare input is not one
 * of its children.
 */
export const FormControl = ({ children }: { children: React.ReactElement }) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  return React.cloneElement(children, {
    id: formItemId,
    'aria-describedby': error
      ? `${formDescriptionId} ${formMessageId}`
      : formDescriptionId,
    'aria-invalid': !!error,
  } as Record<string, unknown>)
}

export const FormDescription = ({ className, ...props }: React.ComponentProps<typeof Box>) => {
  const { formDescriptionId } = useFormField()
  return (
    <Box
      tag="p"
      id={formDescriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

/**
 * The field's error, or nothing.
 *
 * Rendering an empty element when there is no error would reserve space that
 * then jumps when a message arrives, and would leave an `aria-describedby`
 * pointing at a node with no text in it.
 */
export const FormMessage = ({ className, children, ...props }: React.ComponentProps<typeof Box>) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? '') : children
  if (!body) return null
  return (
    <Box
      tag="p"
      id={formMessageId}
      className={cn('text-sm text-destructive', className)}
      {...props}
    >
      {body}
    </Box>
  )
}
