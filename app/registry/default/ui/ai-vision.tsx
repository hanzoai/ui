"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  BarChart3,
  Camera,
  Copy,
  Download,
  Eye,
  FileText,
  Link,
  Loader2,
  Move,
  Palette,
  RotateCw,
  Smile,
  Square,
  Tag,
  Target,
  Type,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/default/ui/dropdown-menu"
import { Input } from "@/registry/default/ui/input"
import { Label } from "@/registry/default/ui/label"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
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

// Types
export type VisionCapability =
  | "object-detection"
  | "scene-description"
  | "ocr"
  | "color-analysis"
  | "tagging"
  | "face-detection"
  | "sentiment-analysis"
  | "image-generation"
  | "image-editing"

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
  confidence: number
  label: string
  color?: string
}

export interface DetectedText {
  text: string
  confidence: number
  boundingBox: BoundingBox
}

export interface ColorPalette {
  color: string
  percentage: number
  name?: string
}

export interface FaceDetection {
  boundingBox: BoundingBox
  confidence: number
  age?: number
  gender?: string
  emotion?: string
  landmarks?: { x: number; y: number }[]
}

export interface VisionResults {
  objects?: BoundingBox[]
  description?: string
  text?: DetectedText[]
  colors?: ColorPalette[]
  tags?: { label: string; confidence: number }[]
  faces?: FaceDetection[]
  sentiment?: {
    emotion: string
    confidence: number
    valence: number
    arousal: number
  }
  metadata?: {
    width: number
    height: number
    format: string
    size: number
    exif?: Record<string, any>
  }
}

export interface AIVisionProps extends React.HTMLAttributes<HTMLDivElement> {
  onAnalysis?: (results: VisionResults) => void
  capabilities?: VisionCapability[]
  maxFileSize?: number
  acceptedFormats?: string[]
  apiEndpoint?: string
  apiKey?: string
  defaultImage?: string
  enableCamera?: boolean
  enableUrl?: boolean
  enableGeneration?: boolean
  enableEditing?: boolean
  showConfidence?: boolean
  minConfidence?: number
}

// Canvas overlay component for visualizations
interface CanvasOverlayProps {
  imageRef: React.RefObject<HTMLImageElement>
  results: VisionResults
  showBoundingBoxes: boolean
  showConfidence: boolean
  minConfidence: number
  selectedTypes: string[]
}

