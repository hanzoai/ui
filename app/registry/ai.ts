import { Registry } from "@/registry/schema"

export const ai: Registry = [
  {
    name: "ai-playground",
    type: "components:ui",
    dependencies: ["@hanzo/ui"],
    files: ["ai/playground.tsx"],
    description: "Interactive AI model testing environment with adjustable parameters"
  },
  {
    name: "ai-chat",
    type: "components:ui",
    dependencies: ["@hanzo/ui"],
    files: ["ai/chat.tsx"],
    description: "Complete chat interface with streaming support"
  },
  {
    name: "ai-assistant",
    type: "components:ui",
    dependencies: ["@hanzo/ui"],
    files: ["ai/assistant.tsx"],
    description: "Full-featured AI assistant component"
  },
  {
    name: "ai-actions",
    type: "components:ui",
    dependencies: ["@hanzo/ui"],
    files: ["ai/actions.tsx"],
    description: "Pre-built AI action components"
  },
  {
    name: "ai-models",
    type: "components:ui",
    dependencies: ["@hanzo/ui"],
    files: ["ai/models.tsx"],
    description: "Model selection and management interface"
  },
  {
    name: "ai-vision",
    type: "components:ui",
    dependencies: ["@hanzo/ui"],
    files: ["ai/vision.tsx"],
    description: "Image analysis and computer vision components"
  },
  {
    name: "ai-agents",
    type: "components:ui",
    dependencies: ["@hanzo/ui"],
    files: ["ai/agents.tsx"],
    description: "Multi-agent system components"
  },
  {
    name: "ai-tools",
    type: "components:ui",
    dependencies: ["@hanzo/ui"],
    files: ["ai/tools.tsx"],
    description: "Tool use and function calling interfaces"
  }
]