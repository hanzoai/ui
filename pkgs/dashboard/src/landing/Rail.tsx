'use client'

/**
 * Rail — the right rail of a product landing (Documentation, Quick Start, Examples,
 * Code samples, API Reference, Quick Actions, Support). Every row is a REAL link
 * (docs derived from `config.docsUrl`) or an in-console action — no dead rows.
 * "Code samples" scrolls to the interactive block; Community/Support are opt-in
 * (`config.discordUrl` / `config.supportEmail`), never a hardcoded brand link.
 */
import { YStack } from '@hanzo/gui'
import { BookOpen, Boxes, Code2, LifeBuoy, MessageSquare, Rocket, Zap } from '@hanzogui/lucide-icons-2'

import { ActionRow, LandingCard, openExternal } from './parts'
import { apexFromDocs, standardResources } from './logic'
import type { LandingAction, LandingConfig } from './types'

const runAction = (a: LandingAction) => (a.href ? openExternal(a.href) : a.onPress?.())

export function Rail({ config, onViewCode }: { config: LandingConfig; onViewCode?: () => void }) {
  const docs = config.docsUrl
  const std = standardResources(docs, config.docsProduct)
  const apex = apexFromDocs(docs)
  const supportAddr = config.supportEmail ?? `support@${apex}`
  const support = `mailto:${supportAddr}`

  return (
    <YStack gap="$4" flex={1} minW={280}>
      <LandingCard title="Resources" p="$3">
        <YStack gap="$0.5">
          <ActionRow icon={<BookOpen size={15} />} label="Documentation" sub="Guides & concepts" onPress={() => openExternal(std.docs)} />
          <ActionRow icon={<Rocket size={15} />} label="Quick Start" sub="Ship in minutes" onPress={() => openExternal(std.quickstart)} />
          <ActionRow icon={<Boxes size={15} />} label="Examples" sub="Sample projects" onPress={() => openExternal(std.examples)} />
          {onViewCode ? <ActionRow icon={<Code2 size={15} />} label="Code samples" sub="Copy a real API call" onPress={onViewCode} /> : null}
          <ActionRow icon={<Zap size={15} />} label="API Reference" sub={`api.${apex}`} onPress={() => openExternal(std.api)} />
          {config.resources?.map((r) => (
            <ActionRow key={r.id} icon={r.icon} label={r.label} sub={r.sub} onPress={() => (r.href ? openExternal(r.href) : r.onPress?.())} />
          ))}
        </YStack>
      </LandingCard>

      {config.actions?.length ? (
        <LandingCard title="Quick Actions" p="$3">
          <YStack gap="$0.5">
            {config.actions.map((a) => (
              <ActionRow key={a.label} icon={a.icon} label={a.label} onPress={() => runAction(a)} />
            ))}
          </YStack>
        </LandingCard>
      ) : null}

      <LandingCard title="Need help?" p="$3">
        <YStack gap="$0.5">
          {config.discordUrl ? (
            <ActionRow icon={<MessageSquare size={15} />} label="Community" sub="Join the chat" onPress={() => openExternal(config.discordUrl as string)} />
          ) : null}
          <ActionRow icon={<LifeBuoy size={15} />} label="Contact Support" sub={supportAddr} onPress={() => openExternal(support)} />
        </YStack>
      </LandingCard>
    </YStack>
  )
}
