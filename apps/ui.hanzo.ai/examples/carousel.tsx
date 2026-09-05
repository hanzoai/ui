import { useState } from "react"
import { Paragraph, Text, YStack } from "@hanzo/gui"
import type { CarouselApi } from "@hanzo/ui"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@hanzo/ui"

const steps = [
  ["Create a project", "One command scaffolds the app and its config."],
  ["Connect a repository", "Every push builds on the runners."],
  ["Ship", "A merge to main publishes the site."],
]

/** Default — three slides with the previous and next arrows. */
export function Default() {
  return (
    <YStack width="100%" px={40}>
      <Carousel width="100%" maxW={360}>
        <CarouselContent>
          {steps.map(([title, body]) => (
            <CarouselItem key={title}>
              <YStack
                p="$5"
                gap="$2"
                rounded="$4"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <Text fontWeight="600">{title}</Text>
                <Paragraph color="$color11">{body}</Paragraph>
              </YStack>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </YStack>
  )
}

/** Loop and autoplay — wraps at the ends and advances every four seconds until the pointer is over it. */
export function LoopAutoplay() {
  return (
    <YStack width="100%" px={40}>
      <Carousel
        width="100%"
        maxW={360}
        options={{ loop: true, autoplay: 4000 }}
      >
        <CarouselContent>
          {steps.map(([title, body]) => (
            <CarouselItem key={title}>
              <YStack p="$5" gap="$2" rounded="$4" bg="$color3">
                <Text fontWeight="600">{title}</Text>
                <Paragraph color="$color11">{body}</Paragraph>
              </YStack>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </YStack>
  )
}

/** With the api — the caller keeps the api and reads which slide settled. */
export function WithApi() {
  const [api, setApi] = useState<CarouselApi | null>(null)
  const [index, setIndex] = useState(0)
  return (
    <YStack gap="$3" items="flex-start">
      <YStack width="100%" px={40}>
        <Carousel
          width={360}
          setApi={setApi}
          onCarouselSelect={(a) => setIndex(a.selectedScrollSnap())}
        >
          <CarouselContent>
            {steps.map(([title]) => (
              <CarouselItem key={title}>
                <YStack p="$5" rounded="$4" bg="$color3">
                  <Text fontWeight="600">{title}</Text>
                </YStack>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </YStack>
      <Paragraph color="$color11">
        Slide {index + 1} of {steps.length}
      </Paragraph>
      <Text
        fontSize={13}
        color="$color12"
        cursor="pointer"
        onPress={() => api?.scrollTo(0)}
      >
        Back to the first
      </Text>
    </YStack>
  )
}
