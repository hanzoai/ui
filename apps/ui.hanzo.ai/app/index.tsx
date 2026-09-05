import { H1, H2, Paragraph, Text, XStack, YStack } from '@hanzo/gui'
import { Head, Link, useLoader } from 'one'

export async function loader() {
  const { catalog, productCatalog } = await import('~/catalog')
  const asCards = (entries: ReturnType<typeof catalog>) =>
    entries.map((e) => ({ name: e.name, title: e.title, members: e.members.length }))
  return { primitives: asCards(catalog()), product: asCards(productCatalog()) }
}

const Cards = ({ base, entries }: { base: string; entries: { name: string; title: string; members: number }[] }) => (
  <XStack flexWrap="wrap" gap="$3">
    {entries.map((e) => (
      <Link key={e.name} href={`/${base}/${e.name}`} style={{ textDecorationLine: 'none' }}>
        <YStack
          width={240}
          p="$4"
          gap="$1"
          rounded="$4"
          borderWidth={1}
          borderColor="$borderColor"
          hoverStyle={{ borderColor: '$color8' }}
        >
          <Text fontWeight="600">{e.title}</Text>
          <Text fontSize={12} color="$color10">
            {e.members} export{e.members === 1 ? '' : 's'}
          </Text>
        </YStack>
      </Link>
    ))}
  </XStack>
)

/** Every module @hanzo/ui exports, one card each, in the order the package names them. */
export default function Index() {
  const { primitives, product } = useLoader(loader)
  return (
    <YStack maxW={1100} width="100%" self="center" px="$5" py="$8" gap="$8">
      <Head>
        <title>@hanzo/ui</title>
        <meta name="description" content="Every component @hanzo/ui ships, rendered from the package itself." />
      </Head>
      <YStack gap="$3">
        <H1>@hanzo/ui</H1>
        <Paragraph size="$5" color="$color11" maxW={640}>
          One component layer for web, native and desktop, built on @hanzo/gui. Each page below is
          a module the package exports: what it renders, the code that rendered it, and its types
          quoted from the source.
        </Paragraph>
        <Text fontFamily="$mono" fontSize={13} color="$color11">
          npm install @hanzo/ui
        </Text>
      </YStack>
      <YStack gap="$3">
        <H2 size="$7">Primitives</H2>
        <Paragraph color="$color11" maxW={640}>
          The component API — one cross-platform primitive per name, importable from the package root.
        </Paragraph>
        <Cards base="ui" entries={primitives} />
      </YStack>
      <YStack gap="$3">
        <H2 size="$7">Product</H2>
        <Paragraph color="$color11" maxW={640}>
          The app layer — charts, status tags, page chrome, detail panes — from{' '}
          <Text fontFamily="$mono">@hanzo/ui/product</Text>.
        </Paragraph>
        <Cards base="product" entries={product} />
      </YStack>
    </YStack>
  )
}
