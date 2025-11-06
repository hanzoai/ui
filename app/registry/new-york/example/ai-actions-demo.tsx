import { AIActions } from "@/registry/new-york/ui/ai-actions"

const actions = [
  {
    id: "summarize",
    label: "Summarize",
    description: "Create a concise summary",
    icon: <span>📝</span>,
  },
  {
    id: "translate",
    label: "Translate",
    description: "Translate to another language",
    icon: <span>🌐</span>,
  },
  {
    id: "improve",
    label: "Improve Writing",
    description: "Enhance grammar and style",
    icon: <span>✨</span>,
  },
  {
    id: "explain",
    label: "Explain",
    description: "Break down complex topics",
    icon: <span>💡</span>,
  },
]

export default function AiActionsDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <AIActions actions={actions} />
    </div>
  )
}
