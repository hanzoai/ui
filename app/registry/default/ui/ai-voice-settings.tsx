"use client"

import * as React from "react"
import { Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import { Input } from "@/registry/default/ui/input"
import { Label } from "@/registry/default/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"
import { Separator } from "@/registry/default/ui/separator"
import { Slider } from "@/registry/default/ui/slider"
import { Switch } from "@/registry/default/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/default/ui/tabs"
import { Textarea } from "@/registry/default/ui/textarea"

// ============================================================================
// Types & Constants
// ============================================================================

export interface Voice {
  label: string
  value: string
  gender: "male" | "female" | "neutral"
  description: string
}

export interface Language {
  label: string
  value: string
}

export interface Personality {
  label: string
  value: string
  description: string
}

export const voices: Voice[] = [
  {
    label: "Alloy",
    value: "alloy",
    gender: "neutral",
    description: "Neutral and balanced",
  },
  {
    label: "Echo",
    value: "echo",
    gender: "male",
    description: "Clear and articulate",
  },
  {
    label: "Fable",
    value: "fable",
    gender: "neutral",
    description: "Expressive storytelling",
  },
  {
    label: "Onyx",
    value: "onyx",
    gender: "male",
    description: "Deep and authoritative",
  },
  {
    label: "Nova",
    value: "nova",
    gender: "female",
    description: "Warm and friendly",
  },
  {
    label: "Shimmer",
    value: "shimmer",
    gender: "female",
    description: "Energetic and bright",
  },
  {
    label: "Samantha",
    value: "samantha",
    gender: "female",
    description: "Classic and smooth",
  },
  { label: "Alex", value: "alex", gender: "male", description: "Professional" },
]

export const languages: Language[] = [
  { label: "English (US)", value: "en-US" },
  { label: "English (UK)", value: "en-GB" },
  { label: "English (AU)", value: "en-AU" },
  { label: "Spanish (Spain)", value: "es-ES" },
  { label: "Spanish (Mexico)", value: "es-MX" },
  { label: "French (France)", value: "fr-FR" },
  { label: "French (Canada)", value: "fr-CA" },
  { label: "German", value: "de-DE" },
  { label: "Italian", value: "it-IT" },
  { label: "Portuguese (Brazil)", value: "pt-BR" },
  { label: "Portuguese (Portugal)", value: "pt-PT" },
  { label: "Japanese", value: "ja-JP" },
  { label: "Korean", value: "ko-KR" },
  { label: "Chinese (Mandarin)", value: "zh-CN" },
  { label: "Chinese (Taiwan)", value: "zh-TW" },
  { label: "Arabic", value: "ar-SA" },
  { label: "Hindi", value: "hi-IN" },
  { label: "Russian", value: "ru-RU" },
  { label: "Dutch", value: "nl-NL" },
  { label: "Polish", value: "pl-PL" },
]

export const personalities: Personality[] = [
  {
    label: "Friendly",
    value: "friendly",
    description: "Warm and approachable, uses casual language",
  },
  {
    label: "Professional",
    value: "professional",
    description: "Formal and authoritative, maintains business tone",
  },
  {
    label: "Enthusiastic",
    value: "enthusiastic",
    description: "Energetic and upbeat, shows excitement",
  },
  {
    label: "Calm",
    value: "calm",
    description: "Soothing and measured, relaxed pace",
  },
  {
    label: "Witty",
    value: "witty",
    description: "Quick and clever, uses humor appropriately",
  },
]

// ============================================================================
// Composable Sub-Components (Orthogonal & Reusable)
// ============================================================================

export interface VoiceSelectorProps {
  value: string
  onValueChange: (value: string) => void
  voices?: Voice[]
  showDescription?: boolean
}

export const VoiceSelector = React.forwardRef<
  HTMLDivElement,
  VoiceSelectorProps
>(
  (
    {
      value,
      onValueChange,
      voices: customVoices = voices,
      showDescription = true,
    },
    ref
  ) => {
    const selected = customVoices.find((v) => v.value === value)

    return (
      <div ref={ref} className="space-y-2">
        <Label htmlFor="voice">Voice</Label>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger id="voice">
            <SelectValue placeholder="Select voice" />
          </SelectTrigger>
          <SelectContent>
            {customVoices.map((voice) => (
              <SelectItem key={voice.value} value={voice.value}>
                <div className="flex items-center gap-2">
                  <span>{voice.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {voice.gender}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showDescription && selected && (
          <p className="text-xs text-muted-foreground">
            {selected.description}
          </p>
        )}
      </div>
    )
  }
)
VoiceSelector.displayName = "VoiceSelector"

export interface LanguageSelectorProps {
  value: string
  onValueChange: (value: string) => void
  languages?: Language[]
  showAutoDetect?: boolean
}

export const LanguageSelector = React.forwardRef<
  HTMLDivElement,
  LanguageSelectorProps
>(
  (
    {
      value,
      onValueChange,
      languages: customLanguages = languages,
      showAutoDetect = true,
    },
    ref
  ) => {
    return (
      <div ref={ref} className="space-y-2">
        <Label htmlFor="language">Spoken Language</Label>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger id="language">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {showAutoDetect && (
              <>
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectSeparator />
              </>
            )}
            {customLanguages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          For best results, select the language you mainly speak
        </p>
      </div>
    )
  }
)
LanguageSelector.displayName = "LanguageSelector"

export interface PersonalitySelectorProps {
  value: string
  onValueChange: (value: string) => void
  personalities?: Personality[]
  showDescription?: boolean
}

export const PersonalitySelector = React.forwardRef<
  HTMLDivElement,
  PersonalitySelectorProps
>(
  (
    {
      value,
      onValueChange,
      personalities: customPersonalities = personalities,
      showDescription = true,
    },
    ref
  ) => {
    const selected = customPersonalities.find((p) => p.value === value)

    return (
      <div ref={ref} className="space-y-2">
        <Label htmlFor="personality">Personality / Tone</Label>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger id="personality">
            <SelectValue placeholder="Select personality" />
          </SelectTrigger>
          <SelectContent>
            {customPersonalities.map((personality) => (
              <SelectItem key={personality.value} value={personality.value}>
                {personality.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showDescription && selected && (
          <p className="text-xs text-muted-foreground">
            {selected.description}
          </p>
        )}
      </div>
    )
  }
)
PersonalitySelector.displayName = "PersonalitySelector"

export interface SpeedControlProps {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export const SpeedControl = React.forwardRef<HTMLDivElement, SpeedControlProps>(
  ({ value, onValueChange, min = 0.5, max = 2.0, step = 0.1 }, ref) => {
    return (
      <div ref={ref} className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="speed">Speaking Speed</Label>
          <span className="text-sm text-muted-foreground">
            {value.toFixed(1)}x
          </span>
        </div>
        <Slider
          id="speed"
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={([val]) => onValueChange(val)}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Slower ({min}x)</span>
          <span>Normal (1.0x)</span>
          <span>Faster ({max}x)</span>
        </div>
      </div>
    )
  }
)
SpeedControl.displayName = "SpeedControl"

export interface PitchControlProps {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export const PitchControl = React.forwardRef<HTMLDivElement, PitchControlProps>(
  ({ value, onValueChange, min = 0.5, max = 2.0, step = 0.1 }, ref) => {
    return (
      <div ref={ref} className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="pitch">Voice Pitch</Label>
          <span className="text-sm text-muted-foreground">
            {value.toFixed(1)}x
          </span>
        </div>
        <Slider
          id="pitch"
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={([val]) => onValueChange(val)}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Lower ({min}x)</span>
          <span>Normal (1.0x)</span>
          <span>Higher ({max}x)</span>
        </div>
      </div>
    )
  }
)
PitchControl.displayName = "PitchControl"

export interface WakeWordInputProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export const WakeWordInput = React.forwardRef<
  HTMLDivElement,
  WakeWordInputProps
>(
  (
    {
      value,
      onValueChange,
      placeholder = "e.g., Hey Assistant, Computer, Jarvis",
    },
    ref
  ) => {
    return (
      <div ref={ref} className="space-y-2">
        <Label htmlFor="wakeWord">Wake Word</Label>
        <Input
          id="wakeWord"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Phrase to activate hands-free listening (optional)
        </p>
      </div>
    )
  }
)
WakeWordInput.displayName = "WakeWordInput"

export interface CustomInstructionsProps {
  value: string
  onValueChange: (value: string) => void
  rows?: number
  placeholder?: string
}

export const CustomInstructions = React.forwardRef<
  HTMLDivElement,
  CustomInstructionsProps
>(
  (
    {
      value,
      onValueChange,
      rows = 4,
      placeholder = "Add any specific instructions for the AI assistant...",
    },
    ref
  ) => {
    return (
      <div ref={ref} className="space-y-2">
        <Label htmlFor="customInstructions">Custom Instructions</Label>
        <Textarea
          id="customInstructions"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          rows={rows}
        />
        <p className="text-xs text-muted-foreground">
          These instructions will guide how the AI responds to you
        </p>
      </div>
    )
  }
)
CustomInstructions.displayName = "CustomInstructions"

export interface AutoListenToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export const AutoListenToggle = React.forwardRef<
  HTMLDivElement,
  AutoListenToggleProps
>(({ checked, onCheckedChange }, ref) => {
  return (
    <div ref={ref} className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="autoListen">Auto-listen Mode</Label>
        <p className="text-xs text-muted-foreground">
          Automatically start listening after each response
        </p>
      </div>
      <Switch
        id="autoListen"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
})
AutoListenToggle.displayName = "AutoListenToggle"

export interface NoiseCancellationToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export const NoiseCancellationToggle = React.forwardRef<
  HTMLDivElement,
  NoiseCancellationToggleProps
>(({ checked, onCheckedChange }, ref) => {
  return (
    <div ref={ref} className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="noiseCancellation">Noise Cancellation</Label>
        <p className="text-xs text-muted-foreground">
          Filter background noise for clearer recognition
        </p>
      </div>
      <Switch
        id="noiseCancellation"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
})
NoiseCancellationToggle.displayName = "NoiseCancellationToggle"

// ============================================================================
// Main Composite Component
// ============================================================================

export interface AIVoiceSettings {
  voice: string
  language: string
  personality: string
  speed: number
  pitch: number
  wakeWord: string
  customInstructions: string
  autoListen: boolean
  noiseCancellation: boolean
}

export interface AIVoiceSettingsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  settings?: Partial<AIVoiceSettings>
  onSettingsChange?: (settings: AIVoiceSettings) => void
  onSave?: (settings: AIVoiceSettings) => void
  onReset?: () => void
  onPreview?: (voice: string, speed: number, pitch: number) => void
}

const AIVoiceSettings = React.forwardRef<HTMLDivElement, AIVoiceSettingsProps>(
  (
    {
      className,
      settings: initialSettings,
      onSettingsChange,
      onSave,
      onReset,
      onPreview,
      ...props
    },
    ref
  ) => {
    const [settings, setSettings] = React.useState<AIVoiceSettings>({
      voice: initialSettings?.voice || "alloy",
      language: initialSettings?.language || "en-US",
      personality: initialSettings?.personality || "friendly",
      speed: initialSettings?.speed || 1.0,
      pitch: initialSettings?.pitch || 1.0,
      wakeWord: initialSettings?.wakeWord || "",
      customInstructions: initialSettings?.customInstructions || "",
      autoListen: initialSettings?.autoListen ?? false,
      noiseCancellation: initialSettings?.noiseCancellation ?? true,
    })

    const updateSetting = <K extends keyof AIVoiceSettings>(
      key: K,
      value: AIVoiceSettings[K]
    ) => {
      const newSettings = { ...settings, [key]: value }
      setSettings(newSettings)
      onSettingsChange?.(newSettings)
    }

    const handleSave = () => {
      onSave?.(settings)
    }

    const handleReset = () => {
      const defaultSettings: AIVoiceSettings = {
        voice: "alloy",
        language: "en-US",
        personality: "friendly",
        speed: 1.0,
        pitch: 1.0,
        wakeWord: "",
        customInstructions: "",
        autoListen: false,
        noiseCancellation: true,
      }
      setSettings(defaultSettings)
      onSettingsChange?.(defaultSettings)
      onReset?.()
    }

    const handlePreview = () => {
      onPreview?.(settings.voice, settings.speed, settings.pitch)
    }

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Language & Voice</CardTitle>
                <CardDescription>
                  Configure your preferred language and voice profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <LanguageSelector
                  value={settings.language}
                  onValueChange={(value) => updateSetting("language", value)}
                />
                <VoiceSelector
                  value={settings.voice}
                  onValueChange={(value) => updateSetting("voice", value)}
                />
                <PersonalitySelector
                  value={settings.personality}
                  onValueChange={(value) => updateSetting("personality", value)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Voice Characteristics</CardTitle>
                <CardDescription>
                  Fine-tune voice speed and pitch to your preference
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SpeedControl
                  value={settings.speed}
                  onValueChange={(value) => updateSetting("speed", value)}
                />
                <Separator />
                <PitchControl
                  value={settings.pitch}
                  onValueChange={(value) => updateSetting("pitch", value)}
                />
                <Separator />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handlePreview}
                >
                  Preview Voice
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Configure wake words, custom instructions, and audio features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <WakeWordInput
                  value={settings.wakeWord}
                  onValueChange={(value) => updateSetting("wakeWord", value)}
                />
                <Separator />
                <CustomInstructions
                  value={settings.customInstructions}
                  onValueChange={(value) =>
                    updateSetting("customInstructions", value)
                  }
                />
                <Separator />
                <div className="space-y-4">
                  <AutoListenToggle
                    checked={settings.autoListen}
                    onCheckedChange={(checked) =>
                      updateSetting("autoListen", checked)
                    }
                  />
                  <Separator />
                  <NoiseCancellationToggle
                    checked={settings.noiseCancellation}
                    onCheckedChange={(checked) =>
                      updateSetting("noiseCancellation", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
              <CardContent className="flex gap-3 pt-6">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Voice Recognition Tips
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    For best results, speak clearly, use a good microphone, and
                    minimize background noise. Wake word detection works best in
                    quiet environments.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    )
  }
)

AIVoiceSettings.displayName = "AIVoiceSettings"

export { AIVoiceSettings }
