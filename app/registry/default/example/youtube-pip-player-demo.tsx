'use client'

import { YouTubePipPlayer } from "@/registry/default/ui/youtube-pip-player"

export function YouTubePipPlayerDemo() {
  return (
    <div className="space-y-8 p-6 bg-black min-h-screen">
      <section>
        <h2 className="text-2xl font-bold mb-4 text-white">YouTube PIP Player - Hero Section</h2>
        <p className="text-white/60 mb-4">
          Scroll down to see the video transition into a draggable Picture-in-Picture window.
          The PIP window can be resized (normal → double → fullscreen) and closed.
        </p>
        <YouTubePipPlayer
          videoId="dQw4w9WgXcQ"
          size="hero"
          enablePip={true}
          enableTvEffects={true}
          showLiveIndicator={true}
          defaultMuted={true}
          onMuteChange={(muted) => console.log("Mute state:", muted)}
          onPipEnter={() => console.log("Entered PIP mode")}
          onPipExit={() => console.log("Exited PIP mode")}
        />
      </section>

      {/* Spacer content to enable scrolling */}
      <div className="space-y-8 py-20">
        <section className="max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-4">Features</h3>
          <ul className="space-y-2 text-white/70">
            <li>• Scroll-based PIP activation</li>
            <li>• Draggable PIP window with corner snapping</li>
            <li>• Three size modes: normal, double, fullscreen</li>
            <li>• TV-style visual effects (glow, scan lines, grain)</li>
            <li>• Live indicator badge</li>
            <li>• Global mute control</li>
            <li>• Video rotation support</li>
            <li>• Mobile-friendly (PIP hidden on mobile)</li>
          </ul>
        </section>

        <section className="max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-4">Multiple Videos (Auto-Rotate)</h3>
          <YouTubePipPlayer
            videoId={["dQw4w9WgXcQ", "jNQXAC9IVRw", "9bZkp7q19f0"]}
            rotationInterval={15000}
            size="md"
            enablePip={false}
            enableTvEffects={false}
            showLiveIndicator={false}
          />
        </section>

        <section className="max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-4">Without TV Effects</h3>
          <YouTubePipPlayer
            videoId="dQw4w9WgXcQ"
            size="sm"
            enablePip={false}
            enableTvEffects={false}
            showLiveIndicator={false}
          />
        </section>

        {/* More spacer for scroll */}
        <div className="h-[100vh] flex items-center justify-center">
          <p className="text-white/40 text-center">
            Keep scrolling to see the PIP window appear!
          </p>
        </div>
      </div>
    </div>
  )
}

export default YouTubePipPlayerDemo
