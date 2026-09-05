import type { ComponentProps } from "react"
import {
  Anchor,
  Em,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Heading,
  Image,
  Paragraph,
  ScrollView,
  Separator,
  SizableText,
  Spacer,
  Span,
  Strong,
  Text,
  View,
  XStack,
  YStack,
  ZStack,
} from "@hanzo/ui"

type Size = NonNullable<ComponentProps<typeof SizableText>["size"]>

const SIZES: Size[] = [
  "$1",
  "$2",
  "$3",
  "$4",
  "$5",
  "$6",
  "$7",
  "$8",
  "$9",
  "$10",
  "$11",
  "$12",
  "$13",
  "$14",
  "$15",
  "$16",
]

const COVER =
  "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&q=80"

const LOG = [
  "09:41:02 build started on hanzo-build-linux-amd64",
  "09:41:04 restoring go module cache",
  "09:41:19 go build ./... ok",
  "09:41:20 go vet ./... ok",
  "09:41:58 go test ./... 312 passed",
  "09:42:03 pushing oci.hanzo.ai/hanzo/docs:1.8.3",
  "09:42:11 digest sha256:7f3a…c2e1",
  "09:42:12 done in 70s",
]

const COMMAND =
  'curl -s https://api.hanzo.ai/v1/chat/completions -H "Authorization: Bearer $HANZO_API_KEY" -H "Content-Type: application/json" -d @request.json'

/** Stacks — YStack lays its children down the page and XStack across it, `gap` spaces them and `elevation` lifts a panel; ZStack is the box children pile up in, each placing itself with `position="absolute"`. */
export function Stacks() {
  return (
    <YStack gap="$3" width="100%" maxW={420}>
      <XStack items="center" justify="space-between">
        <SizableText fontWeight="600">Deploy queue</SizableText>
        <SizableText size="$2" color="$quiet">
          3 waiting
        </SizableText>
      </XStack>
      <YStack gap="$2" p="$3" rounded="$3" bg="$panel" elevation="$2">
        <SizableText>api · main · 2 min ago</SizableText>
        <SizableText>docs · main · 6 min ago</SizableText>
        <SizableText>billing · release · 11 min ago</SizableText>
      </YStack>
      <XStack items="center" gap="$3">
        <ZStack width={72} height={28}>
          <View
            position="absolute"
            l={0}
            width={28}
            height={28}
            rounded={14}
            bg="$rim"
          />
          <View
            position="absolute"
            l={22}
            width={28}
            height={28}
            rounded={14}
            bg="$dim"
          />
          <View
            position="absolute"
            l={44}
            width={28}
            height={28}
            rounded={14}
            bg="$soft"
          />
        </ZStack>
        <SizableText size="$2" color="$quiet">
          Mara, Jules and Priya are on call
        </SizableText>
      </XStack>
    </YStack>
  )
}

/** Headings — H1 to H6 each own a rung of the type scale and render their own tag, Heading takes any rung by `size`, and Paragraph sets the body copy with Strong, Em, Span and Anchor marking words inside it. */
export function Headings() {
  return (
    <YStack gap="$3" maxW={520}>
      <H1>Release 2.14</H1>
      <Paragraph>
        Every model now <Strong>streams by default</Strong>, and a job that
        idles on its GPU is paused after a minute. Set{" "}
        <Span fontFamily="$mono">stream: false</Span> to keep the old shape, or
        read{" "}
        <Anchor
          href="https://github.com/hanzoai/ui/releases"
          target="_blank"
          rel="noreferrer"
        >
          the release on GitHub
        </Anchor>{" "}
        <Em>before</Em> upgrading.
      </Paragraph>
      <H2>Runtime</H2>
      <H3>Scheduler</H3>
      <Paragraph>
        A paused job keeps its place in the queue and resumes on the next free
        GPU.
      </Paragraph>
      <H4>Preemption</H4>
      <H5>Known issues</H5>
      <H6>Workarounds</H6>
      <Heading size="$6">Read next</Heading>
    </YStack>
  )
}

/** Sizes — the sixteen rungs of the type scale as SizableText, the same `size` Paragraph, Heading and Anchor take; `$4` and `$5` share a size, as do `$8` and `$9`. */
export function Sizes() {
  return (
    <YStack gap="$2">
      {SIZES.map((size) => (
        <SizableText key={size} size={size}>
          {size}
        </SizableText>
      ))}
    </YStack>
  )
}

/** Rules and gaps — Separator draws a hairline across, or down with `vertical`; Spacer holds open one `size` of empty space on both axes, so the same one works in a row or a column, or with `flex` whatever room is left. */
export function RulesAndGaps() {
  return (
    <YStack width="100%" maxW={420}>
      <XStack items="center">
        <SizableText>Overview</SizableText>
        <Spacer size="$3" />
        <Separator vertical self="stretch" />
        <Spacer size="$3" />
        <SizableText>Metrics</SizableText>
        <Spacer size="$3" />
        <Separator vertical self="stretch" />
        <Spacer size="$3" />
        <SizableText>Logs</SizableText>
        <Spacer flex={1} />
        <SizableText size="$2" color="$quiet">
          Live
        </SizableText>
      </XStack>
      <Spacer size="$4" />
      <Separator />
      <Spacer size="$4" />
      <XStack items="center">
        <SizableText>Region</SizableText>
        <Spacer size="$2" />
        <SizableText color="$quiet">eu-west-1</SizableText>
        <Spacer size="$6" />
        <SizableText>Zone</SizableText>
        <Spacer size="$2" />
        <SizableText color="$quiet">b</SizableText>
      </XStack>
    </YStack>
  )
}

/** Image and scroll — Image takes `src` and `alt` like an img and `objectFit` says whether the picture fills its box or fits inside it; ScrollView keeps the size you give it and scrolls what overflows, down by default or across with `horizontal`. */
export function ImageAndScroll() {
  return (
    <YStack gap="$4" width="100%" maxW={420}>
      <XStack gap="$3">
        <Image
          src={COVER}
          alt="Fountain pen on an open notebook"
          width={120}
          height={120}
          objectFit="cover"
          rounded="$3"
        />
        <Image
          src={COVER}
          alt="Fountain pen on an open notebook"
          width={120}
          height={120}
          objectFit="contain"
          rounded="$3"
          bg="$panel"
        />
      </XStack>
      <ScrollView
        height={120}
        rounded="$3"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <YStack p="$3" gap="$1">
          {LOG.map((line) => (
            <SizableText key={line} size="$2" fontFamily="$mono">
              {line}
            </SizableText>
          ))}
        </YStack>
      </ScrollView>
      <ScrollView
        horizontal
        rounded="$3"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Text fontFamily="$mono" p="$3" whiteSpace="nowrap">
          {COMMAND}
        </Text>
      </ScrollView>
    </YStack>
  )
}
