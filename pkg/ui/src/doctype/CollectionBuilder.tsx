'use client'

/**
 * CollectionBuilder — the content-type builder: define a collection's NAME and its
 * typed FIELDS on-page (add / remove / reorder / require / show-in-list), then
 * create it as a framework DocType. Every framework fieldtype is offered (Text,
 * Rich text, Long text, Number, Decimal, Currency, Checkbox, Date, Date & time,
 * Select, Relation, Attachment, Table, JSON), with the extra inputs each type needs
 * (Select options, Relation target). Pure decisions live in `builder-logic.ts`.
 *
 * Used for BOTH "New collection" (create) and, on an existing collection, editing
 * its schema — the SAME builder over `client.doctypes.create/update`.
 *
 * MOBILE FIRST: a field row is a name input, a type picker, two switches and three
 * buttons. Side by side that is ~560px of controls, which on a phone either
 * overflows or crushes each control below the tap floor. So a row STACKS into
 * labelled bands on a phone (name · type · flags · move/remove) and collapses back
 * to one line on a wide box. The type picker is the shared `SelectMenu` (the ONE
 * menu system, tokenised, native-safe) rather than a hand-styled `<select>` —
 * which is also how the last hardcoded hex left this layer.
 */
import { useCallback, useMemo, useState } from 'react'
import { Button, Card, Input, Text, XStack, YStack } from '@hanzo/gui'
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2, TriangleAlert } from '@hanzogui/lucide-icons-2'

import { FieldSwitch } from '../product/Field'
import { SelectMenu } from '../product/SelectMenu'
import { classifyBackend } from '../product/BackendState'
import type { FrameworkClient } from './client'
import type { DocType, Fieldtype } from './types'
import {
  BUILDER_FIELD_TYPES,
  blankField,
  fieldNameFromLabel,
  fieldNeedsOptions,
  fieldsFromDocType,
  moveField,
  starterFields,
  toDocType,
  validateBuilder,
  type BuilderField,
} from './builder-logic'
import { Action, Actions, ErrorBar } from './parts'
import { useContainerLayout, TAP } from './responsive'

const TYPE_OPTIONS = BUILDER_FIELD_TYPES.map((t) => ({ key: t.type, label: t.label }))

export interface CollectionBuilderProps {
  client: FrameworkClient
  module: string
  /** Editing an existing collection's schema (name locked), else creating a new one. */
  existing?: DocType
  /** Called with the saved collection's name after create/update. */
  onSaved: (name: string) => void
  onCancel: () => void
}

