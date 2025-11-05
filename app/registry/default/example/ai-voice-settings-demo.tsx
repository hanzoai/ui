import { AIVoiceSettings } from "@/registry/default/ui/ai-voice-settings"

export default function AIVoiceSettingsDemo() {
  const handleSettingsChange = (settings: any) => {
    console.log("Settings changed:", settings)
  }

  const handleSave = (settings: any) => {
    console.log("Settings saved:", settings)
    // Here you would save to localStorage, database, etc.
  }

  const handlePreview = (voice: string, speed: number, pitch: number) => {
    console.log(
      `Previewing voice: ${voice} at ${speed}x speed, ${pitch}x pitch`
    )
    // Here you would play a sample audio
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <AIVoiceSettings
        settings={{
          voice: "nova",
          language: "en-US",
          personality: "friendly",
          speed: 1.0,
          pitch: 1.0,
          wakeWord: "Hey Assistant",
          customInstructions: "",
          autoListen: false,
          noiseCancellation: true,
        }}
        onSettingsChange={handleSettingsChange}
        onSave={handleSave}
        onPreview={handlePreview}
      />
    </div>
  )
}
