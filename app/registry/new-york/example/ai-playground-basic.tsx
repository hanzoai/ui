import { AIPlayground } from "@/registry/default/ui/ai-playground"

export default function AIPlaygroundBasicExample() {
  return (
    <div className="flex justify-center p-4">
      <AIPlayground
        showSettings={false}
        defaultModel="gpt-3.5-turbo"
        defaultSystemPrompt="You are a friendly assistant."
      />
    </div>
  )
}
