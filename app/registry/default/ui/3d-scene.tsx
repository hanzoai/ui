"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Basic types for 3D primitives
interface Vector3 {
  x: number
  y: number
  z: number
}

interface Color {
  r: number
  g: number
  b: number
  a?: number
}

interface Material {
  color: Color
  emissive?: Color
  metalness?: number
  roughness?: number
  opacity?: number
}

interface Light {
  type: "directional" | "point" | "ambient"
  position?: Vector3
  direction?: Vector3
  color: Color
  intensity: number
}

interface Camera {
  position: Vector3
  target: Vector3
  fov: number
  near: number
  far: number
}

interface Geometry {
  type: "box" | "sphere" | "plane" | "cylinder" | "torus"
  parameters: Record<string, number>
}

interface Mesh {
  id: string
  geometry: Geometry
  material: Material
  position: Vector3
  rotation: Vector3
  scale: Vector3
  visible?: boolean
}

interface Scene3DProps extends React.HTMLAttributes<HTMLCanvasElement> {
  width?: number
  height?: number
  meshes?: Mesh[]
  lights?: Light[]
  camera?: Camera
  backgroundColor?: Color
  enableOrbitControls?: boolean
  enableAutoRotate?: boolean
  autoRotateSpeed?: number
  onMeshClick?: (mesh: Mesh) => void
  onMeshHover?: (mesh: Mesh | null) => void
  className?: string
}

