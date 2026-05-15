<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { HandCoins, Plus, Trash2 } from '@lucide/svelte';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '../../../convex/_generated/dataModel';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let groupId = $derived($page.params.groupId as Id<'groups'>);
	let client: ReturnType<typeof useConvexClient>;

	const settlements = useQuery(api.settlements.listByGroup, () => (groupId ? { groupId } : 'skip'));
	const members = useQuery(api.members.listByGroup, () => (groupId ? { groupId } : 'skip'));
	const optimized = useQuery(api.balances.getOptimizedSettlements, () => (groupId ? { groupId } : 'skip'));

	let showAddModal = $state(false);
	let fromMember = $state('' as Id<'members'>);
	let toMember = $state('' as Id<'members'>);
	let settleAmount = $state('');
	let settleNotes = $state('');
	let submitting = $state(false);

	onMount(() => {
		client = useConvexClient();
	});

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function formatCurrency(n: number): string {
		return `$${n.toFixed(2)}`;
	}

	async function recordSettlement() {
		if (!fromMember || !toMember || !settleAmount) return;
		submitting = true;
		try {
			await client.mutation(api.settlements.create, {
				groupId,
				fromMember,
				toMember,
				amount: parseFloat(settleAmount),
				notes: settleNotes.trim() || undefined
			});
			showAddModal = false;
			fromMember = '' as Id<'members'>;
			toMember = '' as Id<'members'>;
			settleAmount = '';
			settleNotes = '';
		} catch (e) {
			console.error('Failed to record settlement:', e);
		} finally {
			submitting = false;
		}
	}

	function quickSettle(from: Id<'members'>, fromName: string, to: Id<'members'>, toName: string, amount: number) {
		fromMember = from;
		toMember = to;
		settleAmount = amount.toFixed(2);
		showAddModal = true;
	}

	async function deleteSettlement(settlementId: Id<'settlements'>) {
		await client.mutation(api.settlements.remove, { settlementId });
	}
</script>

<svelte:head>
	<title>Settle Up - WeSplit</title>
</svelte:head>

<div class="space-y-6">
	<!-- Quick Settlement Suggestions -->
	{#if optimized.data && optimized.data.length > 0}
		<div>
			<h2 class="text-lg font-semibold mb-3">Suggested</h2>
			<div class="space-y-2">
				{#each optimized.data as s (s.from + s.to)}
					<div class="p-3 bg-surface border border-border rounded-lg flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="p-1.5 bg-accent-dim rounded-md">
								<HandCoins size={14} class="text-accent" />
							</div>
							<p class="text-sm">
								<span class="text-text-secondary">{s.fromName}</span>
								<span class="text-text-muted mx-1">pays</span>
								<span class="text-text-primary">{s.toName}</span>
							</p>
						</div>
						<div class="flex items-center gap-2">
							<span class="font-mono text-sm font-medium">{formatCurrency(s.amount)}</span>
							<Button size="sm" onclick={() => quickSettle(s.from, s.fromName, s.to, s.toName, s.amount)}>Mark</Button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Settlement History -->
	<div>
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-lg font-semibold">History</h2>
			<Button size="sm" onclick={() => showAddModal = true} disabled={!members.data || members.data.length < 2}>
				<span class="flex items-center gap-1.5">
					<Plus size={14} />
					Record
				</span>
			</Button>
		</div>

		{#if settlements.isLoading}
			<div class="space-y-2">
				{#each [1, 2] as _}
					<div class="p-4 bg-surface border border-border rounded-lg animate-pulse">
						<div class="flex justify-between">
							<div class="h-4 bg-surface-raised rounded w-32"></div>
							<div class="h-4 bg-surface-raised rounded w-16"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if settlements.data && settlements.data.length > 0}
			<div class="space-y-2">
				{#each settlements.data as s (s._id)}
					<div class="p-3 bg-surface border border-border rounded-lg flex items-center justify-between group">
						<div class="flex items-center gap-3">
							<div class="p-1.5 bg-surface-raised rounded-md">
								<HandCoins size={14} class="text-text-muted" />
							</div>
							<div>
								<p class="text-sm">
									<span class="text-text-secondary">{s.fromMemberName}</span>
									<span class="text-text-muted mx-1">paid</span>
									<span class="text-text-primary">{s.toMemberName}</span>
								</p>
								{#if s.notes}
									<p class="text-xs text-text-muted mt-0.5">{s.notes}</p>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-3">
							<div class="text-right">
								<span class="font-mono text-sm font-medium">{formatCurrency(s.amount)}</span>
								<p class="text-xs text-text-muted mt-0.5">{formatDate(s.settledAt)}</p>
							</div>
							<button
								type="button"
								onclick={() => deleteSettlement(s._id)}
								class="p-1.5 text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-danger-dim rounded transition-all"
								title="Delete settlement"
							>
								<Trash2 size={14} />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-center py-16 border border-border border-dashed rounded-lg">
				<HandCoins size={32} class="mx-auto text-text-muted mb-3" />
				<p class="text-text-secondary text-sm">No settlements</p>
				<p class="text-text-muted text-xs mt-1">Record payments as people settle up</p>
			</div>
		{/if}
	</div>
</div>

<Modal bind:open={showAddModal} title="Record payment">
	<div class="space-y-4">
		{#if members.data && members.data.length >= 2}
			<div>
				<label class="block text-sm font-medium text-text-secondary mb-1.5">From</label>
				<select bind:value={fromMember} class="w-full px-3 py-2 text-sm bg-surface-raised border border-border rounded-md text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors">
					<option value="" disabled>Select payer</option>
					{#each members.data as member}
						<option value={member._id}>{member.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="block text-sm font-medium text-text-secondary mb-1.5">To</label>
				<select bind:value={toMember} class="w-full px-3 py-2 text-sm bg-surface-raised border border-border rounded-md text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors">
					<option value="" disabled>Select recipient</option>
					{#each members.data as member}
						<option value={member._id} disabled={member._id === fromMember}>{member.name}</option>
					{/each}
				</select>
			</div>
		{/if}
		<Input bind:value={settleAmount} type="number" label="Amount ($)" placeholder="0.00" />
		<Input bind:value={settleNotes} label="Notes (optional)" placeholder="e.g. Venmo, cash" />
		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={() => showAddModal = false}>Cancel</Button>
			<Button fullWidth disabled={submitting || !fromMember || !toMember || !settleAmount} onclick={recordSettlement}>
				{#if submitting}
					<span class="flex items-center justify-center gap-2">
						<span class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
						Saving...
					</span>
				{:else}
					Record
				{/if}
			</Button>
		</div>
	</div>
</Modal>
