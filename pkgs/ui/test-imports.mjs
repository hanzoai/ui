// Test file to verify all import styles work correctly

// Test 1: Direct import from @hanzo/ui (top-level)
import { Button, Card } from '@hanzo/ui'
console.log('✓ Top-level import works:', typeof Button, typeof Card)

// Test 2: Import from /components (same as top-level)
import { Badge, Alert } from '@hanzo/ui/components'
console.log('✓ Components import works:', typeof Badge, typeof Alert)

// Test 3: Utility imports
import { cn } from '@hanzo/ui/lib/utils'
console.log('✓ Utils import works:', typeof cn)

console.log('\n🎉 All main import styles are working correctly!')
console.log('\nSupported import styles:')
console.log('  - import { Button } from "@hanzo/ui"')
console.log('  - import { Button } from "@hanzo/ui/components"')
console.log('  - import { cn } from "@hanzo/ui/lib/utils"')