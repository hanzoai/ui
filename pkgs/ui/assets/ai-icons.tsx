// AI provider icon implementations
import React from 'react';
import { cn } from '../src/utils';
import { BrainIcon, ServerIcon, BotIcon, SparklesIcon, CpuIcon, ZapIcon, RocketIcon, ActivityIcon, NetworkIcon } from 'lucide-react';

// Simple placeholder icons for AI providers - replace with actual brand icons when available
export const AnthropicIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <BrainIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
AnthropicIcon.displayName = 'AnthropicIcon';

export const AyaCohereIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <SparklesIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
AyaCohereIcon.displayName = 'AyaCohereIcon';

export const DeepSeekIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <CpuIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
DeepSeekIcon.displayName = 'DeepSeekIcon';

export const ExoIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <ServerIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
ExoIcon.displayName = 'ExoIcon';

export const GeminiIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <SparklesIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
GeminiIcon.displayName = 'GeminiIcon';

export const GoogleIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <svg ref={ref} className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    </svg>
  )
);
GoogleIcon.displayName = 'GoogleIcon';

export const GrokIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <ZapIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
GrokIcon.displayName = 'GrokIcon';

export const GroqIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <RocketIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
GroqIcon.displayName = 'GroqIcon';

export const LmStudioIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <ServerIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
LmStudioIcon.displayName = 'LmStudioIcon';

export const MetaIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <svg ref={ref} className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8z"/>
    </svg>
  )
);
MetaIcon.displayName = 'MetaIcon';

export const MistralIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <ActivityIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
MistralIcon.displayName = 'MistralIcon';

export const OllamaIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <ServerIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
OllamaIcon.displayName = 'OllamaIcon';

export const OpenAIIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <BotIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
OpenAIIcon.displayName = 'OpenAIIcon';

export const OpenRouterIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <NetworkIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
OpenRouterIcon.displayName = 'OpenRouterIcon';

export const PerplexityIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <SparklesIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
PerplexityIcon.displayName = 'PerplexityIcon';

export const QwenIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <CpuIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
QwenIcon.displayName = 'QwenIcon';

export const HanzoIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <svg ref={ref} className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
    </svg>
  )
);
HanzoIcon.displayName = 'HanzoIcon';

export const TogetherAI = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <NetworkIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
TogetherAI.displayName = 'TogetherAI';

// Generic AI icon for providers without specific icons
export const AisIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <BrainIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
AisIcon.displayName = 'AisIcon';

// Also export the ScheduledTasksIcon and SendIcon that might be needed
export const ScheduledTasksIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <ActivityIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
ScheduledTasksIcon.displayName = 'ScheduledTasksIcon';

export const SendIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <svg ref={ref} className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  )
);
SendIcon.displayName = 'SendIcon';

export const ReactJsIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <svg ref={ref} className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
      <circle cx="12" cy="6" r="2" fill="currentColor"/>
      <circle cx="18" cy="15" r="2" fill="currentColor"/>
      <circle cx="6" cy="15" r="2" fill="currentColor"/>
      <path d="M12 12 L12 6 M12 12 L18 15 M12 12 L6 15" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
);
ReactJsIcon.displayName = 'ReactJsIcon';

export const ReasoningIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <BrainIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
ReasoningIcon.displayName = 'ReasoningIcon';

export const ToolsIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <svg ref={ref} className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M14 2l1.5 1.5v5.5L21 9v6l-5.5-.5V21L14 22l-2-7-2 7-1.5-1V14.5L3 15V9l5.5.5V4L10 2h4z"/>
    </svg>
  )
);
ToolsIcon.displayName = 'ToolsIcon';

export const AIAgentIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <BotIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
AIAgentIcon.displayName = 'AIAgentIcon';

export const TracingIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <ActivityIcon ref={ref} className={cn("h-4 w-4", className)} {...props} />
  )
);
TracingIcon.displayName = 'TracingIcon';