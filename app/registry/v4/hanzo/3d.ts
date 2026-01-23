/**
 * Hanzo UI - 3D Components Registry
 *
 * 3D and WebGL components using Three.js and React Three Fiber.
 * These are Hanzo-exclusive extensions for immersive experiences.
 */

import { type Registry, type RegistryItem } from "../schema"

const threeD: RegistryItem[] = [
  {
    name: "3d-button",
    type: "registry:3d",
    title: "3D Button",
    description: "Interactive 3D button with depth effects",
    dependencies: ["@hanzo/ui", "motion", "three"],
    files: [{ path: "3d/3d-button.tsx", type: "registry:3d" }],
    category: "3d",
    subcategory: "interactive",
  },
  {
    name: "3d-card",
    type: "registry:3d",
    title: "3D Card",
    description: "Card with 3D tilt effect on hover",
    dependencies: ["@hanzo/ui", "motion"],
    files: [{ path: "3d/3d-card.tsx", type: "registry:3d" }],
    category: "3d",
    subcategory: "interactive",
  },
  {
    name: "3d-carousel",
    type: "registry:3d",
    title: "3D Carousel",
    description: "3D carousel with perspective rotation",
    dependencies: ["@hanzo/ui", "motion", "three"],
    files: [{ path: "3d/3d-carousel.tsx", type: "registry:3d" }],
    category: "3d",
    subcategory: "layout",
  },
  {
    name: "3d-grid",
    type: "registry:3d",
    title: "3D Grid",
    description: "Interactive 3D grid layout",
    dependencies: ["@hanzo/ui", "motion", "three"],
    files: [{ path: "3d/3d-grid.tsx", type: "registry:3d" }],
    category: "3d",
    subcategory: "layout",
  },
  {
    name: "3d-model-viewer",
    type: "registry:3d",
    title: "3D Model Viewer",
    description: "3D model viewer with orbit controls and lighting",
    dependencies: ["@hanzo/ui", "three", "@react-three/fiber", "@react-three/drei"],
    files: [{ path: "3d/3d-model-viewer.tsx", type: "registry:3d" }],
    category: "3d",
    subcategory: "viewer",
  },
  {
    name: "3d-scene",
    type: "registry:3d",
    title: "3D Scene",
    description: "Complete 3D scene with canvas, camera, and lighting",
    dependencies: ["@hanzo/ui", "three", "@react-three/fiber", "@react-three/drei"],
    files: [{ path: "3d/3d-scene.tsx", type: "registry:3d" }],
    category: "3d",
    subcategory: "viewer",
  },
  {
    name: "3d-text",
    type: "registry:3d",
    title: "3D Text",
    description: "3D text with depth and lighting effects",
    dependencies: ["@hanzo/ui", "motion", "three", "@react-three/drei"],
    files: [{ path: "3d/3d-text.tsx", type: "registry:3d" }],
    category: "3d",
    subcategory: "typography",
  },
  {
    name: "3d-globe",
    type: "registry:3d",
    title: "3D Globe",
    description: "Interactive 3D globe with markers and connections",
    dependencies: ["@hanzo/ui", "three", "@react-three/fiber", "@react-three/drei"],
    files: [{ path: "3d/3d-globe.tsx", type: "registry:3d" }],
    category: "3d",
    subcategory: "visualization",
  },
  {
    name: "3d-particles",
    type: "registry:3d",
    title: "3D Particles",
    description: "WebGL particle system with physics",
    dependencies: ["@hanzo/ui", "three", "@react-three/fiber"],
    files: [{ path: "3d/3d-particles.tsx", type: "registry:3d" }],
    category: "3d",
    subcategory: "effects",
  },
  {
    name: "3d-background",
    type: "registry:3d",
    title: "3D Background",
    description: "Animated 3D background with shaders",
    dependencies: ["@hanzo/ui", "three", "@react-three/fiber"],
    files: [{ path: "3d/3d-background.tsx", type: "registry:3d" }],
    category: "3d",
    subcategory: "effects",
  },
]

export const hanzo3DRegistry: Registry = {
  name: "hanzo/ui/3d",
  homepage: "https://ui.hanzo.ai/3d",
  items: threeD,
}
