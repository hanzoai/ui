'use client'

/**
 * ProviderReadinessList — each network's LIVE publish-readiness: ready, or the
 * exact OAuth-app credentials this deployment still needs. Honest by construction
 * (it can only render what the server reported) so a connect flow never fabricates
 * a "connected". Extracted from Hanzo Social (social.hanzo.ai).
 */
import { Text, XStack, YStack } from '@hanzo/gui'
import { AlertTriangle, CheckCircle2 } from '@hanzogui/lucide-icons-2'
import { useI18n } from '@hanzo/i18n/react'
import type { ProviderCapability } from './api'

export function ProviderReadinessList({ providers }: { providers: ProviderCapability[] }) {
  const { t } = useI18n()
  return (
    <YStack gap="$2">
      <Text fontSize="$2" color="$soft">
        {t('Network publish-readiness')}
      </Text>
      {providers.map((p) => (
        <XStack key={p.provider} items="center" justify="space-between" gap="$3" py="$1">
          <XStack items="center" gap="$2">
            {p.credentialsConfigured ? (
              <CheckCircle2 size={14} color="var(--green10)" />
            ) : (
              <AlertTriangle size={14} color="var(--yellow10)" />
            )}
            <Text fontSize="$2">{p.provider}</Text>
          </XStack>
          <Text fontSize="$1" color="$soft">
            {p.credentialsConfigured ? t('Ready') : t('needs {credentials}', { credentials: p.missingCredentials.join(', ') })}
          </Text>
        </XStack>
      ))}
    </YStack>
  )
}