const CanvasOverlay: React.FC<CanvasOverlayProps> = ({
  imageRef,
  results,
  showBoundingBoxes,
  showConfidence,
  minConfidence,
  selectedTypes,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    if (!canvasRef.current || !imageRef.current || !results) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const image = imageRef.current

    if (!ctx) return

    // Set canvas size to match image
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw bounding boxes
    if (
      showBoundingBoxes &&
      results.objects &&
      selectedTypes.includes("objects")
    ) {
      results.objects
        .filter((obj) => obj.confidence >= minConfidence)
        .forEach((obj) => {
          ctx.strokeStyle = obj.color || "#3b82f6"
          ctx.lineWidth = 3
          ctx.strokeRect(obj.x, obj.y, obj.width, obj.height)

          if (showConfidence) {
            ctx.fillStyle = obj.color || "#3b82f6"
            ctx.font = "14px Inter, sans-serif"
            const text = `${obj.label} (${Math.round(obj.confidence * 100)}%)`
            const textWidth = ctx.measureText(text).width

            ctx.fillRect(obj.x, obj.y - 25, textWidth + 10, 25)
            ctx.fillStyle = "white"
            ctx.fillText(text, obj.x + 5, obj.y - 8)
          }
        })
    }

    // Draw text regions
    if (showBoundingBoxes && results.text && selectedTypes.includes("text")) {
      results.text
        .filter((text) => text.confidence >= minConfidence)
        .forEach((textItem) => {
          ctx.strokeStyle = "#10b981"
          ctx.lineWidth = 2
          ctx.strokeRect(
            textItem.boundingBox.x,
            textItem.boundingBox.y,
            textItem.boundingBox.width,
            textItem.boundingBox.height
          )

          if (showConfidence) {
            ctx.fillStyle = "#10b981"
            ctx.font = "12px Inter, sans-serif"
            const text = `OCR (${Math.round(textItem.confidence * 100)}%)`
            ctx.fillRect(
              textItem.boundingBox.x,
              textItem.boundingBox.y - 20,
              80,
              20
            )
            ctx.fillStyle = "white"
            ctx.fillText(
              text,
              textItem.boundingBox.x + 5,
              textItem.boundingBox.y - 6
            )
          }
        })
    }

    // Draw face detection
    if (showBoundingBoxes && results.faces && selectedTypes.includes("faces")) {
      results.faces
        .filter((face) => face.confidence >= minConfidence)
        .forEach((face) => {
          ctx.strokeStyle = "#f59e0b"
          ctx.lineWidth = 3
          ctx.strokeRect(
            face.boundingBox.x,
            face.boundingBox.y,
            face.boundingBox.width,
            face.boundingBox.height
          )

          if (showConfidence) {
            ctx.fillStyle = "#f59e0b"
            ctx.font = "14px Inter, sans-serif"
            const text = `Face (${Math.round(face.confidence * 100)}%)`
            const textWidth = ctx.measureText(text).width

            ctx.fillRect(
              face.boundingBox.x,
              face.boundingBox.y - 25,
              textWidth + 10,
              25
            )
            ctx.fillStyle = "white"
            ctx.fillText(text, face.boundingBox.x + 5, face.boundingBox.y - 8)
          }

          // Draw landmarks if available
          if (face.landmarks) {
            ctx.fillStyle = "#f59e0b"
            face.landmarks.forEach((landmark) => {
              ctx.beginPath()
              ctx.arc(landmark.x, landmark.y, 2, 0, 2 * Math.PI)
              ctx.fill()
            })
          }
        })
    }
  }, [
    imageRef,
    results,
    showBoundingBoxes,
    showConfidence,
    minConfidence,
    selectedTypes,
  ])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        width: imageRef.current?.offsetWidth || "100%",
        height: imageRef.current?.offsetHeight || "100%",
      }}
    />
  )
}

// Results panel component
interface ResultsPanelProps {
  results: VisionResults | null
  isAnalyzing: boolean
  onExport: (format: "json" | "pdf") => void
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  results,
  isAnalyzing,
  onExport,
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportResults = (format: "json" | "pdf") => {
    if (!results) return
    onExport(format)
  }

