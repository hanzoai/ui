<!--
  Button — the svelte-backend flagship. Every class is a STANDARD design token
  (bg-primary, text-primary-foreground, bg-accent, bg-secondary, bg-destructive,
  border-input, ring-ring) so it renders solid against the Hanzo theme
  (theme.css) or any host that defines the standard variables. The variant/size
  vocabulary mirrors the shadcn backend's `buttonVariants` one-for-one, so a
  component's props read identically across backends. Fonts are inherited
  (text-sm font-medium), never a hard-coded family.
-->
<script lang="ts" context="module">
  import { cva, type VariantProps } from 'class-variance-authority'

  export const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] shrink-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
    {
      variants: {
        variant: {
          default: 'bg-primary text-primary-foreground hover:bg-primary/90',
          destructive:
            'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20',
          outline:
            'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
          secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          ghost: 'hover:bg-accent hover:text-accent-foreground',
          link: 'text-primary underline-offset-4 hover:underline',
          // Hanzo compatibility variants (parallel to the shadcn backend).
          primary: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
          linkFG: 'text-primary underline-offset-4 hover:underline',
          linkMuted:
            'text-muted-foreground underline-offset-4 hover:underline hover:text-foreground',
        },
        size: {
          default: 'h-9 px-4 py-2 has-[>svg]:px-3',
          sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
          lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
          icon: 'size-9',
          'icon-sm': 'size-8',
          'icon-lg': 'size-10',
        },
      },
      defaultVariants: { variant: 'default', size: 'default' },
    },
  )

  export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>
  export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>
</script>

<script lang="ts">
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
  export let variant: ButtonVariant = 'default'
  export let size: ButtonSize = 'default'
  export let type: 'button' | 'submit' | 'reset' = 'button'
  export let disabled = false
  export let loading = false
  /** Render an anchor instead of a button when set. */
  export let href: string | undefined = undefined

  $: classes = cn(buttonVariants({ variant, size }), className)
  $: iconOnly = size === 'icon' || size === 'icon-sm' || size === 'icon-lg'
</script>

{#if href}
  <a
    {href}
    class={classes}
    data-slot="button"
    data-variant={variant}
    data-size={size}
    aria-disabled={disabled || undefined}
    on:click
    on:keydown
    {...$$restProps}
  >
    <slot />
  </a>
{:else}
  <button
    {type}
    class={classes}
    data-slot="button"
    data-variant={variant}
    data-size={size}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    on:click
    on:keydown
    on:mouseenter
    on:mouseleave
    on:focus
    on:blur
    {...$$restProps}
  >
    {#if loading}
      <svg
        class={cn('animate-spin', !iconOnly && 'mr-1')}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    {/if}
    <slot />
  </button>
{/if}