// Simple software renderer for basic shapes
class SimpleRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private camera: Camera
  private meshes: Mesh[] = []
  private lights: Light[] = []
  private backgroundColor: Color = { r: 0.1, g: 0.1, b: 0.1, a: 1 }
  private animationFrame: number | null = null
  private mousePosition = { x: 0, y: 0 }
  private isDragging = false
  private lastMousePosition = { x: 0, y: 0 }
  private cameraRotation = { x: 0, y: 0 }
  private autoRotate = false
  private autoRotateSpeed = 1

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not get 2D context")
    this.ctx = ctx

    this.camera = {
      position: { x: 0, y: 0, z: 5 },
      target: { x: 0, y: 0, z: 0 },
      fov: 75,
      near: 0.1,
      far: 1000,
    }

    this.setupEventListeners()
  }

  private setupEventListeners() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this))
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this))
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this))
    this.canvas.addEventListener("wheel", this.handleWheel.bind(this))
  }

  private handleMouseDown(e: MouseEvent) {
    this.isDragging = true
    this.lastMousePosition = { x: e.clientX, y: e.clientY }
  }

  private handleMouseMove(e: MouseEvent) {
    this.mousePosition = { x: e.clientX, y: e.clientY }

    if (this.isDragging) {
      const deltaX = e.clientX - this.lastMousePosition.x
      const deltaY = e.clientY - this.lastMousePosition.y

      this.cameraRotation.y += deltaX * 0.01
      this.cameraRotation.x += deltaY * 0.01

      this.cameraRotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, this.cameraRotation.x)
      )

      this.updateCameraPosition()
      this.lastMousePosition = { x: e.clientX, y: e.clientY }
    }
  }

  private handleMouseUp() {
    this.isDragging = false
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault()
    const distance = Math.sqrt(
      this.camera.position.x ** 2 +
        this.camera.position.y ** 2 +
        this.camera.position.z ** 2
    )
    const newDistance = Math.max(1, Math.min(20, distance + e.deltaY * 0.01))

    const factor = newDistance / distance
    this.camera.position.x *= factor
    this.camera.position.y *= factor
    this.camera.position.z *= factor
  }

  private updateCameraPosition() {
    const distance = 5
    this.camera.position.x =
      distance *
      Math.sin(this.cameraRotation.y) *
      Math.cos(this.cameraRotation.x)
    this.camera.position.y = distance * Math.sin(this.cameraRotation.x)
    this.camera.position.z =
      distance *
      Math.cos(this.cameraRotation.y) *
      Math.cos(this.cameraRotation.x)
  }

  private project(point: Vector3): { x: number; y: number; z: number } {
    const { width, height } = this.canvas

    // Simple perspective projection
    const dx = point.x - this.camera.position.x
    const dy = point.y - this.camera.position.y
    const dz = point.z - this.camera.position.z

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const scale =
      (this.camera.far - this.camera.near) / (distance + this.camera.near)

    return {
      x: width / 2 + (dx * scale * width) / 4,
      y: height / 2 - (dy * scale * height) / 4,
      z: distance,
    }
  }

  private drawMesh(mesh: Mesh) {
    if (!mesh.visible) return

    const { geometry, material, position, rotation, scale } = mesh
    this.ctx.save()

    // Apply transformations
    const projected = this.project(position)

    this.ctx.translate(projected.x, projected.y)
    this.ctx.scale(scale.x, scale.y)
    this.ctx.rotate(rotation.z)

    // Set material properties
    this.ctx.fillStyle = `rgba(${Math.floor(material.color.r * 255)}, ${Math.floor(material.color.g * 255)}, ${Math.floor(material.color.b * 255)}, ${material.opacity || 1})`
    this.ctx.strokeStyle = this.ctx.fillStyle

    // Draw based on geometry type
    switch (geometry.type) {
      case "box":
        this.drawBox(geometry.parameters)
        break
      case "sphere":
        this.drawSphere(geometry.parameters)
        break
      case "plane":
        this.drawPlane(geometry.parameters)
        break
      case "cylinder":
        this.drawCylinder(geometry.parameters)
        break
      case "torus":
        this.drawTorus(geometry.parameters)
        break
    }

    this.ctx.restore()
  }

  private drawBox(params: Record<string, number>) {
    const width = params.width || 1
    const height = params.height || 1

    this.ctx.fillRect(-width / 2, -height / 2, width, height)
    this.ctx.strokeRect(-width / 2, -height / 2, width, height)
  }

  private drawSphere(params: Record<string, number>) {
    const radius = params.radius || 0.5

    this.ctx.beginPath()
    this.ctx.arc(0, 0, radius * 50, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.stroke()
  }

  private drawPlane(params: Record<string, number>) {
    const width = params.width || 1
    const height = params.height || 1

    this.ctx.fillRect(-width / 2, -height / 2, width, height)
  }

  private drawCylinder(params: Record<string, number>) {
    const radius = params.radius || 0.5
    const height = params.height || 1

    // Draw as rectangle with rounded ends
    this.ctx.fillRect(-radius * 50, -height * 25, radius * 100, height * 50)

    this.ctx.beginPath()
    this.ctx.arc(-radius * 50, 0, height * 25, Math.PI / 2, -Math.PI / 2)
    this.ctx.arc(radius * 50, 0, height * 25, -Math.PI / 2, Math.PI / 2)
    this.ctx.fill()
  }

  private drawTorus(params: Record<string, number>) {
    const radius = params.radius || 0.5
    const tube = params.tube || 0.2

    this.ctx.beginPath()
    this.ctx.arc(0, 0, radius * 50, 0, Math.PI * 2)
    this.ctx.lineWidth = tube * 50
    this.ctx.stroke()
    this.ctx.lineWidth = 1
  }

  private clear() {
    const { width, height } = this.canvas
    this.ctx.fillStyle = `rgba(${Math.floor(this.backgroundColor.r * 255)}, ${Math.floor(this.backgroundColor.g * 255)}, ${Math.floor(this.backgroundColor.b * 255)}, ${this.backgroundColor.a || 1})`
    this.ctx.fillRect(0, 0, width, height)
  }

  setCamera(camera: Camera) {
    this.camera = { ...camera }
  }

  setMeshes(meshes: Mesh[]) {
    this.meshes = [...meshes]
  }

  setLights(lights: Light[]) {
    this.lights = [...lights]
  }

  setBackgroundColor(color: Color) {
    this.backgroundColor = { ...color }
  }

  setAutoRotate(enabled: boolean, speed = 1) {
    this.autoRotate = enabled
    this.autoRotateSpeed = speed
  }

  render() {
    this.clear()

    if (this.autoRotate) {
      this.cameraRotation.y += this.autoRotateSpeed * 0.01
      this.updateCameraPosition()
    }

    // Sort meshes by distance (simple depth sorting)
    const sortedMeshes = [...this.meshes].sort((a, b) => {
      const distA = Math.sqrt(
        (a.position.x - this.camera.position.x) ** 2 +
          (a.position.y - this.camera.position.y) ** 2 +
          (a.position.z - this.camera.position.z) ** 2
      )
      const distB = Math.sqrt(
        (b.position.x - this.camera.position.x) ** 2 +
          (b.position.y - this.camera.position.y) ** 2 +
          (b.position.z - this.camera.position.z) ** 2
      )
      return distB - distA
    })

    sortedMeshes.forEach((mesh) => this.drawMesh(mesh))
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

const Scene3D = React.forwardRef<HTMLCanvasElement, Scene3DProps>(
  (
    {
      width = 800,
      height = 600,
      meshes = [],
      lights = [],
      camera,
      backgroundColor = { r: 0.1, g: 0.1, b: 0.1, a: 1 },
      enableOrbitControls = true,
      enableAutoRotate = false,
      autoRotateSpeed = 1,
      onMeshClick,
      onMeshHover,
      className,
      ...props
    },
    ref
  ) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const rendererRef = React.useRef<SimpleRenderer | null>(null)

    // Initialize renderer
    React.useEffect(() => {
      if (!canvasRef.current) return

      const renderer = new SimpleRenderer(canvasRef.current)
      rendererRef.current = renderer

      renderer.startAnimation()

      return () => {
        renderer.destroy()
      }
    }, [])

    // Update camera
    React.useEffect(() => {
      if (rendererRef.current && camera) {
        rendererRef.current.setCamera(camera)
      }
    }, [camera])

    // Update meshes
    React.useEffect(() => {
      if (rendererRef.current) {
        rendererRef.current.setMeshes(meshes)
      }
    }, [meshes])

    // Update lights
    React.useEffect(() => {
      if (rendererRef.current) {
        rendererRef.current.setLights(lights)
      }
    }, [lights])

    // Update background color
    React.useEffect(() => {
      if (rendererRef.current) {
        rendererRef.current.setBackgroundColor(backgroundColor)
      }
    }, [backgroundColor])

    // Update auto rotate
    React.useEffect(() => {
      if (rendererRef.current) {
        rendererRef.current.setAutoRotate(enableAutoRotate, autoRotateSpeed)
      }
    }, [enableAutoRotate, autoRotateSpeed])

    // Update canvas size
    React.useEffect(() => {
      if (canvasRef.current) {
        canvasRef.current.width = width
        canvasRef.current.height = height
      }
    }, [width, height])

    React.useImperativeHandle(ref, () => canvasRef.current!)

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={cn(
          "border rounded-lg bg-black/5 cursor-grab active:cursor-grabbing",
          className
        )}
        {...props}
      />
    )
  }
)
Scene3D.displayName = "Scene3D"

