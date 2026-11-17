'use client'

/**
 * What crm.<brand> answers an account it does not open for. The CRM is a beta, and
 * whether an org has it is the server's: the `crm` enablement, which every CRM call
 * asks (cloud apps/framework elective) and which this face reads once to pick the
 * screen (`CrmApi.beta`). Neither card makes a CRM call.
 *
 *   - `BetaScreen` — the org has not joined the beta: join it on the brand's site,
 *     signed in, and the CRM opens here with no other step.
 *   - `NoRole` — this account's role in the org does not reach its CRM: the CRM's own
 *     reads refuse it, or cloud does not let it act in the org at all (a plain member
 *     of an org the platform runs, such as hanzo, acts in none of it).
 *     The account may still have the CRM in an org of its own, so the card opens the
 *     organization list, where one is chosen or created.
 */
import { Button, Text, XStack, YStack } from '@hanzo/gui'
import { Card } from '@hanzo/ui'

import { getBrand, leaveOrg, useSession } from '../lib/host'

/** The brand's beta application, opened on its beta tester program. */
export const betaUrl = (): string => `${getBrand().websiteUrl}/beta?program=beta`

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <YStack flex={1} minH="60vh" items="center" justify="center" p="$6">
      <Card p="$6" gap="$3" maxW={480} width="100%" borderWidth={1} borderColor="$borderColor" role="status">
        {children}
      </Card>
    </YStack>
  )
}

export function BetaScreen({ org, onCheck }: { org: string; onCheck: () => void }) {
  const name = getBrand().brandName.replace(/\s+Cloud$/, '')
  const { signOut } = useSession()
  return (
    <Frame>
      <Text fontSize="$7" fontWeight="700" color="$color12">
        {`${name} CRM is in beta`}
      </Text>
      <Text fontSize="$3" color="$color11">
        {`Join the beta to open it for ${org}. Apply while signed in to this account, and the CRM opens here as soon as you come back.`}
      </Text>
      <XStack gap="$2" flexWrap="wrap" pt="$2">
        <Button size="$3" theme="accent" onPress={() => window.location.assign(betaUrl())}>
          Join the beta
        </Button>
        <Button size="$3" chromeless onPress={onCheck}>
          I have joined
        </Button>
        <Button size="$3" chromeless onPress={() => void signOut()}>
          Sign out
        </Button>
      </XStack>
    </Frame>
  )
}

export function NoRole({ org }: { org: string }) {
  const name = getBrand().brandName.replace(/\s+Cloud$/, '')
  const { signOut } = useSession()
  return (
    <Frame>
      <Text fontSize="$7" fontWeight="700" color="$color12">
        {`${name} CRM`}
      </Text>
      <Text fontSize="$3" color="$color11">
        {`Your role in ${org} does not open its CRM. Ask an admin of ${org} for one, or open the CRM in an organization of your own.`}
      </Text>
      <XStack gap="$2" flexWrap="wrap" pt="$2">
        <Button size="$3" theme="accent" onPress={() => leaveOrg()}>
          Choose an organization
        </Button>
        <Button size="$3" chromeless onPress={() => void signOut()}>
          Sign out
        </Button>
      </XStack>
    </Frame>
  )
}
