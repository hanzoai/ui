"use client"

/**
 * Select — the compound picker on @hanzogui/select.
 *
 * gui's `Select.Item` needs a positional `index`. Call sites should not have to
 * count, so `SelectContent` walks its subtree once per render and stamps
 * sequential indices on every `SelectItem` it finds — including items nested in a
 * `SelectGroup`. An item is written `<SelectItem value="x">Label</SelectItem>`
 * and the numbering always matches render order.
 *
 * `Picker` is the other select: the platform's own, for a list the platform
 * should show — every country, on a phone.
 *
 * Rows are concentric in the panel: a 4px inset inside an 8px panel takes a 4px
 * row radius (`$xs`). Under `<Density value="compact">` the list takes the
 * record density twenty-ui's Select draws (MIT, NOTICE): 13px rows in the quiet
 * ink on the hover rung, and the density crosses the portal with the list.
 */
import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  type ComponentProps,
  type ReactNode,
} from "react"
import {
  Select as GuiSelect,
  SelectSeparator as GuiSelectSeparator,
  Text,
  XStack,
  type TextProps,
} from "@hanzo/gui"
import { Check, ChevronDown, ChevronUp } from "@hanzogui/lucide-icons-2"

import { BOX, EDGE, FIELD, FILL, type FieldSize } from "./control"
import { Density, fieldSize, useDensity } from "./density"
import { invalidOf, useField } from "./field"
import { touch } from "./gesture"
import { ink } from "./ink"
import { slot } from "./slot"

const ROW_H = 32

/**
 * Disabling the control is one fact with two spellings: gui puts `disabled` on
 * the Trigger, the compound API puts it on the root. The root declares it and
 * the trigger honours it, so a call site can say either and mean the same thing.
 */
const Disabled = /* @__PURE__ */ createContext(false)

export type SelectProps = ComponentProps<typeof GuiSelect> & {
  disabled?: boolean
}

/**
 * The root's own signature, then the compound statics gui hangs off it. Written
 * out because the inferred type of an `Object.assign` cannot be named in a
 * declaration file, and this package emits one.
 */
type SelectRoot = ((props: SelectProps) => ReactNode) & typeof GuiSelect

const Select: SelectRoot = /* @__PURE__ */ Object.assign(
  ({ disabled = false, ...props }: SelectProps) => (
    <Disabled.Provider value={disabled}>
      <GuiSelect {...props} />
    </Disabled.Provider>
  ),
  GuiSelect
) as SelectRoot
const SelectGroup: typeof GuiSelect.Group = GuiSelect.Group

/**
 * The trigger's rung, handed to the value it shows. `ink()` sizes a string
 * child; `SelectValue` is an element and drew gui's own 14px whatever the box,
 * so a 32px compact trigger showed its value a rung larger than the Input
 * beside it. The trigger provides its box's rung and the value reads it.
 */
const TriggerFont = /* @__PURE__ */ createContext<"$2" | "$3">("$3")

export type SelectValueProps = ComponentProps<typeof GuiSelect.Value>

const SelectValue = (props: SelectValueProps) => (
  <GuiSelect.Value fontSize={useContext(TriggerFont)} {...props} />
)

export type SelectTriggerProps = Omit<ComponentProps<typeof GuiSelect.Trigger>, "size"> & {
  /** The box, as `Input`'s (control.ts `BOX`). Unset, the nearest `<Density>` decides. */
  size?: FieldSize
}
export type SelectContentProps = ComponentProps<typeof GuiSelect.Content>
export type SelectItemProps = Omit<
  ComponentProps<typeof GuiSelect.Item>,
  "index"
> & {
  index?: number
}
export type SelectLabelProps = ComponentProps<typeof GuiSelect.Label>
export type SelectSeparatorProps = ComponentProps<typeof GuiSelectSeparator>
export type SelectScrollButtonProps = ComponentProps<
  typeof GuiSelect.ScrollUpButton
>

