import { H1, H2, H3, Paragraph, Text, XStack, YStack } from '@hanzo/gui'
import { Head } from 'one'
import { useMemo, type ComponentType } from 'react'

import type { Doc } from '~/catalog'
import { Frame, type Heading } from './docs'

/** One module: its examples rendered beside their source, its types quoted, its exports named. */
export function Module({ doc, examples }: { doc: Doc; examples: Record<string, ComponentType> }) {
  const headings = useMemo<Heading[]>(
    () => [
      ...doc.examples.map((x) => ({ id: x.name, title: x.title, level: 2 as const })),
      { id: 'types', title: 'Types', level: 2 },
      { id: 'exports', title: 'Exports', level: 3 },
    ],
    [doc],
  )
  return (
    <Frame sections={doc.sections} headings={headings}>
      <Head>
        <title>{`${doc.title} — ${doc.from}`}</title>
      </Head>
      <YStack gap="$2">
        <H1>{doc.title}</H1>
        <Paragraph fontFamily="$mono" fontSize={13} color="$color11">
          {`import { ${doc.members.filter((m) => !m.type).map((m) => m.name).join(', ')} } from '${doc.from}'`}
        </Paragraph>
      </YStack>

      {doc.examples.length === 0 ? (
        <Paragraph color="$color10">No examples yet.</Paragraph>
      ) : (
        doc.examples.map((x) => {
          const Example = examples[x.name]
          return (
            <YStack key={x.name} gap="$3">
              <YStack gap="$1">
                <H2 id={x.name} size="$6">
                  {x.title}
                </H2>
                {x.description ? <Paragraph color="$color11">{x.description}</Paragraph> : null}
              </YStack>
              <YStack p="$5" rounded="$4" borderWidth={1} borderColor="$borderColor" items="flex-start" gap="$3">
                {Example ? <Example /> : <Text color="$red10">example {x.name} is not exported</Text>}
              </YStack>
              <Code html={x.html} />
            </YStack>
          )
        })
      )}

      <YStack gap="$3">
        <H2 id="types" size="$6">
          Types
        </H2>
        {doc.types.length === 0 ? (
          <Paragraph color="$color10">This module declares no types of its own.</Paragraph>
        ) : (
          doc.types.map((html, i) => <Code key={i} html={html} />)
        )}
      </YStack>

      <YStack gap="$2">
        <H3 id="exports" size="$4">
          Exports
        </H3>
        <XStack flexWrap="wrap" gap="$2">
          {doc.members.map((m) => (
            <Text key={m.name} fontFamily="$mono" fontSize={12} px="$2" py={2} rounded="$2" bg="$color3" color={m.type ? '$color10' : '$color12'}>
              {m.type ? `type ${m.name}` : m.name}
            </Text>
          ))}
        </XStack>
      </YStack>
    </Frame>
  )
}

const Code = ({ html }: { html: string }) => <pre className="code" dangerouslySetInnerHTML={{ __html: html }} />
