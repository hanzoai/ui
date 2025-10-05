"use client"

import * as React from "react"
import {
  Camera,
  Download,
  Eye,
  Move3d,
  Palette,
  RotateCcw,
  Sun,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

interface ModelViewerProps extends React.HTMLAttributes<HTMLDivElement> {
  modelUrl?: string
  width?: number
  height?: number
  autoRotate?: boolean
  autoRotateSpeed?: number
  enableZoom?: boolean
  enablePan?: boolean
  enableRotate?: boolean
  backgroundColor?: string
  showControls?: boolean
  showStats?: boolean
  annotations?: Annotation[]
  onModelLoad?: (model: any) => void
  onModelError?: (error: string) => void
  onAnnotationClick?: (annotation: Annotation) => void
  className?: string
}

interface Annotation {
  id: string
  position: { x: number; y: number; z: number }
  title: string
  description?: string
  visible?: boolean
}

interface ModelStats {
  vertices: number
  faces: number
  materials: number
  textures: number
  size: string
}

// Mock 3D model renderer since we don't have Three.js available
class ModelRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private model: any = null
  private camera = {
    rotation: { x: 0, y: 0 },
    zoom: 1,
    position: { x: 0, y: 0 },
  }
  private autoRotate = false
  private autoRotateSpeed = 1
  private animationFrame: number | null = null
  private isDragging = false
  private lastMousePosition = { x: 0, y: 0 }
  private annotations: Annotation[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not get 2D context")
    this.ctx = ctx

    this.setupEventListeners()
  }

  private setupEventListeners() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this))
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this))
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this))
    this.canvas.addEventListener("wheel", this.handleWheel.bind(this))
    this.canvas.addEventListener("click", this.handleClick.bind(this))
  }

  private handleMouseDown(e: MouseEvent) {
    this.isDragging = true
    this.lastMousePosition = { x: e.clientX, y: e.clientY }
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.isDragging) {
      const deltaX = e.clientX - this.lastMousePosition.x
      const deltaY = e.clientY - this.lastMousePosition.y

      this.camera.rotation.y += deltaX * 0.01
      this.camera.rotation.x += deltaY * 0.01

      this.lastMousePosition = { x: e.clientX, y: e.clientY }
    }
  }

  private handleMouseUp() {
    this.isDragging = false
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault()
    this.camera.zoom = Math.max(
      0.1,
      Math.min(5, this.camera.zoom + e.deltaY * -0.001)
    )
  }

  private handleClick(e: MouseEvent) {
    // Check for annotation clicks
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Simple hit detection for annotations
    this.annotations.forEach((annotation) => {
      if (annotation.visible) {
        const screenPos = this.worldToScreen(annotation.position)
        const distance = Math.sqrt(
          (x - screenPos.x) ** 2 + (y - screenPos.y) ** 2
        )
        if (distance < 20) {
          // Annotation clicked
          const event = new CustomEvent("annotationClick", {
            detail: annotation,
          })
          this.canvas.dispatchEvent(event)
        }
      }
    })
  }

  private worldToScreen(worldPos: { x: number; y: number; z: number }) {
    // Simple 3D to 2D projection
    const { width, height } = this.canvas
    return {
      x: width / 2 + worldPos.x * 100 * this.camera.zoom,
      y: height / 2 - worldPos.y * 100 * this.camera.zoom,
    }
  }

  private drawModel() {
    if (!this.model) return

    const { width, height } = this.canvas
    const centerX = width / 2
    const centerY = height / 2

    this.ctx.save()
    this.ctx.translate(
      centerX + this.camera.position.x,
      centerY + this.camera.position.y
    )
    this.ctx.scale(this.camera.zoom, this.camera.zoom)

    // Simulate 3D rotation by skewing
    const rotX = this.camera.rotation.x
    const rotY = this.camera.rotation.y

    this.ctx.transform(
      Math.cos(rotY),
      Math.sin(rotY) * Math.sin(rotX),
      0,
      Math.cos(rotX),
      0,
      0
    )

    // Draw a simple 3D-ish model representation
    this.drawCube()

    this.ctx.restore()
  }

  private drawCube() {
    const size = 80

    // Front face
    this.ctx.fillStyle = "#60a5fa"
    this.ctx.fillRect(-size / 2, -size / 2, size, size)
    this.ctx.strokeStyle = "#1e40af"
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(-size / 2, -size / 2, size, size)

    // Top face (isometric)
    this.ctx.fillStyle = "#93c5fd"
    this.ctx.beginPath()
    this.ctx.moveTo(-size / 2, -size / 2)
    this.ctx.lineTo(-size / 4, -size / 2 - size / 4)
    this.ctx.lineTo(size / 4, -size / 2 - size / 4)
    this.ctx.lineTo(size / 2, -size / 2)
    this.ctx.closePath()
    this.ctx.fill()
    this.ctx.stroke()

    // Right face (isometric)
    this.ctx.fillStyle = "#3b82f6"
    this.ctx.beginPath()
    this.ctx.moveTo(size / 2, -size / 2)
    this.ctx.lineTo(size / 4, -size / 2 - size / 4)
    this.ctx.lineTo(size / 4, size / 2 - size / 4)
    this.ctx.lineTo(size / 2, size / 2)
    this.ctx.closePath()
    this.ctx.fill()
    this.ctx.stroke()
  }

  private drawAnnotations() {
    this.annotations.forEach((annotation) => {
      if (!annotation.visible) return

      const screenPos = this.worldToScreen(annotation.position)

      // Draw annotation marker
      this.ctx.fillStyle = "#ef4444"
      this.ctx.beginPath()
      this.ctx.arc(screenPos.x, screenPos.y, 8, 0, Math.PI * 2)
      this.ctx.fill()

      // Draw annotation line
      this.ctx.strokeStyle = "#ef4444"
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.moveTo(screenPos.x, screenPos.y)
      this.ctx.lineTo(screenPos.x + 20, screenPos.y - 20)
      this.ctx.stroke()

      // Draw annotation label
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
      this.ctx.fillRect(screenPos.x + 22, screenPos.y - 35, 100, 20)
      this.ctx.fillStyle = "white"
      this.ctx.font = "12px Arial"
      this.ctx.fillText(annotation.title, screenPos.x + 25, screenPos.y - 22)
    })
  }

  private render() {
    const { width, height } = this.canvas

    // Clear canvas
    this.ctx.fillStyle = "#f8fafc"
    this.ctx.fillRect(0, 0, width, height)

    if (this.autoRotate) {
      this.camera.rotation.y += this.autoRotateSpeed * 0.01
    }

    this.drawModel()
    this.drawAnnotations()
  }

  loadModel(url: string): Promise<ModelStats> {
    return new Promise((resolve, reject) => {
      // Simulate model loading
      setTimeout(() => {
        if (url) {
          this.model = { loaded: true, url }
          resolve({
            vertices: 8,
            faces: 12,
            materials: 1,
            textures: 0,
            size: "2.4 KB",
          })
        } else {
          reject("Invalid model URL")
        }
      }, 1000)
    })
  }

  setAutoRotate(enabled: boolean, speed = 1) {
    this.autoRotate = enabled
    this.autoRotateSpeed = speed
  }

  setAnnotations(annotations: Annotation[]) {
    this.annotations = annotations
  }

  resetCamera() {
    this.camera = {
      rotation: { x: 0, y: 0 },
      zoom: 1,
      position: { x: 0, y: 0 },
    }
  }

  zoomIn() {
    this.camera.zoom = Math.min(5, this.camera.zoom * 1.2)
  }

  zoomOut() {
    this.camera.zoom = Math.max(0.1, this.camera.zoom / 1.2)
  }

  takeScreenshot(): string {
    return this.canvas.toDataURL("image/png")
  }

  startAnimation() {
    const animate = () => {
      this.render()
      this.animationFrame = requestAnimationFrame(animate)
    }
    animate()
  }

  stopAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  destroy() {
    this.stopAnimation()
  }
}

