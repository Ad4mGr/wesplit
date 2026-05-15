<script lang="ts">
	import { page } from '$app/stores';
	import { DollarSign } from '@lucide/svelte';
	import Button from '$lib/components/Button.svelte';

	let groupId = $derived($page.params.groupId);
</script>

<svelte:head>
	<title>Expenses - WeSplit</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold">Expenses</h2>
		<Button size="sm" onclick={() => {}}>
			<span class="flex items-center gap-1.5">
				<DollarSign size={14} />
				Add
			</span>
		</Button>
	</div>

	<div class="text-center py-16 border border-border border-dashed rounded-lg">
		<DollarSign size={32} class="mx-auto text-text-muted mb-3" />
		<p class="text-text-secondary text-sm">No expenses yet</p>
		<p class="text-text-muted text-xs mt-1">Add the first expense to get started</p>
	</div>
</div>
