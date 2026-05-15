<script lang="ts">
	import { HandCoins } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Settle Up - WeSplit</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold">Settle Up</h2>
	</div>

	<div class="text-center py-16 border border-border border-dashed rounded-lg">
		<HandCoins size={32} class="mx-auto text-text-muted mb-3" />
		<p class="text-text-secondary text-sm">No settlements</p>
		<p class="text-text-muted text-xs mt-1">Record payments as people settle up</p>
	</div>
</div>
