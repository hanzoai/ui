import { Registry } from "@/registry/schema"

export const ai: Registry = [
  {
    name: "ai-playground",
    type: "components:ai",
    dependencies: ["@hanzo/ui"],
    files: ["ui/ai-playground.tsx"],
    description:
      "Interactive AI model testing environment with adjustable parameters",
  },
  {
    name: "ai-chat",
    type: "components:ai",
    dependencies: ["@hanzo/ui"],
    files: ["ui/ai-chat.tsx"],
    description: "Complete chat interface with streaming support",
  },
  {
    name: "ai-agents",
    type: "components:ai",
    dependencies: ["@hanzo/ui"],
    files: ["ui/ai-agents.tsx"],
    description: "Multi-agent system components",
  },
  {
    name: "ai-vision",
    type: "components:ai",
    dependencies: ["@hanzo/ui"],
    files: ["ui/ai-vision.tsx"],
    description: "Image analysis and computer vision components",
  },
  {
    name: "ai-voice",
    type: "components:ai",
    dependencies: ["@hanzo/ui"],
    files: ["ui/ai-voice.tsx"],
    description: "Voice recognition and speech synthesis components",
  },
  {
    name: "ai-code",
    type: "components:ai",
    dependencies: ["@hanzo/ui"],
    files: ["ui/ai-code.tsx"],
    description: "AI-powered code generation and analysis",
  },
  {
    name: "ai-assistant",
    type: "components:ai",
    dependencies: ["@hanzo/ui"],
    files: ["ui/ai-assistant.tsx"],
    description: "Full-featured AI assistant component",
  },
  {
    name: "ai-tools",
    type: "components:ai",
    dependencies: ["@hanzo/ui"],
    files: ["ui/ai-tools.tsx"],
    description: "Tool use and function calling interfaces",
  },
]
