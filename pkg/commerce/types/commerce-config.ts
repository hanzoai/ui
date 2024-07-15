import type { ServiceOptions } from '..'
import type { CategoryNode } from './category-node'
import type { Family } from './family'
import type { SelectionUISpecifier }  from './selection-ui-specifier'

interface CommerceConfig {
  families: Family[]
  rootNode: CategoryNode
  options?: ServiceOptions
  uiSpecifiers?: Record<string, SelectionUISpecifier>
}

export { type CommerceConfig as default }
