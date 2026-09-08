'use client'

/**
 * Field — the parts a form composes a labeled control from.
 *
 * `FieldSet`/`FieldLegend` group related fields inside a real `<fieldset>` so
 * keyboard and screen-reader users get the grouping for free. `FieldGroup`
 * stacks `Field`s with one rhythm. `Field` is the per-control wrapper —
 * `role="group"`, an `orientation` (vertical / horizontal / responsive), and a
 * `data-invalid` switch that turns the whole block destructive-colored so a
 * sighted user and a screen reader see the same boundary. `FieldContent` keeps
 * a label and its description together when the label sits beside the control.
 * `FieldLabel` also doubles as a selectable "choice card" when its only child
 * is a `Field` — border, radius and padding appear around it.
 * `FieldTitle`/`FieldDescription`/`FieldError` are the text leaves;
 * `FieldSeparator` divides a `FieldGroup`.
 *
 * `responsive` is mobile-first like `vertical` already is: a column below
 * `$md`, a row from `$md` up — this config's media props are min-width (see
 * the compiled `@media (min-width: …)` any `$md` prop emits), so there are no
 * container queries to reach for and none are needed: the same direction every
 * other responsive prop in this codebase is written in.
 */
import { SizableText, XStack, YStack, createStyledContext, styled } from '@hanzo/gui'
import { isValidElement, type ComponentProps, type ReactNode } from 'react'
import { Box } from '../../box'
import { Label } from './label'
import { Separator } from './layout'
import { ink } from './ink'
import { slot } from './slot'

export type FieldOrientation = 'vertical' | 'horizontal' | 'responsive'
export type FieldLegendVariant = 'legend' | 'label'

function FieldSet({ children, ...props }: ComponentProps<'fieldset'>) {
  return (
    <Box tag="fieldset" className="flex flex-col gap-6" {...slot('field-set')} {...props}>
      {children}
    </Box>
  )
}

export type FieldSetProps = ComponentProps<typeof FieldSet>

function FieldLegend({ variant = 'legend', children, ...props }: ComponentProps<'legend'> & {
  variant?: FieldLegendVariant
}) {
  return (
    <Box
      tag="legend"
      className={variant === 'label' ? 'mb-3 text-sm font-medium' : 'mb-3 text-base font-medium'}
      {...slot('field-legend')}
      data-variant={variant}
      {...props}
    >
      {children}
    </Box>
  )
}

export type FieldLegendProps = ComponentProps<typeof FieldLegend>

const FieldGroup = styled(YStack, {
  name: 'FieldGroup',
  width: '100%',
  gap: '$7',
})

export type FieldGroupProps = ComponentProps<typeof FieldGroup>

const FieldContext = /* @__PURE__ */ createStyledContext<{ orientation: FieldOrientation }>({
  orientation: 'vertical',
})

const FieldFrame = styled(XStack, {
  name: 'Field',
  context: FieldContext,
  width: '100%',
  gap: '$3',

  variants: {
    orientation: {
      vertical: { flexDirection: 'column' },
      horizontal: { flexDirection: 'row', items: 'center' },
      // Mobile-first, the way `vertical` already is: a column below `$md`,
      // a row from `$md` up — this config's media props are min-width, so the
      // base case is the narrow one and `$md` is where it widens.
      responsive: {
        flexDirection: 'column',
        $md: { flexDirection: 'row', items: 'center' },
      },
    },
    invalid: {
      true: { color: '$red9' },
    },
  } as const,

  defaultVariants: { orientation: 'vertical' },
})

export type FieldProps = Omit<ComponentProps<typeof FieldFrame>, 'orientation'> & {
  orientation?: FieldOrientation
  'data-invalid'?: boolean
}

function Field({ orientation = 'vertical', ...props }: FieldProps) {
  const invalid = props['data-invalid']
  return (
    <FieldFrame
      role="group"
      {...slot('field')}
      data-orientation={orientation}
      orientation={orientation}
      invalid={invalid}
      {...props}
    />
  )
}

