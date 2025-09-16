# @hanzo/ui Usage Guide

This UI library supports two methods for using components:

## Method 1: Direct Import from @hanzo/ui (Recommended)

Install the package:
```bash
npm install @hanzo/ui
# or
pnpm add @hanzo/ui
# or
yarn add @hanzo/ui
```

Then import components directly:
```tsx
import { Button, Card, Input } from '@hanzo/ui/components'
import { cn } from '@hanzo/ui/lib/utils'

export function MyComponent() {
  return (
    <Card>
      <Button>Click me</Button>
      <Input placeholder="Enter text..." />
    </Card>
  )
}
```

## Method 2: Copy and Paste

Visit [ui.hanzo.ai](https://ui.hanzo.ai) and use the CLI or manually copy components:

### Using CLI:
```bash
npx @hanzo/ui add button
```

### Manual Copy:
1. Visit the component page (e.g., [ui.hanzo.ai/docs/components/button](https://ui.hanzo.ai/docs/components/button))
2. Copy the source code
3. Paste into your project at `components/ui/button.tsx`
4. Install any required dependencies

## Available Imports

### Components
```tsx
import {
  Accordion,
  Alert,
  AlertDialog,
  AspectRatio,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Calendar,
  Card,
  Carousel,
  Chart,
  Checkbox,
  Collapsible,
  Command,
  ContextMenu,
  Dialog,
  Drawer,
  DropdownMenu,
  Form,
  HoverCard,
  Input,
  InputOTP,
  Label,
  Menubar,
  NavigationMenu,
  Pagination,
  Popover,
  Progress,
  RadioGroup,
  Resizable,
  ScrollArea,
  Select,
  Separator,
  Sheet,
  Sidebar,
  Skeleton,
  Slider,
  Sonner,
  Switch,
  Table,
  Tabs,
  Textarea,
  Toast,
  Toaster,
  Toggle,
  ToggleGroup,
  Tooltip,
  useToast
} from '@hanzo/ui/components'
```

### Utilities
```tsx
import { cn } from '@hanzo/ui/lib/utils'
```

### Tailwind Config
```tsx
import { hanzoUIPreset } from '@hanzo/ui/tailwind'
```

## Theming

The library now uses the default shadcn/ui color system with proper light/dark mode support.

### Available CSS Variables:
- `--background` / `--foreground`
- `--primary` / `--primary-foreground`
- `--secondary` / `--secondary-foreground`
- `--accent` / `--accent-foreground`
- `--destructive` / `--destructive-foreground`
- `--muted` / `--muted-foreground`
- `--card` / `--card-foreground`
- `--popover` / `--popover-foreground`
- And more...

### Color Charts:
- `--chart-1` through `--chart-5` for data visualization

## Examples

### Button with variants:
```tsx
import { Button } from '@hanzo/ui/components'

<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

### Card with content:
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@hanzo/ui/components'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

### Form with validation:
```tsx
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@hanzo/ui/components'
import { Input } from '@hanzo/ui/components'

// Use with react-hook-form
```

## License

BSD-3-Clause