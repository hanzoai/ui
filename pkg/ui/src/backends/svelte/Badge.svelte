<!-- Badge — standard-token label; variant vocabulary mirrors the shadcn backend. -->
<script lang="ts" context="module">
  import { cva, type VariantProps } from 'class-variance-authority'

  export const badgeVariants = cva(
    'inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none aria-invalid:border-destructive [&>svg]:pointer-events-none overflow-hidden gap-1',
    {
      variants: {
        variant: {
          default: 'bg-primary text-primary-foreground hover:bg-primary/90 border-transparent shadow-sm',
          secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent',
          destructive: 'bg-destructive text-white hover:bg-destructive/90 border-transparent shadow-sm',
          outline: 'text-foreground border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        },
      },
      defaultVariants: { variant: 'default' },
    },
  )

  export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>
</script>

<script lang="ts">
  import { cn } from '../../core/cn'
  let className: string | undefined = undefined
  export { className as class }
  export let variant: BadgeVariant = 'default'
</script>

<span data-slot="badge" class={cn(badgeVariants({ variant }), className)} {...$$restProps}>
  <slot />
</span>
