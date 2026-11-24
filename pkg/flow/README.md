# @hanzo/flow

Canonical open-source visual AI workflow builder for Hanzo (`flow.hanzo.ai`,
`hanzo.app`, and CRM applications).

Built strictly on [`@hanzo/gui`](https://github.com/hanzoai/ui) and
[`@xyflow/react`](https://reactflow.dev) — zero Tailwind, zero Radix — with the
pure monochrome Hanzo Dev aesthetic (`#000000` / `#0a0a0a` / `#111111`,
hairline borders, `#fafafa` ink) and light-theme support (`theme="light"`).

## Install

```sh
pnpm add @hanzo/flow @hanzo/gui @xyflow/react react react-dom
```

Or consume through `@hanzo/ui`:

```ts
import { FlowBuilder } from "@hanzo/ui/flow"
import { executeFlowGraph, validateFlowGraph } from "@hanzo/ui/flow/pure"
```

## Entry points

- `@hanzo/flow` — `<FlowBuilder>`, `<FlowSidebar>`, `<FlowInspector>`,
  `<FlowNodeCard>`, `<FlowCanvasNode>`, `FLOW_NODE_TYPES`, plus all pure
  types and graph engine exports.
- `@hanzo/flow/pure` — React-free headless types, `DEFAULT_FLOW_PALETTE`,
  `DEFAULT_FLOW_TEMPLATES`, `validateFlowGraph`, `layoutFlowGraph`,
  `executeFlowGraph`, `createHttpFlowBackend`, and `createMemoryFlowBackend`.
  Runs in bare Node, server routes, and unit tests without a DOM.

## Usage

```tsx
import {
  FlowBuilder,
  createHttpFlowBackend,
  DEFAULT_FLOW_TEMPLATES,
} from "@hanzo/flow"

const backend = createHttpFlowBackend({
  baseUrl: "https://flow.hanzo.ai",
  getToken: () => iamSession.accessToken,
})

export function WorkflowsPage() {
  return (
    <FlowBuilder
      backend={backend}
      templates={DEFAULT_FLOW_TEMPLATES}
      theme="dark"
    />
  )
}
```
