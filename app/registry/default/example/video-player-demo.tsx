import { VideoPlayer } from "@/registry/default/ui/video-player"

export default function VideoPlayerDemo() {
  const videoSources = [
    {
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      type: "video/mp4",
      quality: "720p",
    },
  ]

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <VideoPlayer
        sources={videoSources}
        poster="https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217"
      />
    </div>
  )
}
