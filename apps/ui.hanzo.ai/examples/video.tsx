import { useRef, useState } from "react"
import { Text, XStack, YStack } from "@hanzo/gui"
import { Button, VideoPlayer, YouTubeEmbed } from "@hanzo/ui"

/** Default — a `<video>` whose `sources` array becomes one `<source>` per encoding, the browser picking the first it can decode; every other prop is the element's own. */
export function Default() {
  return (
    <VideoPlayer
      sources={[
        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      ]}
      controls
      muted
      playsInline
      preload="metadata"
      style={{ width: "100%", maxWidth: 480, borderRadius: 8 }}
    />
  )
}

/** With ref — the ref lands on the `<video>` element itself, so your own buttons drive `play()` and `pause()` and the element's events report which state it is in. */
export function WithRef() {
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  return (
    <YStack gap="$3" maxW={480}>
      <VideoPlayer
        ref={video}
        sources={[
          "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
          "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        ]}
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        style={{ width: "100%", borderRadius: 8 }}
      />
      <XStack gap="$3" items="center">
        <Button
          variant="outline"
          size="sm"
          onPress={() => video.current?.play()}
        >
          Play
        </Button>
        <Button
          variant="outline"
          size="sm"
          onPress={() => video.current?.pause()}
        >
          Pause
        </Button>
        <Text color="$color11">{playing ? "Playing" : "Paused"}</Text>
      </XStack>
    </YStack>
  )
}

/** YouTube — the poster and a play mark are all that load; the iframe mounts on click, so a page of these costs one embed when someone watches, not one per video on sight. */
export function YouTube() {
  return (
    <YStack maxW={640}>
      <YouTubeEmbed
        youtubeID="aqz-KE-bpKQ"
        width={640}
        height={360}
        title="Big Buck Bunny"
      />
    </YStack>
  )
}

/** Caption and offset — `caption` sits over the poster, `timeAt` starts playback partway in, and `buttonSize` scales the play mark for a smaller frame. */
export function CaptionAndOffset() {
  return (
    <YStack maxW={400}>
      <YouTubeEmbed
        youtubeID="eRsGyueVLvQ"
        width={400}
        height={225}
        buttonSize={60}
        timeAt="90s"
        title="Sintel"
        caption="Open film from the Blender Foundation"
      />
    </YStack>
  )
}
