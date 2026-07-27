<!--
  Checkbox — accessible control (role=checkbox, keyboard via native button) with
  the shadcn backend's data-state token styling. `bind:checked` is supported.
-->
<script lang="ts">
  import { cn } from '../../core/cn'
  import { createEventDispatcher } from 'svelte'

  let className: string | undefined = undefined
  export { className as class }
  export let checked = false
  export let disabled = false

  const dispatch = createEventDispatcher<{ change: boolean }>()

  function toggle() {
    if (disabled) return
    checked = !checked
    dispatch('change', checked)
  }
</script>

<button
  type="button"
  role="checkbox"
  aria-checked={checked}
  {disabled}
  data-slot="checkbox"
  data-state={checked ? 'checked' : 'unchecked'}
  class={cn(
    'peer flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
    className,
  )}
  on:click={toggle}
  {...$$restProps}
>
  {#if checked}
    <svg
      viewBox="0 0 24 24"
      class="size-3.5"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  {/if}
</button>
