<!--
  SelectValue — renders the chosen option's registered label, or the placeholder
  (muted) when nothing is selected.
-->
<script lang="ts">
  import { getSelect } from './internal/context'

  export let placeholder = ''

  const { value, labels } = getSelect('SelectValue')
  $: label = $labels[$value]
</script>

<span data-slot="select-value" class:text-muted-foreground={!label}>
  {label ?? placeholder}
</span>
