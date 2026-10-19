'use client'

/**
 * The field controls of the record kit — Field, Textarea, Select, Picker,
 * Checkbox, Radio, ChoiceCard, Switch, SearchInput and Stepper — in every look,
 * size and state that carries its own style, regular and compact. Part of the
 * one gallery (records.tsx renders it).
 */
import { useState } from 'react'
import { Plus } from '@hanzogui/lucide-icons-2'
import { Section } from './section'
import { Density } from '../backends/gui/density'
import { Button } from '../backends/gui/button'
import { Input } from '../backends/gui/input'
import { Textarea } from '../backends/gui/textarea'
import { Checkbox } from '../backends/gui/checkbox'
import { RadioGroup, RadioGroupItem } from '../backends/gui/radio-group'
import { ChoiceCard, ChoiceGroup } from '../backends/gui/choice'
import { Switch } from '../backends/gui/switch'
import { Stepper } from '../backends/gui/stepper'
import {
  Picker,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../backends/gui/select'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '../backends/gui/field'
import { SearchInput } from '../product/Filters'

const NOOP = () => {}

/** Every record checkbox look, unchecked / checked / indeterminate / disabled / disabled-checked. */
const LOOKS = [
  { variant: 'solid' },
  { variant: 'outline' },
  { variant: 'soft' },
  { variant: 'solid', size: 'md' },
  { variant: 'solid', shape: 'round' },
  { variant: 'solid', color: 'success' },
  { variant: 'solid', color: 'warning' },
  { variant: 'solid', hoverable: false },
] as const

const STATES = [
  { checked: false },
  { checked: true },
  { checked: 'indeterminate' },
  { checked: false, disabled: true },
  { checked: true, disabled: true },
] as const

function Fields() {
  return (
    <>
      <Field>
        <FieldLabel htmlFor="g-name">Name</FieldLabel>
        <Input id="g-name" placeholder="Ada Lovelace" />
        <FieldDescription>Shown on the record.</FieldDescription>
      </Field>
      <Field invalid>
        <FieldLabel htmlFor="g-mail">Email</FieldLabel>
        <Textarea id="g-mail" placeholder="ada@" />
        <FieldError>Enter a valid address.</FieldError>
      </Field>
      <Field invalid={false}>
        <FieldLabel htmlFor="g-ok">Domain</FieldLabel>
        <Input id="g-ok" placeholder="ada.dev" />
        <FieldError>Hidden: the field says it is valid.</FieldError>
      </Field>
    </>
  )
}

export function FieldsGallery() {
  const [n, setN] = useState(2)
  const [q, setQ] = useState('')
  return (
    <>
      <Section name="field-record">
        <Fields />
        <FieldSet>
          <FieldLegend>Profile</FieldLegend>
          <FieldLegend variant="label">Notifications</FieldLegend>
        </FieldSet>
        <FieldError errors={[{ message: 'Too short.' }, { message: 'Must include a number.' }]} />
      </Section>
      <Density value="compact">
        <Section name="field-compact">
          <Fields />
        </Section>
      </Density>

      <Section name="textarea-record">
        <Textarea size="sm" placeholder="sm" />
        <Textarea size="xs" placeholder="xs" />
        <Textarea size="sm" maxRows={4} placeholder="maxRows 4" defaultValue={'one\ntwo\nthree\nfour\nfive\nsix'} />
        <Textarea size="sm" aria-invalid placeholder="Invalid" />
      </Section>
      <Density value="compact">
        <Section name="textarea-compact">
          <Textarea placeholder="Compact" />
        </Section>
      </Density>

      <Section name="select-record">
        <Select>
          <SelectTrigger size="sm">
            <SelectValue placeholder="sm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">A</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger size="xs">
            <SelectValue placeholder="xs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">A</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger size="sm" aria-invalid>
            <SelectValue placeholder="Invalid" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">A</SelectItem>
          </SelectContent>
        </Select>
        <Picker size="sm" aria-label="Picker sm" defaultValue="a">
          <option value="a">Picker sm</option>
        </Picker>
        <Picker size="xs" aria-label="Picker xs" defaultValue="a">
          <option value="a">Picker xs</option>
        </Picker>
      </Section>
      <Density value="compact">
        <Section name="select-compact">
          <Select open>
            <SelectTrigger>
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Stages</SelectLabel>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="won">Won</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Picker aria-label="Compact picker" defaultValue="a">
            <option value="a">Compact picker</option>
          </Picker>
        </Section>
      </Density>

      <Section name="checkbox-record">
        {LOOKS.map((look, i) =>
          STATES.map((state, j) => <Checkbox key={`${i}-${j}`} aria-label={`look ${i} state ${j}`} {...look} {...state} />),
        )}
      </Section>
      <Density value="compact">
        <Section name="checkbox-compact">
          <Checkbox aria-label="compact" />
          <Checkbox aria-label="compact checked" checked />
        </Section>
      </Density>

      <Section name="radio-record">
        <RadioGroup defaultValue="b">
          <RadioGroupItem size="sm" value="a" aria-label="sm a" />
          <RadioGroupItem size="sm" value="b" aria-label="sm b" />
          <RadioGroupItem size="sm" value="c" aria-label="sm c" disabled />
        </RadioGroup>
        <RadioGroup defaultValue="a" orientation="horizontal">
          <RadioGroupItem size="md" value="a" aria-label="md a" />
          <RadioGroupItem size="md" value="b" aria-label="md b" />
        </RadioGroup>
        <ChoiceGroup label="Visibility">
          <ChoiceCard indicator selected onSelect={NOOP}>
            Everything
          </ChoiceCard>
          <ChoiceCard indicator selected={false} onSelect={NOOP}>
            Subject only
          </ChoiceCard>
        </ChoiceGroup>
      </Section>
      <Density value="compact">
        <Section name="radio-compact">
          <RadioGroup defaultValue="a">
            <RadioGroupItem value="a" aria-label="compact a" />
            <RadioGroupItem value="b" aria-label="compact b" />
          </RadioGroup>
          <ChoiceGroup label="Open records in">
            <ChoiceCard indicator selected onSelect={NOOP}>
              Side panel
            </ChoiceCard>
            <ChoiceCard indicator selected={false} onSelect={NOOP}>
              Record page
            </ChoiceCard>
          </ChoiceGroup>
        </Section>
      </Density>

      <Section name="switch-record">
        {(['md', 'sm'] as const).map((size) => (
          <Switch key={size} size={size} aria-label={size} />
        ))}
        {(['md', 'sm'] as const).map((size) => (
          <Switch key={`${size}-on`} size={size} checked aria-label={`${size} on`} />
        ))}
        <Switch size="sm" disabled aria-label="sm disabled" />
      </Section>
      <Density value="compact">
        <Section name="switch-compact">
          <Switch aria-label="compact" />
          <Switch checked aria-label="compact on" />
        </Section>
      </Density>

      <Section name="search-record">
        <SearchInput value={q} onChange={setQ} placeholder="Search objects" />
        <SearchInput
          value={q}
          onChange={setQ}
          size="sm"
          placeholder="Search fields"
          actions={
            <Button size="sm" variant="outline" startIcon={<Plus />}>
              Add field
            </Button>
          }
        />
      </Section>
      <Density value="compact">
        <Section name="search-compact">
          <SearchInput value={q} onChange={setQ} placeholder="Search members" />
        </Section>
      </Density>

      <Section name="stepper-record">
        <Stepper label="Decimals" value={n} onChange={setN} min={0} max={100} editable />
        <Stepper label="Maximum values" value={1} onChange={NOOP} min={1} readOnly editable />
      </Section>
      <Density value="compact">
        <Section name="stepper-compact">
          <Stepper label="Decimals" value={n} onChange={setN} min={0} max={100} />
          <Stepper label="Amount" value={12500.5} onChange={NOOP} step={0.5} decimals={2} />
        </Section>
      </Density>
    </>
  )
}
