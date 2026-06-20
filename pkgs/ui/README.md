# @hanzo/ui

A comprehensive UI component library for Hanzo applications, built with React and TypeScript.

## Version 4.5.6

## Installation

```bash
npm install @hanzo/ui
# or
pnpm add @hanzo/ui
# or
yarn add @hanzo/ui
```

## Components

### Primitives

Core UI components based on Radix UI primitives:

- **Accordion** - Collapsible content panels
- **Alert** - Informative alert messages
- **AlertDialog** - Modal dialogs for important alerts
- **Avatar** - User avatar display
- **Badge** - Status and label badges
- **Breadcrumb** - Navigation breadcrumbs
- **Button** - Interactive buttons with variants
- **Calendar** - Date picker calendar
- **Card** - Container cards for content
- **Carousel** - Image/content carousel
- **Checkbox** - Checkbox input
- **Collapsible** - Collapsible content sections
- **Combobox** - Searchable select dropdown
- **Command** - Command palette component
- **ContextMenu** - Right-click context menus
- **Dialog** - Modal dialogs
- **Drawer** - Slide-out drawer panels
- **DropdownMenu** - Dropdown menu component
- **Form** - Form components with validation
- **HoverCard** - Hover-triggered info cards
- **Input** - Text input field
- **InputOTP** - One-time password input
- **Label** - Form labels
- **NavigationMenu** - Navigation menu bar
- **Popover** - Popover overlays
- **Progress** - Progress indicators
- **RadioGroup** - Radio button groups
- **ResizablePanel** - Resizable panel layouts
- **ScrollArea** - Custom scrollable areas
- **SearchInput** - Search input with icon
- **Select** - Select dropdown
- **Separator** - Visual separator line
- **Sheet** - Side sheet panels
- **Skeleton** - Loading skeleton screens
- **Slider** - Range slider input
- **Switch** - Toggle switch
- **Table** - Data tables
- **Tabs** - Tabbed interfaces
- **TextArea** - Multi-line text input
- **TextField** - Enhanced text input
- **Toast** - Toast notifications (via Sonner)
- **Toggle** - Toggle buttons
- **ToggleGroup** - Grouped toggle buttons
- **Tooltip** - Hover tooltips
- **VideoPlayer** - Video playback component

### Assets

Icon components and visual assets:

#### AI Provider Icons
- **AnthropicIcon** - Anthropic AI logo
- **OpenAIIcon** - OpenAI logo
- **GeminiIcon** - Google Gemini logo
- **DeepSeekIcon** - DeepSeek logo
- **MistralIcon** - Mistral AI logo
- **MetaIcon** - Meta AI logo
- **GroqIcon** - Groq logo
- **OllamaIcon** - Ollama logo
- **HanzoIcon** - Hanzo AI logo
- **TogetherAI** - Together AI logo
- **ExoIcon** - Exo logo
- **GrokIcon** - Grok logo
- **LmStudioIcon** - LM Studio logo
- **OpenRouterIcon** - OpenRouter logo
- **PerplexityIcon** - Perplexity logo
- **QwenIcon** - Qwen logo
- **AyaCohereIcon** - Aya/Cohere logo

#### Feature Icons
- **AIAgentIcon** - AI agent indicator
- **AisIcon** - AI services icon
- **ReactJsIcon** - React.js logo
- **ReasoningIcon** - AI reasoning indicator
- **ToolsIcon** - Tools/utilities icon
- **TracingIcon** - Tracing/monitoring icon
- **ScheduledTasksIcon** - Scheduled tasks icon
- **SendIcon** - Send/submit icon

#### File Type Icons
- **FileTypeIcon** - Dynamic file type icon based on extension
- **DirectoryTypeIcon** - Folder/directory icon

### Utilities

Helper functions and hooks:

- **cn()** - Class name utility (clsx + tailwind-merge)
- **markdown()** - Markdown to JSX converter
- **formatText()** - Text formatting utilities
- **useDebounce()** - Debounce hook
- **useMap()** - Map state management hook
- **formatDateToLocaleStringWithTime()** - Date formatting
- **getFileExt()** - File extension extraction
- **hexToRgb()** - Color conversion utilities

### Custom Components

Additional enhanced components:

- **ChatInput** - Chat message input
- **ChatInputArea** - Multi-line chat input
- **ChatSettingsIcon** - Chat settings icon
- **CopyToClipboardIcon** - Copy to clipboard button
- **DotsLoader** - Loading dots animation
- **FileList** - File list display
- **FileUploader** - File upload component
- **JsonForm** - JSON-based dynamic forms
- **MarkdownText** - Markdown renderer
- **PrettyJsonPrint** - Formatted JSON display

## Styling

The library uses Tailwind CSS for styling. Make sure your application includes Tailwind CSS configuration.

## Dependencies

Key peer dependencies:
- React 18.3.1+
- React DOM 18.3.1+
- @hookform/resolvers ^3.3.2
- react-hook-form 7.51.4
- lucide-react 0.456.0
- next-themes ^0.2.1
- embla-carousel ^8.1.6

## Usage Examples

### Basic Button

```tsx
import { Button } from '@hanzo/ui';

function App() {
  return (
    <Button variant="primary" onClick={() => console.log('clicked')}>
      Click me
    </Button>
  );
}
```

### Alert Dialog

```tsx
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from '@hanzo/ui';

function ConfirmDialog() {
  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Button>Open Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### AI Provider Icons

```tsx
import { OpenAIIcon, AnthropicIcon, GeminiIcon } from '@hanzo/ui/assets';

function AIProviders() {
  return (
    <div className="flex gap-4">
      <OpenAIIcon className="h-6 w-6" />
      <AnthropicIcon className="h-6 w-6" />
      <GeminiIcon className="h-6 w-6" />
    </div>
  );
}
```

## License

BSD-3-Clause

## Author

Hanzo AI, Inc.

## Repository

https://github.com/hanzoai/react-sdk