export function CollectionBuilder({ client, module, existing, onSaved, onCancel }: CollectionBuilderProps) {
  const editing = Boolean(existing)
  const [name, setName] = useState(existing?.name ?? '')
  const [fields, setFields] = useState<BuilderField[]>(() =>
    existing ? fieldsFromDocType(existing) : starterFields(),
  )
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const { phone, onLayout } = useContainerLayout()

  const validation = useMemo(() => validateBuilder(name, fields), [name, fields])

  const patch = useCallback((key: string, next: Partial<BuilderField>) => {
    setFields((fs) => fs.map((f) => (f.key === key ? { ...f, ...next } : f)))
  }, [])
  const addField = useCallback(() => setFields((fs) => [...fs, blankField()]), [])
  const removeField = useCallback((key: string) => setFields((fs) => fs.filter((f) => f.key !== key)), [])
  const move = useCallback((key: string, dir: -1 | 1) => setFields((fs) => moveField(fs, key, dir)), [])

  const save = useCallback(async () => {
    setShowErrors(true)
    if (!validation.ok) return
    setBusy(true)
    setSaveError(null)
    try {
      const dt = toDocType(name, module, fields)
      if (editing) await client.doctypes.update(name, dt)
      else await client.doctypes.create(dt)
      onSaved(name)
    } catch (e) {
      setSaveError(classifyBackend(e).message)
    } finally {
      setBusy(false)
    }
  }, [client, editing, fields, module, name, onSaved, validation.ok])

  const iconBtn = (icon: React.ReactElement, label: string, onPress: () => void, disabled?: boolean, danger?: boolean) => (
    <Button
      size={phone ? '$3' : '$1'}
      circular
      minW={phone ? TAP : undefined}
      minH={phone ? TAP : undefined}
      aria-label={label}
      icon={icon}
      disabled={disabled}
      onPress={onPress}
      {...(danger ? { theme: 'red' as const } : {})}
    />
  )

  return (
    <Card onLayout={onLayout} borderWidth={1} borderColor="$borderColor" p={phone ? '$3' : '$4'} gap="$4" maxW={820} width="100%">
      <YStack gap="$2">
        <Text fontSize="$5" fontWeight="800">
          {editing ? `Edit ${name}` : 'New collection'}
        </Text>
        <Text fontSize="$2" color="$color10">
          A content type on the Hanzo Framework — name it and define its fields. Every field type is available; a
          rich-text field gives a full WYSIWYG body.
        </Text>
      </YStack>

      {/* Name — label above the input, so it never competes for the row. */}
      <YStack gap="$1.5" width="100%">
        <Text fontSize="$1" color="$color11" textTransform="uppercase" letterSpacing={0.4}>
          Collection
        </Text>
        <Input
          width="100%"
          minH={phone ? TAP : undefined}
          size={phone ? '$4' : '$3'}
          placeholder="e.g. Recipe or LandingPage"
          value={name}
          onChangeText={setName}
          disabled={busy || editing}
          autoCapitalize="none"
        />
        {editing ? (
          <Text fontSize="$1" color="$color9">
            A collection’s name is its identity and can’t change.
          </Text>
        ) : null}
      </YStack>

      {/* Fields */}
      <YStack gap="$2" width="100%">
        <XStack items="center" justify="space-between">
          <Text fontSize="$3" fontWeight="700" color="$color11">
            Fields
          </Text>
          <Text fontSize="$1" color="$color9">
            {fields.length} field{fields.length === 1 ? '' : 's'}
          </Text>
        </XStack>

        <YStack gap="$2" width="100%">
          {fields.map((f, i) => {
            const err = showErrors ? validation.fieldErrors[f.key] : undefined
            const fname = f.label.trim() ? fieldNameFromLabel(f.label) : ''
            return (
              <YStack
                key={f.key}
                borderWidth={1}
                borderColor={err ? '$red7' : '$borderColor'}
                rounded="$4"
                p="$3"
                gap="$2"
                bg="$color1"
                width="100%"
              >
                {/* Row 1 — the field's name. Full width on a phone. */}
                <XStack gap="$2" items="center" width="100%">
                  {phone ? null : <GripVertical size={15} opacity={0.5} />}
                  <Input
                    flex={1}
                    minW={0}
                    minH={phone ? TAP : undefined}
                    size={phone ? '$4' : '$3'}
                    placeholder="Field name (e.g. Title)"
                    value={f.label}
                    onChangeText={(v: string) => patch(f.key, { label: v })}
                    disabled={busy}
                    autoCapitalize="none"
                  />
                  {phone ? null : (
                    <YStack minW={150}>
                      <SelectMenu
                        required
                        ariaLabel="Field type"
                        options={TYPE_OPTIONS}
                        value={f.type}
                        onChange={(v) => v && patch(f.key, { type: v as Fieldtype })}
                        disabled={busy}
                        minWidth={150}
                      />
                    </YStack>
                  )}
                </XStack>

                {/* Row 2 (phone) — the type picker gets its own full-width row. */}
                {phone ? (
                  <YStack width="100%">
                    <SelectMenu
                      required
                      ariaLabel="Field type"
                      options={TYPE_OPTIONS}
                      value={f.type}
                      onChange={(v) => v && patch(f.key, { type: v as Fieldtype })}
                      disabled={busy}
                      minWidth={0}
                      minHeight={TAP}
                    />
                  </YStack>
                ) : null}

                {/* Row 3 — flags + move/remove. Wraps; never clips the delete button. */}
                <XStack gap="$4" items="center" justify="space-between" flexWrap="wrap" width="100%">
                  <XStack gap="$4" items="center">
                    <XStack gap="$2" items="center" minH={phone ? TAP : undefined}>
                      <FieldSwitch checked={f.required} onChange={(v) => patch(f.key, { required: v })} disabled={busy} />
                      <Text fontSize="$2" color="$color10">
                        Required
                      </Text>
                    </XStack>
                    <XStack gap="$2" items="center" minH={phone ? TAP : undefined}>
                      <FieldSwitch checked={f.inListView} onChange={(v) => patch(f.key, { inListView: v })} disabled={busy} />
                      <Text fontSize="$2" color="$color10">
                        In list
                      </Text>
                    </XStack>
                  </XStack>
                  <XStack gap="$2">
                    {iconBtn(<ArrowUp size={14} />, 'Move field up', () => move(f.key, -1), busy || i === 0)}
                    {iconBtn(<ArrowDown size={14} />, 'Move field down', () => move(f.key, 1), busy || i === fields.length - 1)}
                    {iconBtn(<Trash2 size={14} />, 'Remove field', () => removeField(f.key), busy, true)}
                  </XStack>
                </XStack>

                {/* Per-type extra input: Select options / Relation target. */}
                {fieldNeedsOptions(f.type) ? (
                  <YStack gap="$1.5" width="100%">
                    <Text fontSize="$1" color="$color10" textTransform="uppercase" letterSpacing={0.4}>
                      {f.type === 'Select' ? 'Options' : f.type === 'Link' ? 'Relates to' : 'Child type'}
                    </Text>
                    <Input
                      width="100%"
                      minH={phone ? TAP : undefined}
                      size={phone ? '$4' : '$2'}
                      placeholder={
                        f.type === 'Select' ? 'One per line — Draft / Published' : 'Collection name (e.g. Author)'
                      }
                      value={f.options}
                      onChangeText={(v: string) => patch(f.key, { options: v })}
                      multiline={f.type === 'Select'}
                      numberOfLines={f.type === 'Select' ? 3 : 1}
                      disabled={busy}
                      autoCapitalize="none"
                    />
                  </YStack>
                ) : null}

                <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
                  {fname ? (
                    <Text fontSize="$1" color="$color8">
                      field: {fname}
                    </Text>
                  ) : (
                    <YStack />
                  )}
                  {err ? (
                    <XStack gap="$1" items="center">
                      <TriangleAlert size={12} />
                      <Text fontSize="$1" color="$red11">
                        {err}
                      </Text>
                    </XStack>
                  ) : null}
                </XStack>
              </YStack>
            )
          })}
        </YStack>

        <XStack width={phone ? '100%' : undefined}>
          <Action phone={phone} icon={<Plus size={14} />} onPress={addField} disabled={busy}>
            Add field
          </Action>
        </XStack>
      </YStack>

      {showErrors && validation.formError ? <ErrorBar message={validation.formError} /> : null}
      {saveError ? <ErrorBar message={saveError} /> : null}

      <Actions phone={phone}>
        <Action phone={phone} disabled={busy} onPress={onCancel}>
          Cancel
        </Action>
        <Action phone={phone} primary disabled={busy} onPress={save}>
          {busy ? 'Saving…' : editing ? 'Save collection' : 'Create collection'}
        </Action>
      </Actions>
    </Card>
  )
}
