import type { Block } from "../def";

interface BlockComponentProps {
  block: Block
  className?: string
  agent?: string
}

export {
  type BlockComponentProps as default
}