const SelectTrigger = ({
  children,
  disabled,
  size,
  ...props
}: SelectTriggerProps) => {
  const inherited = useContext(Disabled)
  const density = useDensity()
  const box = BOX[fieldSize(size, density)]
  const invalid = invalidOf((props as { "aria-invalid"?: unknown })["aria-invalid"], useField())
  return (
    <GuiSelect.Trigger
      {...slot("select-trigger")}
      unstyled
      disabled={disabled ?? inherited}
      {...FIELD}
      {...(density === "compact" ? { bg: "$panel" } : null)}
      {...(invalid ? { borderColor: "$red7", "aria-invalid": true } : null)}
      px={box.gutter}
      items="center"
      justify="space-between"
      gap="$2"
      // A FLOOR, not a pin. `height` alone clips a child taller than the box, and
      // the build stays green while it does — that is why 01ac46dce moved Button
      // off a pinned height. Select and Input kept theirs, so the same trap was
      // still armed in the two controls that sit in every form.
      height="auto"
      minHeight={box.h}
      // The trigger states its own vertical padding because otherwise something
      // else states it. `unstyled` does not survive gui's ListItem (it is
      // destructured into a local and never reaches the frame), so the frame
      // styles itself at `size: '$true'` and writes `paddingVertical: $3.5` — and
      // under `height: auto` that padding, not the floor, is what decides the box:
      // 14 + a 20px line + 14 + 2px of border rendered a 50px Select beside a 36px
      // Input. At 0 the floor decides again and `items="center"` does the
      // centring, which is exactly how the Input already behaves.
      py={0}
      cursor="pointer"
      {...touch(box.h, 44, "y")}
      {...props}
    >
      {/* The box's rung, as Input's. A Select and an Input are the same control
        — one height, 8px radius, 1px edge — and they sit side by side in every
        form; rendering one at 14px and the other at 13px was the single most
        visible inconsistency the package shipped. Both read `box.font`. */}
      <TriggerFont.Provider value={box.font}>{ink(children, undefined, { size: box.font })}</TriggerFont.Provider>
      <GuiSelect.Icon>
        <ChevronDown size={16} opacity={0.5} />
      </GuiSelect.Icon>
    </GuiSelect.Trigger>
  )
}

const SelectItem = ({ children, value, ...props }: SelectItemProps) => {
  const compact = useDensity() === "compact"
  return (
    <GuiSelect.Item
      value={value}
      {...slot("select-item")}
      unstyled
      index={props.index ?? 0}
      items="center"
      // Start-aligned. gui's ListItem centres its row on the main axis, which set
      // every option's label in the middle of the list with the tick on the far edge.
      justify="flex-start"
      gap="$2"
      minH={ROW_H}
      pl={compact ? "$1" : "$2"}
      pr="$7"
      // Concentric: the panel is 8, its inset 4, so a row is 4.
      rounded="$xs"
      cursor="pointer"
      {...touch(ROW_H, 44, "y")}
      hoverStyle={{ bg: compact ? "$hover" : "$raised" }}
      focusStyle={{ bg: compact ? "$hover" : "$raised" }}
      {...props}
    >
      <GuiSelect.ItemText {...(compact ? { fontSize: "$2", color: "$aside" } : null)}>{children}</GuiSelect.ItemText>
      <XStack
        position="absolute"
        r="$2"
        items="center"
        justify="center"
        pointerEvents="none"
      >
        <GuiSelect.ItemIndicator>
          <Check size={16} strokeWidth={2} />
        </GuiSelect.ItemIndicator>
      </XStack>
    </GuiSelect.Item>
  )
}

/** Depth-first stamp of `index` onto every `SelectItem` in render order. */
const stampIndices = (children: ReactNode, next: () => number): ReactNode =>
  Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    if (child.type === SelectItem)
      return cloneElement(child, { index: next() } as never)
    const kids = (child.props as { children?: ReactNode }).children
    return kids === undefined
      ? child
      : cloneElement(child, undefined, stampIndices(kids, next))
  })

const SelectScrollUpButton = (props: SelectScrollButtonProps) => (
  <GuiSelect.ScrollUpButton
    {...slot("select-scroll-up-button")}
    items="center"
    justify="center"
    py="$1"
    {...props}
  >
    <ChevronUp size={16} />
  </GuiSelect.ScrollUpButton>
)

