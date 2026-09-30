import { useEffect, useState, type ReactNode } from 'react'
import { Button, Text, XStack, YStack } from '@hanzo/gui'
import { EmptyPanel, Panel, PanelSpinner } from '../overview/primitives'
import { RANGES, type Point, type Range } from './source'

/** What a load is: loading, its value, or why there is none. */
export type Load<T> = { state: 'loading' } | { state: 'ok'; value: T } | { state: 'error'; error: string }

/** Run `read` whenever `deps` change, and answer its Load. */
export function useLoad<T>(read: () => Promise<T>, deps: unknown[]): Load<T> {
  const [load, setLoad] = useState<Load<T>>({ state: 'loading' })
  useEffect(() => {
    let live = true
    setLoad({ state: 'loading' })
    read()
      .then((value) => live && setLoad({ state: 'ok', value }))
      .catch((err: unknown) => live && setLoad({ state: 'error', error: err instanceof Error ? err.message : String(err) }))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return load
}

/** The range switch every view carries. */
export function RangeSwitch({ range, onRange }: { range: Range; onRange: (r: Range) => void }) {
  return (
    <XStack gap="$1" role="tablist" aria-label="Range">
      {RANGES.map((r) => (
        <Button
          key={r}
          size="$2"
          role="tab"
          aria-selected={r === range}
          theme={r === range ? 'accent' : undefined}
          chromeless={r !== range}
          onPress={() => onRange(r)}
        >
          {r}
        </Button>
      ))}
    </XStack>
  )
}

/** A panel whose body is a Load: spinner, error note, or the rendered value. */
export function Loaded<T>({ title, load, empty, children, right, minW = 300 }: {
  title: string
  load: Load<T>
  empty?: (value: T) => boolean
  children: (value: T) => ReactNode
  right?: ReactNode
  minW?: number
}) {
  return (
    <Panel title={title} right={right} minW={minW} flex={1}>
      {load.state === 'loading' ? (
        <PanelSpinner />
      ) : load.state === 'error' ? (
        <EmptyPanel note={load.error} />
      ) : empty?.(load.value) ? (
        <EmptyPanel note="Nothing in this range yet." />
      ) : (
        children(load.value)
      )}
    </Panel>
  )
}

/** A ranked list: label, a bar proportional to the leader, and the count. */
export function TopList({ rows, format = (x) => x || '(none)' }: { rows: Point[]; format?: (x: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.y))
  return (
    <YStack gap="$2">
      {rows.map((r) => (
        <XStack key={r.x} gap="$3" items="center">
          <YStack flex={1} minW={0} position="relative" height={24} justify="center">
            <YStack position="absolute" l={0} t={0} b={0} width={`${Math.max(2, (r.y / max) * 100)}%`} bg="$color3" rounded="$2" />
            <Text px="$2" fontSize="$2" color="$color12" numberOfLines={1}>
              {format(r.x)}
            </Text>
          </YStack>
          <Text width={56} fontSize="$2" color="$color12" fontWeight="600" text="right">
            {r.y.toLocaleString()}
          </Text>
        </XStack>
      ))}
    </YStack>
  )
}
