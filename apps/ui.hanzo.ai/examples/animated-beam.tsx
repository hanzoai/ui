import { useRef, type ReactNode, type RefObject } from "react"
import { SizableText, XStack, YStack, type GuiElement } from "@hanzo/gui"
import { AnimatedBeam } from "@hanzo/ui"

type Anchor = RefObject<GuiElement | null>

/** The box every beam is measured against; relative, so the svg can lie over it. */
function Stage({ ref, height, children }: { ref: Anchor; height: number; children: ReactNode }) {
  return (
    <XStack ref={ref} position="relative" width="100%" height={height} items="center" justify="space-between" px="$8">
      {children}
    </XStack>
  )
}

/** A round node a beam runs from or to, stacked above the svg so the line passes under it. */
function Dot({ ref, size = 48, children }: { ref: Anchor; size?: number; children: string }) {
  return (
    <YStack
      ref={ref}
      position="relative"
      z={1}
      width={size}
      height={size}
      rounded={999}
      bg="$background"
      borderWidth={1}
      borderColor="$borderColor"
      items="center"
      justify="center"
    >
      <SizableText fontWeight="600">{children}</SizableText>
    </YStack>
  )
}

/** Default — a beam draws itself, over and over, from one node to another inside a shared container. */
export function Default() {
  const container = useRef<GuiElement>(null)
  const from = useRef<GuiElement>(null)
  const to = useRef<GuiElement>(null)

  return (
    <Stage ref={container} height={160}>
      <Dot ref={from}>A</Dot>
      <Dot ref={to}>B</Dot>
      <AnimatedBeam containerRef={container} fromRef={from} toRef={to} />
    </Stage>
  )
}

/** Custom colors and speed — `gradientStartColor`/`gradientStopColor` set the flowing stroke's gradient, `duration` its loop. */
export function CustomColors() {
  const container = useRef<GuiElement>(null)
  const from = useRef<GuiElement>(null)
  const to = useRef<GuiElement>(null)

  return (
    <Stage ref={container} height={160}>
      <Dot ref={from}>In</Dot>
      <Dot ref={to}>Out</Dot>
      <AnimatedBeam
        containerRef={container}
        fromRef={from}
        toRef={to}
        duration={1.5}
        gradientStartColor="#F97316"
        gradientStopColor="#DB2777"
      />
    </Stage>
  )
}

/** Hub — three spokes into one node: one container, one beam per pair, each staggered by its own `delay`. */
export function Hub() {
  const container = useRef<GuiElement>(null)
  const hub = useRef<GuiElement>(null)
  const one = useRef<GuiElement>(null)
  const two = useRef<GuiElement>(null)
  const three = useRef<GuiElement>(null)

  return (
    <Stage ref={container} height={220}>
      <YStack gap="$6">
        <Dot ref={one} size={40}>1</Dot>
        <Dot ref={two} size={40}>2</Dot>
        <Dot ref={three} size={40}>3</Dot>
      </YStack>
      <Dot ref={hub} size={56}>Hub</Dot>
      <AnimatedBeam containerRef={container} fromRef={one} toRef={hub} />
      <AnimatedBeam containerRef={container} fromRef={two} toRef={hub} delay={0.4} />
      <AnimatedBeam containerRef={container} fromRef={three} toRef={hub} delay={0.8} />
    </Stage>
  )
}
