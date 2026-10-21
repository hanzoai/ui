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
 *
 * Under `<Density value="compact">` the text leaves take the record density
 * the source kit's Field draws (MIT, NOTICE): a 12px semibold label in the light ink
 * 4px above its control, a 12px light description and a 12px error, the block's
 * gap 4. Regular density draws exactly what it always did.
 *
 * `invalid` on the root is the one statement of the field's validity: it marks
 * the block (`data-invalid`), and `useField()` hands it to the control inside —
 * Textarea and SelectTrigger read it as their error edge — and to `FieldError`,
 * which a field that says `invalid={false}` keeps hidden.
 */
import { SizableText, XStack, YStack, createStyledContext, styled } from '@hanzo/gui'
import { createContext, isValidElement, useContext, type ComponentProps, type ReactNode } from 'react'
import { Label } from './label'
import { Separator } from './layout'
import { ink } from './ink'
import { slot } from './slot'
import { useDensity } from './density'

/** What a control inside a `Field` reads: whether the field is invalid, when it says. */
const FieldState = /* @__PURE__ */ createContext<{ invalid?: boolean }>({})

/** The nearest `Field`'s stated validity — `undefined` outside one, or where it states none. */
export const useField = () => useContext(FieldState)

/**
 * `aria-invalid` as the DOM reads it, or the enclosing field's: anything but
 * absent or the string "false" on the control, else what the Field states.
 */
export const invalidOf = (aria: unknown, field: { invalid?: boolean }) =>
  aria != null ? aria !== false && aria !== 'false' : !!field.invalid

export type FieldOrientation = 'vertical' | 'horizontal' | 'responsive'
export type FieldLegendVariant = 'legend' | 'label'

/**
 * The gui values the old `flex flex-col gap-6` read as through `tw`, stated
 * directly — the same frame `Box` drew (display flex, a 24px column gap, the
 * div's `auto` minimums and its shrink), now through style props rather than a
 * utility string. `field.test.tsx` holds the two renders equal.
 */
function FieldSet({ children, ...props }: ComponentProps<'fieldset'>) {
  return (
    <YStack
      render="fieldset"
      display="flex"
      flexDirection="column"
      gap={24}
      minH="auto"
      minW="auto"
      shrink={1}
      {...slot('field-set')}
      {...(props as object)}
    >
      {children}
    </YStack>
  )
}

export type FieldSetProps = ComponentProps<typeof FieldSet>

/**
 * `mb-3 text-sm|text-base font-medium`, as what it compiled to: a block frame
 * with a 12px margin under it, and the text on design's sm (13) or base (14)
 * rung at the medium weight. The text rides as a plain style, as `Box` carried
 * it: a frame drops a text property, and a legend's text is its children's to
 * inherit. Line-height `normal` is what the utility resolved to
 * (`--text-*--line-height` is not a token anyone ships).
 */
function FieldLegend({ variant = 'legend', children, style, ...props }: ComponentProps<'legend'> & {
  variant?: FieldLegendVariant
}) {
  const rung = variant === 'label' ? 'sm' : 'base'
  return (
    <YStack
      render="legend"
      display="block"
      mb={12}
      minH="auto"
      minW="auto"
      shrink={1}
      {...slot('field-legend')}
      data-variant={variant}
      {...(props as object)}
      style={{
        fontSize: `var(--text-${rung})`,
        lineHeight: `var(--text-${rung}--line-height, normal)`,
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </YStack>
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

export type FieldProps = Omit<ComponentProps<typeof FieldFrame>, 'orientation' | 'invalid'> & {
  orientation?: FieldOrientation
  /**
   * The field's validity, stated once: the block is marked, the control inside
   * draws its error edge, and `FieldError` shows (or, `false`, stays hidden).
   */
  invalid?: boolean
  'data-invalid'?: boolean
}

function Field({ orientation = 'vertical', invalid: stated, ...props }: FieldProps) {
  const invalid = stated ?? props['data-invalid']
  const compact = useDensity() === 'compact'
  return (
    <FieldState.Provider value={{ invalid: stated ?? props['data-invalid'] }}>
      <FieldFrame
        role="group"
        {...slot('field')}
        data-orientation={orientation}
        orientation={orientation}
        {...(stated !== undefined ? { 'data-invalid': stated } : null)}
        invalid={invalid}
        // The record density's rhythm: the label 4px above its control.
        {...(compact ? { gap: '$1' } : null)}
        {...props}
      />
    </FieldState.Provider>
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

/** The record density's caption: 12px semibold in the light ink. */
const CAPTION = { fontSize: '$1', fontWeight: '600', color: '$hint', lineHeight: '$1' } as const

function FieldLabel({ className, children, ...props }: ComponentProps<typeof Label>) {
  const card = isFieldChild(children)
  const compact = useDensity() === 'compact'
  return (
    <Label
      {...slot('field-label')}
      {...(compact && !card ? CAPTION : null)}
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
  const compact = useDensity() === 'compact'
  return (
    <XStack {...slot('field-label')} self="flex-start" items="center" gap="$2" {...props}>
      {ink(children, SizableText, compact ? CAPTION : { fontSize: '$2', fontWeight: '500' })}
    </XStack>
  )
}

export type FieldTitleProps = ComponentProps<typeof FieldTitle>

function FieldDescription({ children, ...props }: ComponentProps<typeof SizableText>) {
  const compact = useDensity() === 'compact'
  return (
    <SizableText
      {...slot('field-description')}
      fontSize={compact ? '$1' : '$2'}
      fontWeight="400"
      color={compact ? '$hint' : '$quiet'}
      {...props}
    >
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
    // The `ml-4 flex flex-col gap-1` and `text-sm text-red9` this used to spell
    // as utility strings, as the props they compiled to.
    <YStack
      render="ul"
      ml={16}
      display="flex"
      flexDirection="column"
      gap={4}
      minH="auto"
      minW="auto"
      shrink={1}
      style={{ listStyleType: 'disc' }}
      {...slot('field-error-list')}
    >
      {messages.map((error, index) => (
        <YStack
          key={index}
          render="li"
          display="block"
          minH="auto"
          minW="auto"
          shrink={1}
          style={{
            display: 'list-item',
            fontSize: 'var(--text-sm)',
            lineHeight: 'var(--text-sm--line-height, normal)',
            color: 'var(--red9)',
          }}
        >
          {error.message}
        </YStack>
      ))}
    </YStack>
  )
}

export type FieldErrorProps = ComponentProps<typeof XStack> & {
  errors?: Array<FieldErrorIssue | undefined>
  /** Issues from any [Standard Schema](https://standardschema.dev/) validator. */
  issues?: Array<FieldErrorIssue | undefined>
}

function FieldError({ children, errors, issues, ...props }: FieldErrorProps) {
  const field = useField()
  const compact = useDensity() === 'compact'
  const content = fieldErrorContent(children, errors, issues)
  // A field that states it is valid shows no error, whatever is passed in.
  if (!content || field.invalid === false) return null
  return (
    <XStack role="alert" {...slot('field-error')} {...props}>
      {ink(
        content,
        SizableText,
        compact
          ? { fontSize: '$1', fontWeight: '400', color: '$bad' }
          : { fontSize: '$2', fontWeight: '400', color: '$red9' },
      )}
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
