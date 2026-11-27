'use client'

/**
 * Twenty-style Settings → Data Model view.
 *
 * Lists all 13 CRM objects, inspects each object's fields, types, required flags,
 * select options, and relation targets, and lets org admins add custom fields via
 * `POST /v1/crm/schema/:object/fields` (with Base schema fallback).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Input, Spinner, Text, XStack, YStack } from '@hanzo/gui'
import { Card, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@hanzo/ui'
import { Database, Plus } from '@hanzogui/lucide-icons-2'

import {
  CrmApi,
  slugifyFieldName,
  validateCustomField,
  type CustomFieldType,
} from '../lib/crm'
import { baseFieldsOf, optionsOf, type BaseCollection, type BaseField } from '../lib/base-data/fields'
import { Picker } from './Actions'
import { useViewport } from './responsive'
import { TARGET, useAdmin, words } from './schema'
import { CRM_DATA_MODEL_OBJECTS, type DataModelObjectDef } from './twenty-logic'

export { CRM_DATA_MODEL_OBJECTS, type DataModelObjectDef }

const CUSTOM_FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'bool', label: 'Checkbox (Boolean)' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'select', label: 'Select' },
  { value: 'currency', label: 'Currency' },
  { value: 'editor', label: 'Rich Text' },
  { value: 'relation', label: 'Relation' },
]

export function DataModel() {
  const admin = useAdmin()
  const { mobile } = useViewport()
  const [selected, setSelected] = useState<string>(CRM_DATA_MODEL_OBJECTS[0].collection)
  const [collection, setCollection] = useState<BaseCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [round, setRound] = useState(0)

  const loadSchema = useCallback(() => {
    let live = true
    setLoading(true)
    setMissing(false)
    CrmApi.schema(selected, round > 0)
      .then((c) => live && setCollection(c))
      .catch(() => {
        if (!live) return
        setCollection(null)
        setMissing(true)
      })
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
  }, [selected, round])

  useEffect(() => loadSchema(), [loadSchema])

  const fields = useMemo<BaseField[]>(() => baseFieldsOf(collection), [collection])
  const existingNames = useMemo(() => new Set(fields.map((f) => f.name)), [fields])
  const currentDef = CRM_DATA_MODEL_OBJECTS.find((o) => o.collection === selected) ?? CRM_DATA_MODEL_OBJECTS[0]

  return (
    <YStack gap="$4" width="100%" maxW="100%" data-slot="crm-data-model">
      <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
        <YStack gap="$0.5">
          <Text fontSize="$7" fontWeight="700" color="$color12">
            Data Model
          </Text>
          <Text fontSize="$2" color="$color10">
            {`${CRM_DATA_MODEL_OBJECTS.length} CRM objects — inspect fields, types, and relations${admin ? ', or add custom fields' : ''}.`}
          </Text>
        </YStack>
        {admin ? (
          <Button size="$3" theme="blue" onPress={() => setAdding(true)} data-slot="crm-add-field-trigger">
            <XStack items="center" gap="$1.5">
              <Plus size={14} color="$color12" />
              <Text fontSize="$2" fontWeight="600" color="$color12">
                Add custom field
              </Text>
            </XStack>
          </Button>
        ) : null}
      </XStack>

      <XStack gap="$4" flexDirection={mobile ? 'column' : 'row'} items="flex-start" width="100%">
        <YStack
          width={mobile ? '100%' : 260}
          shrink={0}
          gap="$1.5"
          data-slot="crm-model-objects"
        >
          <Text fontSize="$1" fontWeight="700" color="$color10" px="$1">
            OBJECTS ({CRM_DATA_MODEL_OBJECTS.length})
          </Text>
          <YStack
            gap="$1"
            flexDirection={mobile ? 'row' : 'column'}
            overflow={mobile ? 'scroll' : 'visible'}
            pb={mobile ? '$1' : 0}
          >
            {CRM_DATA_MODEL_OBJECTS.map((obj) => {
              const active = obj.collection === selected
              return (
                <Button
                  key={obj.collection}
                  size="$3"
                  minH={40}
                  px="$3"
                  justify="flex-start"
                  shrink={0}
                  bg={active ? '$color4' : '$color2'}
                  borderWidth={1}
                  borderColor={active ? '$color8' : '$borderColor'}
                  onPress={() => setSelected(obj.collection)}
                  data-slot="crm-model-object"
                  data-collection={obj.collection}
                >
                  <XStack items="center" gap="$2">
                    <Database size={13} color={active ? '$blue10' : '$color10'} />
                    <Text fontSize="$2" fontWeight={active ? '700' : '500'} color={active ? '$color12' : '$color11'}>
                      {obj.label}
                    </Text>
                  </XStack>
                </Button>
              )
            })}
          </YStack>
        </YStack>

        <Card flex={1} width="100%" minW={0} p="$3.5" borderWidth={1} borderColor="$borderColor" gap="$3" data-slot="crm-model-detail">
          <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
            <YStack>
              <Text fontSize="$5" fontWeight="700" color="$color12">
                {currentDef.label}
              </Text>
              <Text fontSize="$2" color="$color10">
                {`${currentDef.description} · collection \`${currentDef.collection}\``}
              </Text>
            </YStack>
            <Text fontSize="$2" color="$color10" fontFamily="$mono">
              {`${fields.length} fields`}
            </Text>
          </XStack>

          {loading ? (
            <YStack py="$6" items="center">
              <Spinner size="small" color="$color10" />
            </YStack>
          ) : missing ? (
            <Text fontSize="$2" color="$color10">
              {`Collection "${selected}" is not provisioned in this org's Base yet.`}
            </Text>
          ) : (
            <YStack gap="$1.5">
              {fields.map((f) => {
                const relTarget = f.type === 'relation' ? (TARGET[f.name] ?? f.collectionId ?? 'relation') : ''
                const opts = f.type === 'select' ? optionsOf(f) : []
                return (
                  <XStack
                    key={f.name}
                    items="center"
                    justify="space-between"
                    gap="$2"
                    p="$2.5"
                    rounded="$2"
                    bg="$color2"
                    borderWidth={1}
                    borderColor="$borderColor"
                    flexWrap="wrap"
                    data-slot="crm-model-field"
                  >
                    <YStack flex={1} minW={160} gap="$0.5">
                      <XStack items="center" gap="$1.5" flexWrap="wrap">
                        <Text fontSize="$3" fontWeight="600" color="$color12">
                          {f.label || f.name}
                        </Text>
                        <Text fontSize="$1" color="$color9" fontFamily="$mono">
                          {f.name}
                        </Text>
                        {f.required ? (
                          <Text fontSize="$1" color="$red10" px="$1.5" py={1} bg="$color3" rounded="$2">
                            required
                          </Text>
                        ) : null}
                        {f.system ? (
                          <Text fontSize="$1" color="$color10" px="$1.5" py={1} bg="$color3" rounded="$2">
                            system
                          </Text>
                        ) : null}
                      </XStack>
                      {relTarget ? (
                        <Text fontSize="$1" color="$color10">
                          {`→ relates to ${relTarget}${(f.maxSelect ?? 1) > 1 ? ' (many)' : ''}`}
                        </Text>
                      ) : null}
                      {opts.length > 0 ? (
                        <Text fontSize="$1" color="$color10" numberOfLines={1}>
                          {`Options: ${opts.map((o) => o.label).join(', ')}`}
                        </Text>
                      ) : null}
                    </YStack>
                    <Text fontSize="$1" fontWeight="600" color="$blue10" px="$2" py={3} bg="$color3" rounded="$2" fontFamily="$mono">
                      {f.type}
                    </Text>
                  </XStack>
                )
              })}
            </YStack>
          )}
        </Card>
      </XStack>

      {adding ? (
        <AddFieldDialog
          collection={selected}
          objectLabel={currentDef.label}
          existingNames={existingNames}
          onClose={() => setAdding(false)}
          onAdded={() => {
            setAdding(false)
            setRound((r) => r + 1)
          }}
        />
      ) : null}
    </YStack>
  )
}

function AddFieldDialog({
  collection,
  objectLabel,
  existingNames,
  onClose,
  onAdded,
}: {
  collection: string
  objectLabel: string
  existingNames: ReadonlySet<string>
  onClose: () => void
  onAdded: () => void
}) {
  const [label, setLabel] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<CustomFieldType>('text')
  const [optionsText, setOptionsText] = useState('')
  const [targetCollection, setTargetCollection] = useState('companies')
  const [required, setRequired] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slugPreview = name.trim() ? slugifyFieldName(name) : slugifyFieldName(label)

  const submit = async () => {
    const input = {
      label,
      name: name.trim() || undefined,
      type,
      required,
      options: type === 'select' ? optionsText.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      targetCollection: type === 'relation' ? targetCollection : undefined,
    }
    const check = validateCustomField(input, existingNames)
    if (!check.valid) return setError(check.errors[0])

    setBusy(true)
    setError(null)
    try {
      await CrmApi.addField(collection, input, existingNames)
      onAdded()
    } catch (e) {
      setError(words(e, 'Could not add custom field.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Add custom field to ${objectLabel}`}</DialogTitle>
          <DialogDescription>
            Custom fields immediately appear in tables, cards, filters, and record detail pages.
          </DialogDescription>
        </DialogHeader>
        <DialogBody gap="$3">
          <YStack gap="$1">
            <Text fontSize="$2" color="$color10">
              Label
            </Text>
            <Input size="$3" value={label} onChangeText={setLabel} placeholder="e.g. Lead Score" aria-label="Field label" />
          </YStack>
          <YStack gap="$1">
            <Text fontSize="$2" color="$color10">
              {`API Name (${slugPreview || 'auto'})`}
            </Text>
            <Input size="$3" value={name} onChangeText={setName} placeholder={slugPreview || 'lead_score'} aria-label="Field API name" />
          </YStack>
          <Picker
            label="Field Type"
            value={type}
            onChange={(v) => setType(v as CustomFieldType)}
            options={CUSTOM_FIELD_TYPES}
          />
          {type === 'select' ? (
            <YStack gap="$1">
              <Text fontSize="$2" color="$color10">
                Options (comma separated)
              </Text>
              <Input size="$3" value={optionsText} onChangeText={setOptionsText} placeholder="Tier 1, Tier 2, Tier 3" />
            </YStack>
          ) : null}
          {type === 'relation' ? (
            <Picker
              label="Target Object"
              value={targetCollection}
              onChange={setTargetCollection}
              options={CRM_DATA_MODEL_OBJECTS.map((o) => ({ value: o.collection, label: o.label }))}
            />
          ) : null}
          <XStack items="center" gap="$2">
            <Button
              size="$2"
              bg={required ? '$color4' : '$color2'}
              borderWidth={1}
              borderColor={required ? '$blue10' : '$borderColor'}
              onPress={() => setRequired((r) => !r)}
            >
              {required ? 'Required: Yes' : 'Required: No'}
            </Button>
          </XStack>
          {error ? (
            <Text fontSize="$2" color="$red10" role="alert">
              {error}
            </Text>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button size="$3" chromeless disabled={busy} onPress={onClose}>
            Cancel
          </Button>
          <Button size="$3" theme="blue" disabled={busy} onPress={() => void submit()} data-slot="crm-add-field-submit">
            {busy ? 'Adding…' : 'Create field'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
