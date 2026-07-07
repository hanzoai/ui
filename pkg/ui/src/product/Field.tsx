'use client'

/**
 * Form field primitives — labeled rows over Hanzo GUI inputs.
 *
 * One way to render a labeled control. Every editor field goes through these, so
 * spacing, disabled styling, and the label column stay consistent. Style props
 * use the v5 shorthand set (p/px/items/justify/...).
 */
import type { ReactNode } from 'react'
import {
  Input,
  Label,
  Select,
  Switch,
  TextArea,
  Slider,
  Text,
  XStack,
  YStack,
} from '@hanzo/gui'
import { ChevronDown } from '@hanzogui/lucide-icons-2'

/** Labeled row: fixed label column + flexing control. */
export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <XStack gap="$3" items="flex-start" flexWrap="wrap">
      <Label width={180} pt="$2" color="$color11" fontSize="$3">
        {label}
      </Label>
      <YStack flex={1} minW={240}>
        {children}
      </YStack>
    </XStack>
  )
}

export function FieldText({
  value,
  onChange,
  disabled,
  secure,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  secure?: boolean
  placeholder?: string
}) {
  return (
    <Input
      value={value}
      onChangeText={onChange}
      disabled={disabled}
      secureTextEntry={secure}
      placeholder={placeholder}
      autoCapitalize="none"
    />
  )
}

export function FieldTextArea({
  value,
  onChange,
  disabled,
  rows = 6,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  rows?: number
}) {
  return (
    <TextArea value={value} onChangeText={onChange} disabled={disabled} numberOfLines={rows} />
  )
}

export function FieldSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} size="$3">
      <Switch.Thumb />
    </Switch>
  )
}

export function FieldSelect({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <Select value={value} onValueChange={onChange} disablePreventBodyScroll native>
      <Select.Trigger disabled={disabled} iconAfter={<ChevronDown size={16} />}>
        <Select.Value placeholder="Select…" />
      </Select.Trigger>
      <Select.Content>
        <Select.Viewport>
          {options.map((opt, i) => (
            <Select.Item key={opt} index={i} value={opt}>
              <Select.ItemText>{opt}</Select.ItemText>
            </Select.Item>
          ))}
        </Select.Viewport>
      </Select.Content>
    </Select>
  )
}

export function FieldSlider({
  value,
  min,
  max,
  step,
  onChange,
  disabled,
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <XStack gap="$3" items="center">
      <Text width={56} fontSize="$3" color="$color11">
        {value}
      </Text>
      <Slider
        flex={1}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? min)}
        disabled={disabled}
      >
        <Slider.Track>
          <Slider.TrackActive />
        </Slider.Track>
        <Slider.Thumb index={0} circular />
      </Slider>
    </XStack>
  )
}