const ModelViewer3D = React.forwardRef<HTMLDivElement, ModelViewerProps>(
  (
    {
      modelUrl,
      width = 800,
      height = 600,
      autoRotate = false,
      autoRotateSpeed = 1,
      enableZoom = true,
      enablePan = true,
      enableRotate = true,
      backgroundColor = "#f8fafc",
      showControls = true,
      showStats = false,
      annotations = [],
      onModelLoad,
      onModelError,
      onAnnotationClick,
      className,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const rendererRef = React.useRef<ModelRenderer | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)
    const [modelStats, setModelStats] = React.useState<ModelStats | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [currentAutoRotate, setCurrentAutoRotate] = React.useState(autoRotate)

    // Initialize renderer
    React.useEffect(() => {
      if (!canvasRef.current) return

      const renderer = new ModelRenderer(canvasRef.current)
      rendererRef.current = renderer

      renderer.startAnimation()

      // Listen for annotation clicks
      canvasRef.current.addEventListener("annotationClick", (e: any) => {
        onAnnotationClick?.(e.detail)
      })

      return () => {
        renderer.destroy()
      }
    }, [onAnnotationClick])

    // Load model
    React.useEffect(() => {
      if (!rendererRef.current || !modelUrl) return

      setIsLoading(true)
      setError(null)

      rendererRef.current
        .loadModel(modelUrl)
        .then((stats) => {
          setModelStats(stats)
          setIsLoading(false)
          onModelLoad?.(stats)
        })
        .catch((err) => {
          setError(err)
          setIsLoading(false)
          onModelError?.(err)
        })
    }, [modelUrl, onModelLoad, onModelError])

    // Update auto rotate
    React.useEffect(() => {
      if (rendererRef.current) {
        rendererRef.current.setAutoRotate(currentAutoRotate, autoRotateSpeed)
      }
    }, [currentAutoRotate, autoRotateSpeed])

    // Update annotations
    React.useEffect(() => {
      if (rendererRef.current) {
        rendererRef.current.setAnnotations(annotations)
      }
    }, [annotations])

    const handleResetCamera = () => {
      rendererRef.current?.resetCamera()
    }

    const handleZoomIn = () => {
      rendererRef.current?.zoomIn()
    }

    const handleZoomOut = () => {
      rendererRef.current?.zoomOut()
    }

    const handleToggleAutoRotate = () => {
      setCurrentAutoRotate((prev) => !prev)
    }

    const handleScreenshot = () => {
      if (!rendererRef.current) return

      const dataURL = rendererRef.current.takeScreenshot()
      const link = document.createElement("a")
      link.download = "model-screenshot.png"
      link.href = dataURL
      link.click()
    }

    React.useImperativeHandle(ref, () => containerRef.current!)

    return (
      <div
        ref={containerRef}
        className={cn("relative border rounded-lg overflow-hidden", className)}
        style={{ width, height }}
        {...props}
      >
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ backgroundColor }}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading model...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Controls */}
        {showControls && !isLoading && !error && (
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleResetCamera}
              title="Reset camera"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            {enableZoom && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomIn}
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomOut}
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleAutoRotate}
              title="Toggle auto rotate"
              className={
                currentAutoRotate ? "bg-primary text-primary-foreground" : ""
              }
            >
              <Move3d className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleScreenshot}
              title="Take screenshot"
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Stats panel */}
        {showStats && modelStats && !isLoading && !error && (
          <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-background/80 backdrop-blur-sm border">
            <h4 className="font-semibold text-sm mb-2">Model Stats</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Vertices: {modelStats.vertices.toLocaleString()}</div>
              <div>Faces: {modelStats.faces.toLocaleString()}</div>
              <div>Materials: {modelStats.materials}</div>
              <div>Textures: {modelStats.textures}</div>
              <div>Size: {modelStats.size}</div>
            </div>
          </div>
        )}

        {/* Annotations panel */}
        {annotations.length > 0 && (
          <div className="absolute bottom-4 right-4 max-w-xs">
            <div className="p-3 rounded-lg bg-background/80 backdrop-blur-sm border">
              <h4 className="font-semibold text-sm mb-2">Annotations</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {annotations.map((annotation) => (
                  <button
                    key={annotation.id}
                    className="w-full text-left p-2 rounded text-xs border hover:bg-accent"
                    onClick={() => onAnnotationClick?.(annotation)}
                  >
                    <div className="font-medium">{annotation.title}</div>
                    {annotation.description && (
                      <div className="text-muted-foreground line-clamp-2">
                        {annotation.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isLoading && !error && !modelUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Eye className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No model loaded</p>
              <p className="text-xs text-muted-foreground">
                Provide a modelUrl to view a 3D model
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }
)
ModelViewer3D.displayName = "ModelViewer3D"

// Preset configurations
const ModelViewer3DPreset = {
  Basic: React.forwardRef<
    HTMLDivElement,
    Omit<ModelViewerProps, "showControls" | "showStats">
  >((props, ref) => (
    <ModelViewer3D
      ref={ref}
      showControls
      showStats={false}
      autoRotate
      autoRotateSpeed={0.5}
      {...props}
    />
  )),

  Advanced: React.forwardRef<
    HTMLDivElement,
    Omit<ModelViewerProps, "showControls" | "showStats">
  >((props, ref) => (
    <ModelViewer3D
      ref={ref}
      showControls
      showStats
      enableZoom
      enablePan
      enableRotate
      {...props}
    />
  )),

  Presentation: React.forwardRef<
    HTMLDivElement,
    Omit<ModelViewerProps, "showControls" | "autoRotate">
  >((props, ref) => (
    <ModelViewer3D
      ref={ref}
      showControls={false}
      autoRotate
      autoRotateSpeed={1}
      backgroundColor="#000000"
      {...props}
    />
  )),
}

// Assign display names
ModelViewer3DPreset.Basic.displayName = "ModelViewer3DPreset.Basic"
ModelViewer3DPreset.Advanced.displayName = "ModelViewer3DPreset.Advanced"
ModelViewer3DPreset.Presentation.displayName =
  "ModelViewer3DPreset.Presentation"

export {
  ModelViewer3D,
  ModelViewer3DPreset,
  type ModelViewerProps,
  type Annotation,
  type ModelStats,
}