const FieldContent = styled(YStack, {
  name: 'FieldContent',
  flex: 1,
  gap: '$1.5',
})

export type FieldContentProps = ComponentProps<typeof FieldContent>

/** A `Field` nested directly inside a `FieldLabel` reads as a choice card. */
const isFieldChild = (children: ReactNode) => isValidElement(children) && children.type === Field

function FieldLabel({ className, children, ...props }: ComponentProps<typeof Label>) {
  const card = isFieldChild(children)
  return (
    <Label
      {...slot('field-label')}
      gap="$2"
      {...(card
        ? {
            width: '100%' as const,
            flexDirection: 'column' as const,
            rounded: '$3',
            borderWidth: 1,
            borderColor: '$borderColor',
            p: '$4',
          }
        : { self: 'flex-start' as const })}
      className={className}
      {...props}
    >
      {children}
    </Label>
  )
}

export type FieldLabelProps = ComponentProps<typeof FieldLabel>

function FieldTitle({ children, ...props }: ComponentProps<typeof XStack>) {
  return (
    <XStack {...slot('field-label')} self="flex-start" items="center" gap="$2" {...props}>
      {ink(children, SizableText, { fontSize: '$2', fontWeight: '500' })}
    </XStack>
  )
}

export type FieldTitleProps = ComponentProps<typeof FieldTitle>

function FieldDescription({ children, ...props }: ComponentProps<typeof SizableText>) {
  return (
    <SizableText {...slot('field-description')} fontSize="$2" fontWeight="400" color="$quiet" {...props}>
      {children}
    </SizableText>
  )
}

export type FieldDescriptionProps = ComponentProps<typeof FieldDescription>

function FieldSeparator({ children, ...props }: ComponentProps<typeof XStack> & {
  children?: ReactNode
}) {
  return (
    <XStack {...slot('field-separator')} data-content={!!children} items="center" gap="$2" {...props}>
      <Separator flex={1} />
      {children && (
        <SizableText {...slot('field-separator-content')} color="$quiet" fontSize="$2">
          {children}
        </SizableText>
      )}
      {children && <Separator flex={1} />}
    </XStack>
  )
}

export type FieldSeparatorProps = ComponentProps<typeof FieldSeparator>

export type FieldErrorIssue = { message?: string }

function fieldErrorContent(
  children: ReactNode,
  errors: Array<FieldErrorIssue | undefined> | undefined,
  issues: Array<FieldErrorIssue | undefined> | undefined,
) {
  if (children) return children
  const list = errors ?? issues
  if (!list) return null
  const messages = list.filter((e): e is FieldErrorIssue => !!e?.message)
  if (messages.length === 0) return null
  if (messages.length === 1) return messages[0].message
  return (
    // `ink()` below only colors a plain-string message: a list is already an
    // element, so it carries its own red9/text-sm rather than inheriting from
    // the alert frame. `listStyleType` is inline because `base.css` zeroes
    // `list-style` on every `ul` — a class cannot outrank that, an inline style does.
    <Box
      tag="ul"
      className="ml-4 flex flex-col gap-1"
      style={{ listStyleType: 'disc' }}
      {...slot('field-error-list')}
    >
      {messages.map((error, index) => (
        <Box key={index} tag="li" className="text-sm text-red9">
          {error.message}
        </Box>
      ))}
    </Box>
  )
}

export type FieldErrorProps = ComponentProps<typeof XStack> & {
  errors?: Array<FieldErrorIssue | undefined>
  /** Issues from any [Standard Schema](https://standardschema.dev/) validator. */
  issues?: Array<FieldErrorIssue | undefined>
}

function FieldError({ children, errors, issues, ...props }: FieldErrorProps) {
  const content = fieldErrorContent(children, errors, issues)
  if (!content) return null
  return (
    <XStack role="alert" {...slot('field-error')} {...props}>
      {ink(content, SizableText, { fontSize: '$2', fontWeight: '400', color: '$red9' })}
    </XStack>
  )
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
}
