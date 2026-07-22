<!--
  SelectItem — an option (role=option). Registers its label with the root so
  SelectValue can render the chosen text, marks selection with a trailing check,
  and chooses on click.
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import { getSelect } from './internal/context'
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
  export let value: string
  export let disabled = false
  /** Optional explicit label; falls back to the item's text content. */
  export let label: string | undefined = undefined

  const { value: current, choose, registerLabel } = getSelect('SelectItem')

  let node: HTMLButtonElement
  onMount(() => {
    registerLabel(value, label ?? node.textContent?.trim() ?? value)
  })

  $: selected = $current === value
</script>

<button
  bind:this={node}
  type="button"
  role="option"
  aria-selected={selected}
  tabindex="-1"
  {disabled}
  data-disabled={disabled ? '' : undefined}
  data-slot="select-item"
  data-state={selected ? 'checked' : 'unchecked'}
  class={cn(
    'relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-2 pr-8 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    className,
  )}
  on:click={() => !disabled && choose(value)}
  {...$$restProps}
>
  <slot />
  {#if selected}
    <span class="absolute right-2 flex size-3.5 items-center justify-center">
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
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  {/if}
</button>
