<script lang="ts">
	import { Calculator } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Balances - WeSplit</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold">Balances</h2>
	</div>

	<div class="text-center py-16 border border-border border-dashed rounded-lg">
		<Calculator size={32} class="mx-auto text-text-muted mb-3" />
		<p class="text-text-secondary text-sm">No balances to show</p>
		<p class="text-text-muted text-xs mt-1">Add expenses to see who owes whom</p>
	</div>
</div>