  if (isAnalyzing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Analyzing image...</p>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Eye className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Upload an image to see analysis results
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Export Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analysis Results</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => exportResults("json")}>
              <FileText className="h-4 w-4 mr-2" />
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportResults("pdf")}>
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="objects">Objects</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Scene Description */}
          {results.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Scene Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{results.description}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-6 px-2"
                  onClick={() => copyToClipboard(results.description!)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {results.tags && results.tags.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {results.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag.label} ({Math.round(tag.confidence * 100)}%)
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sentiment */}
          {results.sentiment && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Smile className="h-4 w-4 mr-2" />
                  Sentiment Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Emotion:</span>
                    <Badge>{results.sentiment.emotion}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Confidence:</span>
                    <span className="text-sm">
                      {Math.round(results.sentiment.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="objects" className="space-y-4">
          {results.objects && results.objects.length > 0 ? (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {results.objects.map((obj, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: obj.color || "#3b82f6" }}
                          />
                          <span className="text-sm font-medium">
                            {obj.label}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {Math.round(obj.confidence * 100)}%
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Position: ({obj.x}, {obj.y}) Size: {obj.width}×
                        {obj.height}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No objects detected
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="text" className="space-y-4">
          {results.text && results.text.length > 0 ? (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {results.text.map((textItem, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{textItem.text}</p>
                          <div className="text-xs text-muted-foreground mt-1">
                            Confidence: {Math.round(textItem.confidence * 100)}%
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(textItem.text)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <Type className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No text detected</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {/* Color Palette */}
          {results.colors && results.colors.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Palette className="h-4 w-4 mr-2" />
                  Color Palette
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.colors.map((color, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: color.color }}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{color.color}</div>
                        {color.name && (
                          <div className="text-xs text-muted-foreground">
                            {color.name}
                          </div>
                        )}
                      </div>
                      <div className="text-sm">
                        {color.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Face Detection */}
          {results.faces && results.faces.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Smile className="h-4 w-4 mr-2" />
                  Face Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.faces.map((face, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Face {index + 1}
                        </span>
                        <Badge variant="outline">
                          {Math.round(face.confidence * 100)}%
                        </Badge>
                      </div>
                      {face.age && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Age:</span> ~
                          {face.age}
                        </div>
                      )}
                      {face.gender && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Gender:</span>{" "}
                          {face.gender}
                        </div>
                      )}
                      {face.emotion && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            Emotion:
                          </span>{" "}
                          {face.emotion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {results.metadata && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Image Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dimensions:</span>
                    <span>
                      {results.metadata.width} × {results.metadata.height}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Format:</span>
                    <span>{results.metadata.format.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>
                      {(results.metadata.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Main AI Vision component
export const AIVision = React.forwardRef<HTMLDivElement, AIVisionProps>(
  (
    {
      className,
      onAnalysis,
      capabilities = [
        "object-detection",
        "scene-description",
        "ocr",
        "color-analysis",
        "tagging",
      ],
      maxFileSize = 10 * 1024 * 1024, // 10MB
      acceptedFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"],
      apiEndpoint = "/api/vision",
      apiKey,
      defaultImage,
      enableCamera = true,
      enableUrl = true,
      enableGeneration = false,
      enableEditing = false,
      showConfidence = true,
      minConfidence = 0.5,
      ...props
    },
    ref
  ) => {
    // State
    const [currentImage, setCurrentImage] = React.useState<string | null>(
      defaultImage || null
    )
    const [isAnalyzing, setIsAnalyzing] = React.useState(false)
    const [results, setResults] = React.useState<VisionResults | null>(null)
    const [isDragging, setIsDragging] = React.useState(false)
    const [urlInput, setUrlInput] = React.useState("")
    const [showBoundingBoxes, setShowBoundingBoxes] = React.useState(true)
    const [confidenceThreshold, setConfidenceThreshold] =
      React.useState(minConfidence)
    const [selectedTypes, setSelectedTypes] = React.useState<string[]>([
      "objects",
      "text",
      "faces",
    ])
    const [generationPrompt, setGenerationPrompt] = React.useState("")
    const [isGenerating, setIsGenerating] = React.useState(false)

    // Refs
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const imageRef = React.useRef<HTMLImageElement>(null)
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const [isCameraActive, setIsCameraActive] = React.useState(false)

    // Mock analysis function - replace with actual API call
    const analyzeImage = async (imageData: string): Promise<VisionResults> => {
      setIsAnalyzing(true)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock results - replace with actual API call
      const mockResults: VisionResults = {
        objects: [
          {
            x: 100,
            y: 150,
            width: 200,
            height: 150,
            confidence: 0.95,
            label: "Person",
            color: "#3b82f6",
          },
          {
            x: 350,
            y: 200,
            width: 120,
            height: 80,
            confidence: 0.87,
            label: "Car",
            color: "#ef4444",
          },
        ],
        description:
          "A street scene with a person walking next to a parked car. The image appears to be taken during daytime with good lighting conditions.",
        text: [
          {
            text: "STOP",
            confidence: 0.96,
            boundingBox: {
              x: 50,
              y: 50,
              width: 80,
              height: 30,
              confidence: 0.96,
              label: "STOP",
            },
          },
        ],
        colors: [
          { color: "#2563eb", percentage: 25.3, name: "Blue" },
          { color: "#dc2626", percentage: 18.7, name: "Red" },
          { color: "#16a34a", percentage: 15.2, name: "Green" },
          { color: "#6b7280", percentage: 41.8, name: "Gray" },
        ],
        tags: [
          { label: "outdoor", confidence: 0.98 },
          { label: "street", confidence: 0.92 },
          { label: "urban", confidence: 0.85 },
          { label: "daytime", confidence: 0.89 },
        ],
        faces: [
          {
            boundingBox: {
              x: 120,
              y: 160,
              width: 60,
              height: 80,
              confidence: 0.94,
              label: "Face",
            },
            confidence: 0.94,
            age: 35,
            gender: "male",
            emotion: "neutral",
          },
        ],
        sentiment: {
          emotion: "neutral",
          confidence: 0.76,
          valence: 0.2,
          arousal: 0.1,
        },
        metadata: {
          width: 800,
          height: 600,
          format: "jpeg",
          size: 1024 * 500, // 500KB
        },
      }

      setIsAnalyzing(false)
      return mockResults
    }

    // Handle file upload
    const handleFileUpload = async (files: FileList | null) => {
      if (!files || files.length === 0) return

      const file = files[0]

      // Validate file
      if (!acceptedFormats.includes(file.type)) {
        alert(`Unsupported format. Please use: ${acceptedFormats.join(", ")}`)
        return
      }

      if (file.size > maxFileSize) {
        alert(`File too large. Maximum size: ${maxFileSize / 1024 / 1024}MB`)
        return
      }

      // Create image URL
      const imageUrl = URL.createObjectURL(file)
      setCurrentImage(imageUrl)

      // Analyze image
      try {
        const results = await analyzeImage(imageUrl)
        setResults(results)
        onAnalysis?.(results)
      } catch (error) {
        console.error("Analysis failed:", error)
        alert("Failed to analyze image. Please try again.")
      }
    }

    // Handle URL input
    const handleUrlSubmit = async () => {
      if (!urlInput.trim()) return

      try {
        // Validate URL
        new URL(urlInput)
        setCurrentImage(urlInput)

        const results = await analyzeImage(urlInput)
        setResults(results)
        onAnalysis?.(results)
      } catch (error) {
        alert("Invalid URL or failed to load image")
      }
    }

    // Handle camera capture
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setIsCameraActive(true)
        }
      } catch (error) {
        alert("Failed to access camera")
      }
    }

    const capturePhoto = () => {
      if (!videoRef.current) return

      const canvas = document.createElement("canvas")
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext("2d")
      ctx?.drawImage(video, 0, 0)

      const imageData = canvas.toDataURL("image/jpeg")
      setCurrentImage(imageData)

      // Stop camera
      const stream = video.srcObject as MediaStream
      stream?.getTracks().forEach((track) => track.stop())
      setIsCameraActive(false)

      // Analyze captured image
      analyzeImage(imageData).then((results) => {
        setResults(results)
        onAnalysis?.(results)
      })
    }

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFileUpload(e.dataTransfer.files)
    }

    // Generate image (mock function)
    const generateImage = async () => {
      if (!generationPrompt.trim()) return

      setIsGenerating(true)
      // Simulate generation delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Mock generated image URL
      const generatedUrl = `https://picsum.photos/800/600?random=${Date.now()}`
      setCurrentImage(generatedUrl)
      setIsGenerating(false)

      // Analyze generated image
      const results = await analyzeImage(generatedUrl)
      setResults(results)
      onAnalysis?.(results)
    }

    // Export results
    const exportResults = (format: "json" | "pdf") => {
      if (!results) return

      if (format === "json") {
        const dataStr = JSON.stringify(results, null, 2)
        const dataBlob = new Blob([dataStr], { type: "application/json" })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement("a")
        link.href = url
        link.download = "vision-analysis.json"
        link.click()
        URL.revokeObjectURL(url)
      } else if (format === "pdf") {
        // PDF export would require a library like jsPDF
        alert("PDF export not implemented in this demo")
      }
    }

    return (
      <div
        ref={ref}
        className={cn("flex flex-col h-full", className)}
        {...props}
      >
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">AI Vision</h2>
              <p className="text-sm text-muted-foreground">
                Analyze images with AI-powered computer vision
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="bounding-boxes" className="text-sm">
                Show Overlays
              </Label>
              <Switch
                id="bounding-boxes"
                checked={showBoundingBoxes}
                onCheckedChange={setShowBoundingBoxes}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Input Methods */}
            <div className="border-b p-4">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  {enableUrl && <TabsTrigger value="url">URL</TabsTrigger>}
                  {enableCamera && (
                    <TabsTrigger value="camera">Camera</TabsTrigger>
                  )}
                  {enableGeneration && (
                    <TabsTrigger value="generate">Generate</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="upload" className="mt-4">
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      isDragging
                        ? "border-primary bg-primary/10"
                        : "border-muted-foreground/25",
                      "hover:border-primary/50"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-medium mb-2">
                      Drop an image here or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports:{" "}
                      {acceptedFormats.map((f) => f.split("/")[1]).join(", ")}
                      (Max: {maxFileSize / 1024 / 1024}MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={acceptedFormats.join(",")}
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                  </div>
                </TabsContent>

                {enableUrl && (
                  <TabsContent value="url" className="mt-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter image URL..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleUrlSubmit()
                        }
                      />
                      <Button
                        onClick={handleUrlSubmit}
                        disabled={!urlInput.trim()}
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>
                )}

                {enableCamera && (
                  <TabsContent value="camera" className="mt-4">
                    <div className="space-y-4">
                      {!isCameraActive ? (
                        <Button onClick={startCamera} className="w-full">
                          <Camera className="h-4 w-4 mr-2" />
                          Start Camera
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full rounded-lg border"
                          />
                          <Button onClick={capturePhoto} className="w-full">
                            Capture Photo
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}

                {enableGeneration && (
                  <TabsContent value="generate" className="mt-4">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Describe the image you want to generate..."
                        value={generationPrompt}
                        onChange={(e) => setGenerationPrompt(e.target.value)}
                        className="min-h-20"
                      />
                      <Button
                        onClick={generateImage}
                        disabled={!generationPrompt.trim() || isGenerating}
                        className="w-full"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          "Generate Image"
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>

            {/* Image Display */}
            <div className="flex-1 p-4">
              {currentImage ? (
                <div className="relative h-full border rounded-lg overflow-hidden">
                  <img
                    ref={imageRef}
                    src={currentImage}
                    alt="Analysis target"
                    className="w-full h-full object-contain"
                    onLoad={() => {
                      // Trigger canvas redraw when image loads
                      if (results) {
                        // Force re-render of canvas overlay
                        setShowBoundingBoxes((prev) => !prev)
                        setTimeout(() => setShowBoundingBoxes(true), 10)
                      }
                    }}
                  />
                  {results && showBoundingBoxes && (
                    <CanvasOverlay
                      imageRef={imageRef}
                      results={results}
                      showBoundingBoxes={showBoundingBoxes}
                      showConfidence={showConfidence}
                      minConfidence={confidenceThreshold}
                      selectedTypes={selectedTypes}
                    />
                  )}
                </div>
              ) : (
                <div className="h-full border-2 border-dashed rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">
                      No image selected
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Upload an image to start analysis
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Sidebar */}
          <div className="w-96 border-l flex flex-col">
            <div className="p-4 border-b">
              <div className="space-y-4">
                {/* Confidence Threshold */}
                <div className="space-y-2">
                  <Label className="text-sm">
                    Confidence Threshold:{" "}
                    {Math.round(confidenceThreshold * 100)}%
                  </Label>
                  <Slider
                    value={[confidenceThreshold]}
                    onValueChange={([value]) => setConfidenceThreshold(value)}
                    max={1}
                    min={0}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                {/* Detection Types */}
                <div className="space-y-2">
                  <Label className="text-sm">Show Detection Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "objects", label: "Objects", icon: Target },
                      { key: "text", label: "Text", icon: Type },
                      { key: "faces", label: "Faces", icon: Smile },
                    ].map(({ key, label, icon: Icon }) => (
                      <Button
                        key={key}
                        variant={
                          selectedTypes.includes(key) ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          setSelectedTypes((prev) =>
                            prev.includes(key)
                              ? prev.filter((t) => t !== key)
                              : [...prev, key]
                          )
                        }}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <ResultsPanel
                  results={results}
                  isAnalyzing={isAnalyzing}
                  onExport={exportResults}
                />
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

AIVision.displayName = "AIVision"

export { AIVision }
