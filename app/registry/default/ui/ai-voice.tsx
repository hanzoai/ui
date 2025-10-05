"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"
import { Slider } from "@/registry/default/ui/slider"
import { Switch } from "@/registry/default/ui/switch"
import { Textarea } from "@/registry/default/ui/textarea"

interface VoiceProfile {
  id: string
  name: string
  language: string
  gender: "male" | "female" | "neutral"
  accent?: string
  speed?: number
  pitch?: number
}

interface VoiceCommand {
  command: string
  confidence: number
  timestamp: number
  parameters?: Record<string, any>
}

interface AIVoiceProps {
  onTranscript?: (text: string) => void
  onCommand?: (command: VoiceCommand) => void
  language?: string
  voice?: VoiceProfile
  wakeWord?: string
  autoStart?: boolean
  className?: string
}

const defaultVoices: VoiceProfile[] = [
  {
    id: "default-en-us",
    name: "English (US)",
    language: "en-US",
    gender: "neutral",
    speed: 1.0,
    pitch: 1.0,
  },
  {
    id: "default-en-gb",
    name: "English (UK)",
    language: "en-GB",
    gender: "neutral",
    speed: 1.0,
    pitch: 1.0,
  },
  {
    id: "default-es-es",
    name: "Spanish (Spain)",
    language: "es-ES",
    gender: "neutral",
    speed: 1.0,
    pitch: 1.0,
  },
  {
    id: "default-fr-fr",
    name: "French (France)",
    language: "fr-FR",
    gender: "neutral",
    speed: 1.0,
    pitch: 1.0,
  },
  {
    id: "default-de-de",
    name: "German (Germany)",
    language: "de-DE",
    gender: "neutral",
    speed: 1.0,
    pitch: 1.0,
  },
  {
    id: "default-ja-jp",
    name: "Japanese (Japan)",
    language: "ja-JP",
    gender: "neutral",
    speed: 1.0,
    pitch: 1.0,
  },
  {
    id: "default-zh-cn",
    name: "Chinese (Mandarin)",
    language: "zh-CN",
    gender: "neutral",
    speed: 1.0,
    pitch: 1.0,
  },
]

const commandPatterns = [
  { pattern: /^(start|begin|go)$/i, command: "start" },
  { pattern: /^(stop|end|halt)$/i, command: "stop" },
  { pattern: /^(pause|wait)$/i, command: "pause" },
  { pattern: /^(resume|continue)$/i, command: "resume" },
  { pattern: /^(clear|reset)$/i, command: "clear" },
  { pattern: /^volume (\d+)$/i, command: "volume", extract: 1 },
  { pattern: /^speak (.+)$/i, command: "speak", extract: 1 },
]

