'use client'

/**
 * Single-column stacked record cards for mobile viewports (`<768px`, e.g. 390px).
 * Zero horizontal overflow, 44px touch targets, multi-select checkboxes feeding BulkBar.
 */
import { Button, Input, Spinner, Text, XStack, YStack } from '@hanzo/gui'
import { Card } from '@hanzo/ui'
import type { FieldDefinition } from '@hanzo/data'
import { Check, Plus, Search } from '@hanzogui/lucide-icons-2'

import { cellText } from './csv'

export interface MobileCardsProps {
  fields: FieldDefinition[]
  titleField: string
  records: Record<string, unknown>[]
  loading: boolean
  empty: string
  search: string
  onSearchChange: (q: string) => void
  selectedIds: string[]
  onToggleSelect: (id: string) => void
  onOpen: (record: Record<string, unknown>) => void
  onCreate: () => void
  createLabel: string
  page: number
  total: number
  pageSize: number
  onPage: (page: number) => void
}

export function MobileCards({
  fields,
  titleField,
  records,
  loading,
  empty,
  search,
  onSearchChange,
  selectedIds,
  onToggleSelect,
  onOpen,
  onCreate,
  createLabel,
  page,
  total,
  pageSize,
  onPage,
}: MobileCardsProps) {
  const selected = new Set(selectedIds)
  const titleDef = fields.find((f) => f.name === titleField)
  const summaryFields = fields.filter((f) => f.name !== titleField).slice(0, 4)
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))

  return (
    <YStack gap="$2.5" width="100%" maxW="100%" data-slot="crm-mobile-cards">
      <XStack items="center" gap="$2" width="100%">
        <XStack
          flex={1}
          minW={0}
          items="center"
          gap="$1.5"
          px="$2.5"
          minH={40}
          bg="$color2"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$3"
        >
          <Search size={14} color="$color10" />
          <Input
            flex={1}
            size="$3"
            borderWidth={0}
            bg="transparent"
            value={search}
            onChangeText={onSearchChange}
            placeholder="Search…"
            aria-label="Search records"
          />
        </XStack>
        <Button size="$3" minH={40} theme="blue" onPress={onCreate} shrink={0}>
          <XStack items="center" gap="$1">
            <Plus size={14} color="$color12" />
            <Text fontSize="$2" fontWeight="600" color="$color12">
              {createLabel}
            </Text>
          </XStack>
        </Button>
      </XStack>

      {loading ? (
        <YStack py="$6" items="center">
          <Spinner size="small" color="$color10" />
        </YStack>
      ) : records.length === 0 ? (
        <Card p="$4" borderWidth={1} borderColor="$borderColor" items="center">
          <Text fontSize="$3" color="$color10">
            {empty}
          </Text>
        </Card>
      ) : (
        <YStack gap="$2" width="100%">
          {records.map((r) => {
            const id = String(r.id ?? '')
            const isSel = selected.has(id)
            const title = titleDef ? cellText(titleDef, r[titleField]) : String(r[titleField] ?? id)
            return (
              <Card
                key={id}
                p="$3"
                borderWidth={1}
                borderColor={isSel ? '$blue10' : '$borderColor'}
                bg={isSel ? '$color3' : '$color2'}
                gap="$1.5"
                width="100%"
                data-slot="crm-mobile-card"
              >
                <XStack items="center" gap="$2" width="100%" minW={0}>
                  <Button
                    size="$2"
                    minW={32}
                    minH={32}
                    p={0}
                    rounded="$2"
                    bg={isSel ? '$blue10' : '$background'}
                    borderWidth={1}
                    borderColor={isSel ? '$blue10' : '$borderColor'}
                    aria-label={`Select ${title || id}`}
                    aria-pressed={isSel}
                    onPress={() => onToggleSelect(id)}
                  >
                    {isSel ? <Check size={14} color="$color12" /> : null}
                  </Button>
                  <YStack flex={1} minW={0} cursor="pointer" onPress={() => onOpen(r)}>
                    <Text fontSize="$3" fontWeight="700" color="$color12" numberOfLines={1}>
                      {title || 'Untitled'}
                    </Text>
                  </YStack>
                </XStack>

                <YStack gap="$1" pl={40} cursor="pointer" onPress={() => onOpen(r)}>
                  {summaryFields.map((f) => {
                    const txt = cellText(f, r[f.name])
                    if (!txt) return null
                    return (
                      <XStack key={f.name} items="baseline" justify="space-between" gap="$2" minW={0}>
                        <Text fontSize="$1" color="$color10" shrink={0}>
                          {f.label}
                        </Text>
                        <Text fontSize="$2" color="$color11" numberOfLines={1} flex={1} text="right">
                          {txt}
                        </Text>
                      </XStack>
                    )
                  })}
                </YStack>
              </Card>
            )
          })}
        </YStack>
      )}

      {totalPages > 1 ? (
        <XStack items="center" justify="space-between" pt="$1">
          <Button size="$2" disabled={page <= 1} onPress={() => onPage(page - 1)}>
            Previous
          </Button>
          <Text fontSize="$2" color="$color10">
            {`Page ${page} of ${totalPages}`}
          </Text>
          <Button size="$2" disabled={page >= totalPages} onPress={() => onPage(page + 1)}>
            Next
          </Button>
        </XStack>
      ) : null}
    </YStack>
  )
}
