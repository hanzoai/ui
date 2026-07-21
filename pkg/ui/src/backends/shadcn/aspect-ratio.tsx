'use client'

import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio'

/** AspectRatio — thin passthrough of the Radix primitive (no styling needed). */
function AspectRatio(props: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />
}

export { AspectRatio }