const SelectScrollDownButton = (props: SelectScrollButtonProps) => (
  <GuiSelect.ScrollDownButton
    {...slot("select-scroll-down-button")}
    items="center"
    justify="center"
    py="$1"
    {...props}
  >
    <ChevronDown size={16} />
  </GuiSelect.ScrollDownButton>
)

const SelectContent = ({ children, ...props }: SelectContentProps) => {
  let n = 0
  // Read on the trigger's side of the portal and re-provided inside it: a
  // context does not cross gui's portal, a provider placed in the portalled
  // children does.
  const density = useDensity()
  return (
    <GuiSelect.Content {...slot("select-content")} {...props}>
      <Density value={density}>
        <SelectScrollUpButton />
        <GuiSelect.Viewport
          minW={128}
          p="$1"
          bg="$panel"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$3"
        >
          {stampIndices(children, () => n++)}
        </GuiSelect.Viewport>
        <SelectScrollDownButton />
      </Density>
    </GuiSelect.Content>
  )
}

const SelectLabel = (props: SelectLabelProps) => (
  <GuiSelect.Label
    {...slot("select-label")}
    px="$2"
    py="$1.5"
    fontSize="$1"
    fontWeight="500"
    color="$quiet"
    {...props}
  />
)

const SelectSeparator = (props: SelectSeparatorProps) => (
  <GuiSelectSeparator
    {...slot("select-separator")}
    my="$1"
    borderColor="$borderColor"
    {...props}
  />
)

/** The select's own inset: Chromium pads a select's text 4px inside its box. */
const INSET = 4

/** The select's own attributes, which reach the `<select>`; its `<option>`s are its children. */
type Native = Pick<
  ComponentProps<"select">,
  "id" | "name" | "value" | "defaultValue" | "onChange" | "required" | "disabled" | "autoComplete" | "children"
>

export type PickerProps = Omit<TextProps, "render" | "size" | keyof Native> &
  Native & {
    /** The box, as `Input`'s (control.ts `BOX`), so the two sit level in one row. */
    size?: FieldSize
    /** On the raised ground instead of a bare edge (control.ts `FILL`). */
    fill?: boolean
  }

/**
 * Picker — the platform's own select, wearing the field.
 *
 * `Select` draws its list itself; a picker hands the list to the platform,
 * which is what a long one wants on a phone. It is the `Input` beside it,
 * measured: the same box per size, its text 14px on a 20px line held in the
 * middle by the riser rather than left to the UA, the same gutter less the
 * select's own 4px, and the Input theme's ink, edge and two edge states (`EDGE`)
 * — a native control gui does not draw, so it names what gui's Input carries.
 */
const Picker = /* @__PURE__ */ forwardRef<HTMLSelectElement, PickerProps>(function Picker(
  { id, name, value, defaultValue, onChange, required, disabled, autoComplete, children, size, fill = false, ...props },
  ref,
) {
  const density = useDensity()
  const resolved = fieldSize(size, density)
  const box = BOX[resolved]
  const dense = resolved === "sm" || resolved === "xs"
  return (
    <Text
      ref={ref as never}
      render={
        <select
          id={id}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
        />
      }
      {...slot("picker")}
      componentName="Input"
      {...FIELD}
      {...EDGE}
      {...(density === "compact" ? { bg: "$panel" } : null)}
      {...(fill ? FILL : null)}
      display="block"
      // A floor, as the trigger's: the riser and the line make the box, and a
      // larger font grows it rather than clipping the chosen option.
      minH={box.h}
      width="100%"
      minW={0}
      pl={box.gutter - INSET}
      pr={box.gutter - INSET}
      // Chromium ignores line-height on a <select> and sets its text on
      // `normal` (19px at 13px Zen), so the record sizes cannot be built from a
      // riser and a line the way the regular one is: 7 + 19 + 7 + 2 came out 35
      // in a 32px box. They take no vertical padding and let the floor decide;
      // the menulist centres its own text.
      py={dense ? 0 : box.riser}
      color="$color"
      fontFamily="$body"
      fontSize={box.font}
      lineHeight={dense ? 16 : "$3"}
      cursor="pointer"
      {...props}
    >
      {children}
    </Text>
  )
})

export {
  Picker,
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
