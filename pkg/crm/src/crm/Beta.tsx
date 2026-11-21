'use client'

/**
 * Who is in the beta and who asked: every waitlist record of the brand with the
 * betas it asked for and holds, from the cloud's one join of the waitlist and the
 * grants (GET /v1/admin/marketing/beta). A SuperAdmin's read; the person opens on
 * their record, where the team writes to them.
 */
import { useEffect, useState } from 'react'
import { Button, Text, XStack, YStack } from '@hanzo/gui'
import { BackendStateCard, classifyBackend, type BackendState } from '@hanzo/ui/product'

import { CrmApi, time, type BetaMember } from '../lib/crm'
import { useRouter, useSession } from '../lib/host'

const day = (s: string): string => (time(s) ? new Date(time(s) * 1000).toLocaleDateString() : '')

export function Beta() {
  const { account } = useSession()
  const router = useRouter()
  const [members, setMembers] = useState<BetaMember[] | null>(null)
  const [error, setError] = useState<BackendState | null>(null)
  const allowed = account?.superAdmin === true

  useEffect(() => {
    if (!allowed) return
    let live = true
    CrmApi.marketing
      .betaMembers()
      .then((m) => live && setMembers([...m].sort((a, b) => time(b.applied) - time(a.applied))))
      .catch((e) => live && setError(classifyBackend(e)))
    return () => {
      live = false
    }
  }, [allowed])

  if (!allowed) {
    return (
      <Text fontSize="$3" color="$color10">
        The beta signups are a SuperAdmin's to read.
      </Text>
    )
  }
  if (error) return <BackendStateCard state={error} hint="endpoint · GET /v1/admin/marketing/beta" />
  if (!members) {
    return (
      <Text fontSize="$2" color="$color10">
        Reading the beta signups…
      </Text>
    )
  }
  const enabled = members.filter((m) => m.betas.some((b) => b.enabled)).length
  return (
    <YStack gap="$2" data-slot="crm-beta">
      <Text fontSize="$2" color="$color10">
        {`${members.length} signed up, ${enabled} with a beta enabled.`}
      </Text>
      {members.map((m) => (
        <XStack key={m.user} gap="$3" py="$2" borderTopWidth={1} borderColor="$borderColor" flexWrap="wrap" items="flex-start" data-slot="beta-member">
          <YStack flex={1} minW={220}>
            <Button size="$2" chromeless px={0} justify="flex-start" onPress={() => router.push(`/crm/people/${m.person}`)}>
              {m.email || m.user}
            </Button>
            <Text fontSize="$1" color="$color10">
              {[m.program, day(m.applied)].filter(Boolean).join(' · ')}
            </Text>
          </YStack>
          <YStack flex={1.4} minW={220} gap="$1">
            {m.betas.length === 0 ? (
              <Text fontSize="$2" color="$color10">
                No beta asked for.
              </Text>
            ) : (
              m.betas.map((b) => (
                <Text key={b.id} fontSize="$2" color={b.enabled ? '$color12' : '$color11'} data-slot="beta-seat" data-enabled={b.enabled}>
                  {`${b.name} · ${b.enabled ? 'enabled' : 'asked'}${b.requested ? ` ${day(b.requested)}` : ''}`}
                </Text>
              ))
            )}
          </YStack>
        </XStack>
      ))}
    </YStack>
  )
}