// Helper functions to create common geometries
const createBox = (width = 1, height = 1, depth = 1): Geometry => ({
  type: "box",
  parameters: { width, height, depth },
})

const createSphere = (radius = 0.5): Geometry => ({
  type: "sphere",
  parameters: { radius },
})

const createPlane = (width = 1, height = 1): Geometry => ({
  type: "plane",
  parameters: { width, height },
})

const createCylinder = (radius = 0.5, height = 1): Geometry => ({
  type: "cylinder",
  parameters: { radius, height },
})

const createTorus = (radius = 0.5, tube = 0.2): Geometry => ({
  type: "torus",
  parameters: { radius, tube },
})

// Helper functions to create materials
const createMaterial = (
  color: Color,
  options: Partial<Material> = {}
): Material => ({
  color,
  metalness: 0,
  roughness: 0.5,
  opacity: 1,
  ...options,
})

// Helper functions to create lights
const createDirectionalLight = (
  direction: Vector3,
  color: Color = { r: 1, g: 1, b: 1 },
  intensity = 1
): Light => ({
  type: "directional",
  direction,
  color,
  intensity,
})

const createPointLight = (
  position: Vector3,
  color: Color = { r: 1, g: 1, b: 1 },
  intensity = 1
): Light => ({
  type: "point",
  position,
  color,
  intensity,
})

const createAmbientLight = (
  color: Color = { r: 0.2, g: 0.2, b: 0.2 },
  intensity = 0.5
): Light => ({
  type: "ambient",
  color,
  intensity,
})

// Preset scenes
const Scene3DPreset = {
  Basic: React.forwardRef<
    HTMLCanvasElement,
    Omit<Scene3DProps, "meshes" | "lights">
  >((props, ref) => {
    const meshes: Mesh[] = [
      {
        id: "cube",
        geometry: createBox(1, 1, 1),
        material: createMaterial({ r: 0.5, g: 0.7, b: 1 }),
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
      },
    ]

    const lights: Light[] = [
      createDirectionalLight({ x: 1, y: 1, z: 1 }),
      createAmbientLight(),
    ]

    return (
      <Scene3D
        ref={ref}
        meshes={meshes}
        lights={lights}
        enableOrbitControls
        {...props}
      />
    )
  }),

  Primitives: React.forwardRef<
    HTMLCanvasElement,
    Omit<Scene3DProps, "meshes" | "lights">
  >((props, ref) => {
    const meshes: Mesh[] = [
      {
        id: "cube",
        geometry: createBox(0.8, 0.8, 0.8),
        material: createMaterial({ r: 1, g: 0.3, b: 0.3 }),
        position: { x: -2, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
      },
      {
        id: "sphere",
        geometry: createSphere(0.5),
        material: createMaterial({ r: 0.3, g: 1, b: 0.3 }),
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
      },
      {
        id: "cylinder",
        geometry: createCylinder(0.4, 1),
        material: createMaterial({ r: 0.3, g: 0.3, b: 1 }),
        position: { x: 2, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
      },
    ]

    const lights: Light[] = [
      createDirectionalLight({ x: 1, y: 1, z: 1 }),
      createAmbientLight({ r: 0.3, g: 0.3, b: 0.3 }, 0.3),
    ]

    return (
      <Scene3D
        ref={ref}
        meshes={meshes}
        lights={lights}
        enableOrbitControls
        enableAutoRotate
        autoRotateSpeed={0.5}
        {...props}
      />
    )
  }),
}

// Assign display names
Scene3DPreset.Basic.displayName = "Scene3DPreset.Basic"
Scene3DPreset.Primitives.displayName = "Scene3DPreset.Primitives"

export {
  Scene3D,
  Scene3DPreset,
  createBox,
  createSphere,
  createPlane,
  createCylinder,
  createTorus,
  createMaterial,
  createDirectionalLight,
  createPointLight,
  createAmbientLight,
  type Scene3DProps,
  type Vector3,
  type Color,
  type Material,
  type Light,
  type Camera,
  type Geometry,
  type Mesh,
}