export function AIVoice({
  onTranscript,
  onCommand,
  language = "en-US",
  voice,
  wakeWord = "hey assistant",
  autoStart = false,
  className,
}: AIVoiceProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [finalTranscript, setFinalTranscript] = useState("")
  const [currentVolume, setCurrentVolume] = useState(0)
  const [isWakeWordActive, setIsWakeWordActive] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile>(
    voice || defaultVoices[0]
  )
  const [showSettings, setShowSettings] = useState(false)
  const [speechSpeed, setSpeechSpeed] = useState(1.0)
  const [speechPitch, setSpeechPitch] = useState(1.0)
  const [speechVolume, setSpeechVolume] = useState(0.8)
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.webkitSpeechRecognition || window.SpeechRecognition
      recognitionRef.current = new SpeechRecognition()

      if (recognitionRef.current) {
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = language

        recognitionRef.current.onresult = (event) => {
          let interimTranscript = ""
          let finalTranscriptText = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              finalTranscriptText += result[0].transcript
            } else {
              interimTranscript += result[0].transcript
            }
          }

          setTranscript(interimTranscript)

          if (finalTranscriptText) {
            setFinalTranscript((prev) => prev + finalTranscriptText)
            onTranscript?.(finalTranscriptText)

            // Check for wake word
            if (
              isWakeWordActive &&
              finalTranscriptText.toLowerCase().includes(wakeWord.toLowerCase())
            ) {
              setIsWakeWordActive(false)
              handleWakeWordDetected(finalTranscriptText)
            }

            // Check for voice commands
            checkForCommands(finalTranscriptText)
          }
        }

        recognitionRef.current.onerror = (event) => {
          setError(`Speech recognition error: ${event.error}`)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }

    // Initialize speech synthesis
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [language, wakeWord, isWakeWordActive, onTranscript])

  // Auto start if enabled
  useEffect(() => {
    if (autoStart) {
      startListening()
    }
  }, [autoStart])

  // Initialize audio context and analyzer
  const initializeAudioContext = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      microphoneRef.current =
        audioContextRef.current.createMediaStreamSource(stream)

      analyserRef.current.fftSize = 256
      microphoneRef.current.connect(analyserRef.current)

      startAudioVisualization()
      setError(null)
    } catch (err) {
      setError("Microphone access denied")
    }
  }, [])

  // Audio visualization
  const startAudioVisualization = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!analyserRef.current) return

      analyserRef.current.getByteFrequencyData(dataArray)

      // Calculate audio level
      const sum = dataArray.reduce((a, b) => a + b, 0)
      const level = sum / (bufferLength * 255)
      setAudioLevel(level)

      // Draw waveform
      ctx.fillStyle = "rgb(0, 0, 0, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0

      ctx.fillStyle = "rgb(59, 130, 246)"

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8

        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        x += barWidth + 1
      }

      animationFrameRef.current = requestAnimationFrame(draw)
    }

    draw()
  }, [])

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      setError("Speech recognition not supported")
      return
    }

    try {
      await initializeAudioContext()
      recognitionRef.current.start()
      setIsListening(true)
      setError(null)
    } catch (err) {
      setError("Failed to start listening")
    }
  }, [initializeAudioContext])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!synthRef.current) return

      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = selectedVoice.language
      utterance.rate = speechSpeed
      utterance.pitch = speechPitch
      utterance.volume = speechVolume

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => {
        setIsSpeaking(false)
        setError("Speech synthesis error")
      }

      synthRef.current.speak(utterance)
    },
    [selectedVoice, speechSpeed, speechPitch, speechVolume]
  )

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }, [])

  const checkForCommands = useCallback(
    (text: string) => {
      const words = text.toLowerCase().trim()

      for (const { pattern, command, extract } of commandPatterns) {
        const match = words.match(pattern)
        if (match) {
          const voiceCommand: VoiceCommand = {
            command,
            confidence: 0.9,
            timestamp: Date.now(),
            parameters: extract ? { value: match[extract] } : undefined,
          }
          onCommand?.(voiceCommand)
          break
        }
      }
    },
    [onCommand]
  )

  const handleWakeWordDetected = useCallback(
    (text: string) => {
      speak("How can I help you?")
      const afterWakeWord = text.split(wakeWord)[1]?.trim()
      if (afterWakeWord) {
        checkForCommands(afterWakeWord)
      }
    },
    [speak, wakeWord, checkForCommands]
  )

  const clearTranscript = useCallback(() => {
    setTranscript("")
    setFinalTranscript("")
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case " ":
          event.preventDefault()
          if (isListening) {
            stopListening()
          } else {
            startListening()
          }
          break
        case "Escape":
          event.preventDefault()
          stopListening()
          stopSpeaking()
          break
        case "Enter":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            if (finalTranscript.trim()) {
              speak(finalTranscript)
            }
          }
          break
      }
    },
    [
      isListening,
      startListening,
      stopListening,
      stopSpeaking,
      finalTranscript,
      speak,
    ]
  )

  return (
    <div
      className={cn("w-full max-w-2xl mx-auto space-y-4", className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Main Control Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            AI Voice Interface
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Audio Visualization */}
          <div className="relative h-24 bg-muted rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={400}
              height={96}
              className="w-full h-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {!isListening && audioLevel === 0 && (
                <div className="text-muted-foreground text-sm">
                  Click microphone to start listening
                </div>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isListening ? "destructive" : "default"}
              size="lg"
              className={cn(
                "relative transition-all duration-200",
                isListening && audioLevel > 0.1 && "animate-pulse"
              )}
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
              <span className="ml-2">
                {isListening ? "Stop" : "Start"} Listening
              </span>
            </Button>

            <Button
              variant={isSpeaking ? "destructive" : "outline"}
              size="lg"
              onClick={isSpeaking ? stopSpeaking : () => speak(finalTranscript)}
              disabled={!finalTranscript.trim()}
            >
              {isSpeaking ? (
                <Square className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              <span className="ml-2">{isSpeaking ? "Stop" : "Speak"}</span>
            </Button>

            <Button variant="outline" size="lg" onClick={clearTranscript}>
              <RotateCcw className="h-4 w-4" />
              <span className="ml-2">Clear</span>
            </Button>
          </div>

          {/* Wake Word Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">Wake Word Detection</div>
              <div className="text-xs text-muted-foreground">
                Say "{wakeWord}" to activate
              </div>
            </div>
            <Switch
              checked={isWakeWordActive}
              onCheckedChange={setIsWakeWordActive}
            />
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-2">
            {isListening && (
              <Badge variant="default" className="animate-pulse">
                Listening
              </Badge>
            )}
            {isSpeaking && (
              <Badge variant="secondary" className="animate-pulse">
                Speaking
              </Badge>
            )}
            {isWakeWordActive && (
              <Badge variant="outline">Wake Word Active</Badge>
            )}
            {audioLevel > 0.1 && (
              <Badge variant="outline">
                Audio: {Math.round(audioLevel * 100)}%
              </Badge>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcript Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={finalTranscript + (transcript ? ` ${transcript}` : "")}
            onChange={(e) => setFinalTranscript(e.target.value)}
            placeholder="Transcript will appear here..."
            className="min-h-[100px] resize-none"
            readOnly={false}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{finalTranscript.length} characters</span>
            <span>Ctrl/Cmd + Enter to speak</span>
          </div>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Voice Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Voice Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice</label>
              <Select
                value={selectedVoice.id}
                onValueChange={(value) => {
                  const voice = defaultVoices.find((v) => v.id === value)
                  if (voice) setSelectedVoice(voice)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defaultVoices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Speech Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Speed</label>
                <Slider
                  value={[speechSpeed]}
                  onValueChange={([value]) => setSpeechSpeed(value)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground text-center">
                  {speechSpeed.toFixed(1)}x
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Pitch</label>
                <Slider
                  value={[speechPitch]}
                  onValueChange={([value]) => setSpeechPitch(value)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground text-center">
                  {speechPitch.toFixed(1)}x
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Volume</label>
                <Slider
                  value={[speechVolume]}
                  onValueChange={([value]) => setSpeechVolume(value)}
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground text-center">
                  {Math.round(speechVolume * 100)}%
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Keyboard Shortcuts</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Toggle listening:</span>
                  <kbd className="bg-muted px-1 rounded">Space</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Stop all:</span>
                  <kbd className="bg-muted px-1 rounded">Esc</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Speak transcript:</span>
                  <kbd className="bg-muted px-1 rounded">Ctrl+Enter</kbd>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export type { VoiceProfile, VoiceCommand, AIVoiceProps }
