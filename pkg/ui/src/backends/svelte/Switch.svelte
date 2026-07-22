<!--
  Switch — accessible toggle (role=switch, keyboard via native button) with the
  shadcn backend's data-state token styling. `bind:checked` is supported.
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
  role="switch"
  aria-checked={checked}
  {disabled}
  data-slot="switch"
  data-state={checked ? 'checked' : 'unchecked'}
  class={cn(
    'peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
    className,
  )}
  on:click={toggle}
  {...$$restProps}
>
  <span
    data-state={checked ? 'checked' : 'unchecked'}
    class="bg-background pointer-events-none block size-4 rounded-full ring-0 shadow-lg transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
  ></span>
</button>
