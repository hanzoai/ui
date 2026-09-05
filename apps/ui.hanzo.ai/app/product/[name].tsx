import { H1, H2, H3, Paragraph, Text, XStack, YStack } from '@hanzo/gui'
import type { LoaderProps } from 'one'
import { Head, Link, useLoader } from 'one'
import type { ComponentType } from 'react'

export async function generateStaticParams() {
  const { productCatalog } = await import('~/catalog')
  return productCatalog().map((e) => ({ name: e.name }))
}

export async function loader({ params }: LoaderProps<{ name: string }>) {
  const { productCatalog, productExamples, productTypes } = await import('~/catalog')
  const { codeToHTML } = await import('@hanzogui/code-to-html')
  const all = productCatalog()
  const entry = all.find((e) => e.name === params.name)
  if (!entry) throw new Error(`no product module named ${params.name}`)
  return {
    ...entry,
    nav: all.map((e) => ({ name: e.name, title: e.title })),
    types: productTypes(entry.name).map((t) => codeToHTML(t, 'tsx')),
    examples: productExamples(entry.name).map((x) => ({ ...x, html: codeToHTML(x.source, 'tsx') })),
  }
}

// Every product example module, so the page for a module can render the
// functions its loader read the source of. Eager: the export is rendered on
// the server too.
const modules = import.meta.glob('../../examples/product/*.tsx', { eager: true }) as Record<
  string,
  Record<string, ComponentType>
>

/** One module of `@hanzo/ui/product`: its examples rendered, their source, and its types. */
export default function Page() {
  const doc = useLoader(loader)
  const mod = modules[`../../examples/product/${doc.name}.tsx`] ?? {}
  return (
    <XStack width="100%" maxW={1280} self="center">
      <Head>
        <title>{`${doc.title} — @hanzo/ui/product`}</title>
      </Head>
      <YStack
        width={220}
        py="$4"
        px="$3"
        gap={2}
        borderRightWidth={1}
        borderColor="$borderColor"
        display="none"
        $sm={{ display: 'flex' }}
      >
        {doc.nav.map((e) => (
          <Link key={e.name} href={`/product/${e.name}`} style={{ textDecorationLine: 'none' }}>
            <Text
              fontSize={13}
              px="$2"
              py={4}
              rounded="$2"
              color={e.name === doc.name ? '$color12' : '$color11'}
              bg={e.name === doc.name ? '$color4' : 'transparent'}
            >
              {e.title}
            </Text>
          </Link>
        ))}
      </YStack>
      <YStack flex={1} minW={0} px="$6" py="$6" gap="$6">
        <YStack gap="$2">
          <H1>{doc.title}</H1>
          <Paragraph fontFamily="$mono" fontSize={13} color="$color11">
            {`import { ${doc.members.filter((m) => !m.type).map((m) => m.name).join(', ')} } from '@hanzo/ui/product'`}
          </Paragraph>
        </YStack>

        {doc.examples.length === 0 ? (
          <Paragraph color="$color10">No examples yet.</Paragraph>
        ) : (
          doc.examples.map((x) => {
            const Example = mod[x.name]
            return (
              <YStack key={x.name} gap="$3">
                <YStack gap="$1">
                  <H2 size="$6">{x.title}</H2>
                  {x.description ? <Paragraph color="$color11">{x.description}</Paragraph> : null}
                </YStack>
                <YStack
                  p="$5"
                  rounded="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                  items="flex-start"
                  gap="$3"
                >
                  {Example ? <Example /> : <Text color="$red10">example {x.name} is not exported</Text>}
                </YStack>
                <Code html={x.html} />
              </YStack>
            )
          })
        )}

        <YStack gap="$3">
          <H2 size="$6">Types</H2>
          {doc.types.length === 0 ? (
            <Paragraph color="$color10">This module declares no types of its own.</Paragraph>
          ) : (
            doc.types.map((html, i) => <Code key={i} html={html} />)
          )}
        </YStack>

        <YStack gap="$2">
          <H3 size="$4">Exports</H3>
          <XStack flexWrap="wrap" gap="$2">
            {doc.members.map((m) => (
              <Text
                key={m.name}
                fontFamily="$mono"
                fontSize={12}
                px="$2"
                py={2}
                rounded="$2"
                bg="$color3"
                color={m.type ? '$color10' : '$color12'}
              >
                {m.type ? `type ${m.name}` : m.name}
              </Text>
            ))}
          </XStack>
        </YStack>
      </YStack>
    </XStack>
  )
}

const Code = ({ html }: { html: string }) => (
  <pre className="code" dangerouslySetInnerHTML={{ __html: html }} />
)
