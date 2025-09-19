import { VideoPlayer } from "@/registry/default/ui/video-player"

export function VideoPlayerDemo() {
  const videoSources = [
    {
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      type: "video/mp4",
      quality: "720p"
    },
    {
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      type: "video/mp4",
      quality: "1080p"
    }
  ]

  const subtitles = [
    {
      src: "/subtitles/sample-en.vtt",
      label: "English",
      srcLang: "en",
      default: true
    },
    {
      src: "/subtitles/sample-es.vtt",
      label: "Español",
      srcLang: "es"
    }
  ]

  return (
    <div className="space-y-8 p-6">
      <section>
        <h2 className="text-2xl font-bold mb-4">Basic Video Player</h2>
        <VideoPlayer
          sources={[videoSources[0]]}
          poster="https://peach.blender.org/wp-content/uploads/title_anouncement.jpg"
          size="md"
        />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Video Player with Quality Selection</h2>
        <VideoPlayer
          sources={videoSources}
          poster="https://peach.blender.org/wp-content/uploads/title_anouncement.jpg"
          size="lg"
          onPlay={() => console.log("Video started playing")}
          onPause={() => console.log("Video paused")}
          onQualityChange={(quality) => console.log("Quality changed to:", quality)}
        />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Video Player with Subtitles</h2>
        <VideoPlayer
          sources={videoSources}
          subtitles={subtitles}
          poster="https://peach.blender.org/wp-content/uploads/title_anouncement.jpg"
          size="full"
          onSpeedChange={(speed) => console.log("Speed changed to:", speed)}
        />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Auto-play Video (Muted)</h2>
        <VideoPlayer
          sources={[videoSources[0]]}
          autoPlay
          muted
          loop
          size="sm"
          poster="https://peach.blender.org/wp-content/uploads/title_anouncement.jpg"
        />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Video without Custom Controls</h2>
        <VideoPlayer
          sources={[videoSources[0]]}
          controls={false}
          size="md"
          poster="https://peach.blender.org/wp-content/uploads/title_anouncement.jpg"
        />
      </section>
    </div>
  )
}

export default VideoPlayerDemo