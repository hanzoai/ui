# @hanzo/ui - Multi-Framework Support

## 🎯 Overview

@hanzo/ui v4.7.0 introduces comprehensive multi-framework support, bringing shadcn/ui components to React, Vue, Svelte, and React Native with a unified API.

## 📦 Installation

```bash
npm install @hanzo/ui
# or
pnpm add @hanzo/ui
# or
bun add @hanzo/ui
```

## 🚀 Framework Usage

### React (Default)

```tsx
import { Button, Card, cn } from '@hanzo/ui'
// or explicitly
import { Button, Card, cn } from '@hanzo/ui/react'

function App() {
  return (
    <Card>
      <Button variant="default">Click me</Button>
    </Card>
  )
}
```

### Vue

```vue
<template>
  <Card>
    <Button variant="default">Click me</Button>
  </Card>
</template>

<script setup>
import { Button, Card } from '@hanzo/ui/vue'
</script>
```

### Svelte

```svelte
<script>
import { Button, Card } from '@hanzo/ui/svelte'
</script>

<Card>
  <Button variant="default">Click me</Button>
</Card>
```

### React Native

```tsx
import { Button, Card } from '@hanzo/ui/react-native'
import { View } from 'react-native'

function App() {
  return (
    <View>
      <Card>
        <Button variant="default">Click me</Button>
      </Card>
    </View>
  )
}
```

## 📊 Component Coverage

| Component | React | Vue | Svelte | React Native |
|-----------|-------|-----|---------|--------------|
| Accordion | ✅ | ✅ | ✅ | 🚧 |
| Alert | ✅ | ✅ | ✅ | ✅ |
| Avatar | ✅ | ✅ | ✅ | ✅ |
| Badge | ✅ | ✅ | ✅ | ✅ |
| Button | ✅ | ✅ | ✅ | ✅ |
| Card | ✅ | ✅ | ✅ | ✅ |
| Checkbox | ✅ | ✅ | ✅ | ✅ |
| Dialog | ✅ | ✅ | ✅ | ✅ |
| Dropdown | ✅ | ✅ | ✅ | 🚧 |
| Form | ✅ | ✅ | ✅ | 🚧 |
| Input | ✅ | ✅ | ✅ | ✅ |
| Label | ✅ | ✅ | ✅ | ✅ |
| Popover | ✅ | ✅ | 🚧 | ❌ |
| Progress | ✅ | ✅ | ✅ | ✅ |
| Radio | ✅ | ✅ | ✅ | ✅ |
| Select | ✅ | ✅ | ✅ | 🚧 |
| Separator | ✅ | ✅ | ✅ | ✅ |
| Sheet | ✅ | ✅ | 🚧 | ❌ |
| Skeleton | ✅ | ✅ | ✅ | ✅ |
| Slider | ✅ | ✅ | ✅ | 🚧 |
| Switch | ✅ | ✅ | ✅ | ✅ |
| Table | ✅ | ✅ | ✅ | ❌ |
| Tabs | ✅ | ✅ | ✅ | ✅ |
| Textarea | ✅ | ✅ | ✅ | ✅ |
| Toast | ✅ | ✅ | ✅ | ✅ |
| Toggle | ✅ | ✅ | ✅ | ✅ |
| Tooltip | ✅ | ✅ | 🚧 | ❌ |

Legend: ✅ Complete | 🚧 In Progress | ❌ Not Available

## 🛠 Core Utilities

All frameworks share common utilities:

```ts
import { cn } from '@hanzo/ui/core'

// Merge class names with Tailwind CSS support
const className = cn(
  'base-class',
  condition && 'conditional-class',
  'another-class'
)
```

## 📄 Registry Support

@hanzo/ui includes a shadcn-compatible registry for component discovery:

```bash
# Using the CLI
npx @hanzo/ui add button

# Or with the registry directly
curl https://ui.hanzo.ai/r/button.json
```

## 🔄 Framework Conversion

Convert components between frameworks using our adapter tools:

```bash
# Convert React component to Vue
npx @hanzo/ui convert --from react --to vue button.tsx

# Convert to all frameworks
npx @hanzo/ui convert --from react --to all button.tsx
```

## 📈 Statistics

- **70+ Components** across all frameworks
- **4 Frameworks** supported
- **260+ Tools** in MCP registry
- **100% TypeScript** support
- **Tailwind CSS** powered

## 🤝 Credits

Built on top of amazing work by:
- [shadcn/ui](https://ui.shadcn.com) - Original React components
- [shadcn-vue](https://www.shadcn-vue.com) - Vue port
- [shadcn-svelte](https://www.shadcn-svelte.com) - Svelte port
- [react-native-reusables](https://rnr.dev) - React Native components

## 📝 License

BSD-3-Clause - See LICENSE file for details