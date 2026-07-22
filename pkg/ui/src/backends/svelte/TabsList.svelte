<!--
  TabsList — the tab strip. role=tablist with roving ArrowLeft/Right/Home/End
  focus over its triggers. Standard-token styling parallels the shadcn backend.
-->
<script lang="ts">
  import { rovingFocus } from './internal/actions'
  import { cn } from '../../core/cn'

  let className: string | undefined = undefined
  export { className as class }
</script>

<div
  role="tablist"
  use:rovingFocus={{ selector: '[role="tab"]', autofocus: false }}
  data-slot="tabs-list"
  class={cn(
    'inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground',
    className,
  )}
  {...$$restProps}
>
  <slot />
</div>
