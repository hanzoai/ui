# @hanzo/ui

Accessible and customizable components for React, Vue, Svelte, and React Native. **Built on shadcn/ui with multi-framework support, 3D components, AI components, and advanced features.**

![hero](app/public/og.jpg)

## Features

- **161+ Components** - 3x more than shadcn/ui
- **Multi-Framework** - React, Vue, Svelte, React Native
- **Two Themes** - Default & New York variants
- **AI Components** - Chat, assistants, playground
- **3D Components** - Interactive 3D elements
- **Animations** - Advanced motion components
- **Page Builder** - Visual drag-drop interface
- **White-Label** - Fork and rebrand easily
- **Blocks** - 24+ production-ready templates
- **Accessible** - Built with Radix UI primitives
- **Customizable** - Tailwind CSS powered
- **TypeScript** - Fully typed

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

## Documentation

Visit **[ui.hanzo.ai](https://ui.hanzo.ai)** for full docs.

## CLI

```bash
npx @hanzo/ui add button
npx @hanzo/ui add card dialog
```

## Packages

- `@hanzo/ui` - Main UI library (161 components)
- `@hanzo/auth` - Authentication components
- `@hanzo/commerce` - E-commerce components
- `@hanzo/brand` - Branding system

## Development

```bash
git clone https://github.com/hanzoai/ui.git
cd ui
pnpm install
pnpm dev
```

## Contributing

Please read the [contributing guide](/CONTRIBUTING.md).

## License

MIT - See [LICENSE.md](./LICENSE.md) for details.

---

Built by [Hanzo](https://hanzo.ai)
