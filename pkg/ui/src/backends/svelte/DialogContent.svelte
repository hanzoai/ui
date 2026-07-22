<!--
  DialogContent — modal surface. Portals to <body> to escape stacking contexts,
  traps focus while open, dismisses on Escape / outside press, and locks body
  scroll. Standard-token styling parallels the shadcn backend.
-->
<script lang="ts">
  import { onDestroy } from 'svelte'
  import { getDisclosure, DIALOG } from './internal/context'
  import { portal, trapFocus, dismiss } from './internal/actions'
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
  export let showClose = true

  const { open, close, contentId, labelId, descId } = getDisclosure(DIALOG, 'DialogContent')

  const hasDocument = typeof document !== 'undefined'
  let prevOverflow = ''
  $: if (hasDocument) {
    if ($open) {
      prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = prevOverflow
    }
  }
  onDestroy(() => {
    if (hasDocument) document.body.style.overflow = prevOverflow
  })
</script>

{#if $open}
  <div use:portal class="fixed inset-0 z-50">
    <div
      data-slot="dialog-overlay"
      class="fixed inset-0 bg-black/50"
      aria-hidden="true"
    ></div>
    <div
      role="dialog"
      aria-modal="true"
      id={contentId}
      aria-labelledby={labelId}
      aria-describedby={descId}
      tabindex="-1"
      use:trapFocus
      use:dismiss={{ onDismiss: close }}
      data-slot="dialog-content"
      class={cn(
        'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 text-foreground shadow-lg outline-none',
        className,
      )}
    >
      <slot />
      {#if showClose}
        <button
          type="button"
          aria-label="Close"
          class="absolute right-4 top-4 rounded-sm opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          on:click={close}
        >
          <svg
            viewBox="0 0 24 24"
            class="size-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      {/if}
    </div>
  </div>
{/if}
