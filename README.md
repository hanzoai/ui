# @hanzo/ui

Accessible and customizable components for React, Vue, Svelte, and React Native. **Built on shadcn/ui with multi-framework support, 3D components, AI components, and advanced features.**

![hero](app/public/og.jpg)

## Features

- 🎯 **161+ Components** - 3x more than shadcn/ui
- 🌐 **Multi-Framework** - React, Vue, Svelte, React Native
- 🎨 **Two Themes** - Default & New York variants
- 🤖 **AI Components** - Chat, assistants, playground
- 🎮 **3D Components** - Interactive 3D elements
- ✨ **Animations** - Advanced motion components
- 🎛️ **Page Builder** - Visual drag-drop interface
- 🏷️ **White-Label** - Fork and rebrand easily
- 📦 **Blocks** - 24+ production-ready templates
- ♿ **Accessible** - Built with Radix UI primitives
- 🎭 **Customizable** - Tailwind CSS powered
- 📘 **TypeScript** - Fully typed

## Quick Start

### Installation

```bash
npm install @hanzo/ui
# or
pnpm add @hanzo/ui
```

### Usage

```tsx
import { Button, Card, Input } from '@hanzo/ui'

export function App() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Welcome</Card.Title>
      </Card.Header>
      <Card.Content>
        <Input placeholder="Enter text..." />
      </Card.Content>
      <Card.Footer>
        <Button>Submit</Button>
      </Card.Footer>
    </Card>
  )
}
```

## Multi-Framework Support

```tsx
// React (default)
import { Button } from '@hanzo/ui'

// Vue
import { Button } from '@hanzo/ui/vue'

// Svelte
import { Button } from '@hanzo/ui/svelte'

// React Native
import { Button } from '@hanzo/ui/react-native'
```

## Documentation

📚 Visit **[ui.hanzo.ai](https://ui.hanzo.ai)** for:

- [Component Documentation](https://ui.hanzo.ai/docs/components)
- [Framework Guides](https://ui.hanzo.ai/docs/frameworks)
- [Installation Guide](https://ui.hanzo.ai/docs/installation)
- [Examples](https://ui.hanzo.ai/examples)
- [Page Builder](https://ui.hanzo.ai/builder)
- [Theme Generator](https://ui.hanzo.ai/theme-generator)

## CLI

Install components individually:

```bash
npx @hanzo/ui add button
npx @hanzo/ui add card dialog
```

## What's Different from shadcn/ui?

| Feature | shadcn/ui | @hanzo/ui |
|---------|-----------|-----------|
| Components | 58 | **161** |
| Frameworks | React only | React, Vue, Svelte, React Native |
| 3D Components | ❌ | ✅ (9 components) |
| AI Components | ❌ | ✅ (12 components) |
| Page Builder | ❌ | ✅ |
| White-Label | ❌ | ✅ |
| Blocks | Limited | **24+ templates** |

## Packages

- `@hanzo/ui` - Main UI library (161 components)
- `@hanzo/auth` - Authentication components
- `@hanzo/commerce` - E-commerce components
- `@hanzo/brand` - Branding system

## Examples

```tsx
// 3D Components
import { ThreeDButton, ThreeDCard } from '@hanzo/ui'

// AI Components
import { AIChat, AIAssistant } from '@hanzo/ui'

// Animations
import { AnimatedBeam, AnimatedText } from '@hanzo/ui'
```

## Development

```bash
# Clone repository
git clone https://github.com/hanzoai/ui.git
cd ui

# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build packages
pnpm build

# Run tests
pnpm test
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md).

## License

MIT - See [LICENSE.md](./LICENSE.md) for details.

## Links

- [Documentation](https://ui.hanzo.ai)
- [GitHub](https://github.com/hanzoai/ui)
- [npm](https://www.npmjs.com/package/@hanzo/ui)
- [Discord](https://discord.gg/hanzo)
- [Twitter](https://twitter.com/hanzoai)

---

Built with ❤️ by [Hanzo](https://hanzo.ai)
