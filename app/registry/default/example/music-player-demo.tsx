import { MusicPlayer } from "@/registry/default/ui/music-player"

const tracks = [
  {
    id: "1",
    title: "Midnight Dreams",
    artist: "Luna Eclipse",
    album: "Nocturnal Vibes",
    duration: 245,
    src: "/audio/track1.mp3",
    artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
  },
  {
    id: "2",
    title: "Solar Flare",
    artist: "The Cosmic Collective",
    album: "Stellar Journey",
    duration: 198,
    src: "/audio/track2.mp3",
    artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
  },
  {
    id: "3",
    title: "Ocean Waves",
    artist: "Serene Sounds",
    duration: 312,
    src: "/audio/track3.mp3",
    artwork: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",
  },
]

export default function MusicPlayerDemo() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <MusicPlayer tracks={tracks} autoPlay={false} showWaveform />
      </div>
    </div>
  )
}
