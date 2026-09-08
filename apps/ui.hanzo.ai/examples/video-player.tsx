import { YStack } from "@hanzo/gui"
import { MediaPlayer, type MediaSource } from "@hanzo/ui"

const bigBuckBunny: MediaSource[] = [
  {
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    type: "video/mp4",
    quality: "720p",
  },
]

/** Default — a poster, a play/pause/skip transport, volume and a time readout that fade in on hover. */
export function Default() {
  return (
    <MediaPlayer
      sources={bigBuckBunny}
      poster="https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217"
    />
  )
}

/** Sizes — `sm`/`md`/`lg` cap the width at a fixed ceiling, `full` fills its container; every size keeps the 16∶9 frame. */
export function Sizes() {
  return (
    <YStack gap="$4" items="center">
      <MediaPlayer sources={bigBuckBunny} size="sm" />
      <MediaPlayer sources={bigBuckBunny} size="lg" />
    </YStack>
  )
}

/** Multiple qualities — sources carrying more than one `quality` add a settings menu that swaps the source without losing the current time. */
export function MultipleQualities() {
  const sources: MediaSource[] = [
    { src: "https://example.com/video-480p.mp4", type: "video/mp4", quality: "480p" },
    { src: "https://example.com/video-720p.mp4", type: "video/mp4", quality: "720p" },
    { src: "https://example.com/video-1080p.mp4", type: "video/mp4", quality: "1080p" },
  ]
  return <MediaPlayer sources={sources} />
}

/** Subtitles — a track list adds a captions toggle to the transport, defaulting to the first track. */
export function Subtitles() {
  return (
    <MediaPlayer
      sources={bigBuckBunny}
      subtitles={[
        { src: "/captions/en.vtt", label: "English", srcLang: "en", default: true },
        { src: "/captions/fr.vtt", label: "Français", srcLang: "fr" },
      ]}
    />
  )
}
