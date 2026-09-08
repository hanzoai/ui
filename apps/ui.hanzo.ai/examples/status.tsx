import { SizableText, XStack, YStack } from '@hanzo/gui'
import { Status } from '@hanzo/ui'

/** Variants — success, warning, error, info and gray, each with a matching dot. */
export function Variants() {
  return (
    <XStack flexWrap="wrap" gap="$3" items="center">
      <Status>Default</Status>
      <Status variant="success">Operational</Status>
      <Status variant="warning">Degraded</Status>
      <Status variant="error">Down</Status>
      <Status variant="info">Scheduled</Status>
      <Status variant="gray">Paused</Status>
    </XStack>
  )
}

/** Without a dot — the dot is optional for a plain label. */
export function NoDot() {
  return (
    <XStack gap="$3">
      <Status dot={false}>Draft</Status>
      <Status variant="success" dot={false}>
        Published
      </Status>
    </XStack>
  )
}

/** In a list — one status per row, naming each service's state at a glance. */
export function ServiceList() {
  const services = [
    { name: 'API', variant: 'success' as const, label: 'Operational' },
    { name: 'Queue', variant: 'warning' as const, label: 'Degraded' },
    { name: 'Search', variant: 'error' as const, label: 'Down' },
  ]

  return (
    <YStack gap="$2">
      {services.map((service) => (
        <XStack key={service.name} justify="space-between" width={220}>
          <SizableText size="$2">{service.name}</SizableText>
          <Status variant={service.variant}>{service.label}</Status>
        </XStack>
      ))}
    </YStack>
  )
}
