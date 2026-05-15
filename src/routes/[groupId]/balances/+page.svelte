<script lang="ts">
	import { page } from '$app/stores';
	import { Calculator, ArrowUpRight, ArrowDownLeft } from '@lucide/svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '../../../convex/_generated/dataModel';

	let groupId = $derived($page.params.groupId as Id<'groups'>);

	const balances = useQuery(api.balances.getMemberBalances, () => (groupId ? { groupId } : 'skip'));
	const debts = useQuery(api.balances.getDetailedDebts, () => (groupId ? { groupId } : 'skip'));
	const optimized = useQuery(api.balances.getOptimizedSettlements, () => (groupId ? { groupId } : 'skip'));

	function formatCurrency(n: number): string {
		return `$${Math.abs(n).toFixed(2)}`;
	}
</script>

<svelte:head>
	<title>Balances - WeSplit</title>
</svelte:head>

<div class="space-y-6">
	{#if balances.isLoading}
		<div class="space-y-2">
			{#each [1, 2, 3] as _}
				<div class="p-4 bg-surface border border-border rounded-lg animate-pulse">
					<div class="flex justify-between">
						<div class="h-4 bg-surface-raised rounded w-24"></div>
						<div class="h-4 bg-surface-raised rounded w-16"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if balances.data && balances.data.length > 0}
		<!-- Balance Summary -->
		<div>
			<h2 class="text-lg font-semibold mb-3">Balances</h2>
			<div class="space-y-2">
				{#each balances.data as b (b.memberId)}
					<div class="p-3 bg-surface border border-border rounded-lg flex items-center justify-between">
						<span class="font-medium text-sm">{b.memberName}</span>
						{#if Math.abs(b.balance) < 0.01}
							<span class="text-xs text-text-muted font-mono">settled</span>
						{:else if b.balance > 0}
							<span class="text-xs font-mono text-accent">+{formatCurrency(b.balance)}</span>
						{:else}
							<span class="text-xs font-mono text-danger">-{formatCurrency(b.balance)}</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Optimized Settlement Plan -->
		{#if optimized.data && optimized.data.length > 0}
			<div>
				<h2 class="text-lg font-semibold mb-3">Settlement Plan</h2>
				<p class="text-xs text-text-muted mb-3">Minimum transactions to settle all debts</p>
				<div class="space-y-2">
					{#each optimized.data as s (s.from + s.to)}
						<div class="p-3 bg-surface border border-border rounded-lg flex items-center gap-3">
							<div class="p-1.5 bg-danger-dim rounded-md">
								<ArrowUpRight size={14} class="text-danger" />
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm">
									<span class="text-text-secondary">{s.fromName}</span>
									<span class="text-text-muted mx-1">pays</span>
									<span class="text-text-primary">{s.toName}</span>
								</p>
							</div>
							<span class="font-mono text-sm font-medium">{formatCurrency(s.amount)}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Detailed Debts -->
		{#if debts.data && debts.data.length > 0}
			<div>
				<h2 class="text-lg font-semibold mb-3">All Debts</h2>
				<div class="space-y-2">
					{#each debts.data as d (d.from + d.to)}
						<div class="p-3 bg-surface border border-border rounded-lg flex items-center gap-3">
							<div class="p-1.5 bg-warning-dim rounded-md">
								<ArrowDownLeft size={14} class="text-warning" />
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm">
									<span class="text-text-secondary">{d.fromName}</span>
									<span class="text-text-muted mx-1">owes</span>
									<span class="text-text-primary">{d.toName}</span>
								</p>
							</div>
							<span class="font-mono text-sm">{formatCurrency(d.amount)}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<div class="text-center py-16 border border-border border-dashed rounded-lg">
			<Calculator size={32} class="mx-auto text-text-muted mb-3" />
			<p class="text-text-secondary text-sm">No balances to show</p>
			<p class="text-text-muted text-xs mt-1">Add expenses to see who owes whom</p>
		</div>
	{/if}
</div>
