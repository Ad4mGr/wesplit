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

	const CURRENCIES = [
		{ symbol: '$', code: 'USD', name: 'US Dollar' },
		{ symbol: '€', code: 'EUR', name: 'Euro' },
		{ symbol: '£', code: 'GBP', name: 'British Pound' },
		{ symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
		{ symbol: '₹', code: 'INR', name: 'Indian Rupee' },
		{ symbol: '₿', code: 'BTC', name: 'Bitcoin' },
		{ symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
		{ symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
		{ symbol: 'Fr', code: 'CHF', name: 'Swiss Franc' },
		{ symbol: '₩', code: 'KRW', name: 'South Korean Won' },
		{ symbol: 'R$', code: 'BRL', name: 'Brazilian Real' },
		{ symbol: 'zł', code: 'PLN', name: 'Polish Zloty' }
	];

	let groupId = $derived($page.params.groupId as Id<'groups'>);
	let client: ReturnType<typeof useConvexClient>;

	const settlements = useQuery(api.settlements.listByGroup, () => (groupId ? { groupId } : 'skip'));
	const members = useQuery(api.members.listByGroup, () => (groupId ? { groupId } : 'skip'));
	const optimized = useQuery(api.balances.getOptimizedSettlements, () =>
		groupId ? { groupId } : 'skip'
	);
	const group = useQuery(api.groups.get, () => (groupId ? { groupId } : 'skip'));

	let showAddModal = $state(false);
	let fromMember = $state('' as Id<'members'>);
	let toMember = $state('' as Id<'members'>);
	let settleAmount = $state('');
	let settleNotes = $state('');
	let submitting = $state(false);

	onMount(() => {
		client = useConvexClient();
	});

	function getCurrencySymbol(): string {
		if (!group.data?.currency) return '$';
		const found = CURRENCIES.find((c) => c.code === group.data!.currency);
		return found?.symbol ?? '$';
	}

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatCurrency(n: number): string {
		return `${getCurrencySymbol()}${n.toFixed(2)}`;
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

	function quickSettle(
		from: Id<'members'>,
		fromName: string,
		to: Id<'members'>,
		toName: string,
		amount: number
	) {
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
			<h2 class="mb-3 text-lg font-semibold">Suggested</h2>
			<div class="space-y-2">
				{#each optimized.data as s (s.from + s.to)}
					<div
						class="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
					>
						<div class="flex items-center gap-3">
							<div class="rounded-md bg-accent-dim p-1.5">
								<HandCoins size={14} class="text-accent" />
							</div>
							<p class="text-sm">
								<span class="text-text-secondary">{s.fromName}</span>
								<span class="mx-1 text-text-muted">pays</span>
								<span class="text-text-primary">{s.toName}</span>
							</p>
						</div>
						<div class="flex items-center gap-2">
							<span class="font-mono text-sm font-medium">{formatCurrency(s.amount)}</span>
							<Button
								size="sm"
								onclick={() => quickSettle(s.from, s.fromName, s.to, s.toName, s.amount)}
								>Mark</Button
							>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Settlement History -->
	<div>
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-lg font-semibold">History</h2>
			<Button
				size="sm"
				onclick={() => (showAddModal = true)}
				disabled={!members.data || members.data.length < 2}
			>
				<span class="flex items-center gap-1.5">
					<Plus size={14} />
					Record
				</span>
			</Button>
		</div>

		{#if settlements.isLoading}
			<div class="space-y-2">
				{#each [1, 2] as _}
					<div class="animate-pulse rounded-lg border border-border bg-surface p-4">
						<div class="flex justify-between">
							<div class="h-4 w-32 rounded bg-surface-raised"></div>
							<div class="h-4 w-16 rounded bg-surface-raised"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if settlements.data && settlements.data.length > 0}
			<div class="space-y-2">
				{#each settlements.data as s (s._id)}
					<div
						class="group flex items-center justify-between rounded-lg border border-border bg-surface p-3"
					>
						<div class="flex items-center gap-3">
							<div class="rounded-md bg-surface-raised p-1.5">
								<HandCoins size={14} class="text-text-muted" />
							</div>
							<div>
								<p class="text-sm">
									<span class="text-text-secondary">{s.fromMemberName}</span>
									<span class="mx-1 text-text-muted">paid</span>
									<span class="text-text-primary">{s.toMemberName}</span>
								</p>
								{#if s.notes}
									<p class="mt-0.5 text-xs text-text-muted">{s.notes}</p>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-3">
							<div class="text-right">
								<span class="font-mono text-sm font-medium">{formatCurrency(s.amount)}</span>
								<p class="mt-0.5 text-xs text-text-muted">{formatDate(s.settledAt)}</p>
							</div>
							<button
								type="button"
								onclick={() => deleteSettlement(s._id)}
								class="rounded p-1.5 text-text-muted opacity-0 transition-all group-hover:opacity-100 hover:bg-danger-dim hover:text-danger"
								title="Delete settlement"
							>
								<Trash2 size={14} />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="rounded-lg border border-dashed border-border py-16 text-center">
				<HandCoins size={32} class="mx-auto mb-3 text-text-muted" />
				<p class="text-sm text-text-secondary">No settlements</p>
				<p class="mt-1 text-xs text-text-muted">Record payments as people settle up</p>
			</div>
		{/if}
	</div>
</div>

<Modal bind:open={showAddModal} title="Record payment">
	<div class="space-y-4">
		{#if members.data && members.data.length >= 2}
			<div>
				<label class="mb-1.5 block text-sm font-medium text-text-secondary">From</label>
				<select
					bind:value={fromMember}
					class="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary transition-colors focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
				>
					<option value="" disabled>Select payer</option>
					{#each members.data as member}
						<option value={member._id}>{member.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="mb-1.5 block text-sm font-medium text-text-secondary">To</label>
				<select
					bind:value={toMember}
					class="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary transition-colors focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
				>
					<option value="" disabled>Select recipient</option>
					{#each members.data as member}
						<option value={member._id} disabled={member._id === fromMember}>{member.name}</option>
					{/each}
				</select>
			</div>
		{/if}
		<Input
			bind:value={settleAmount}
			type="number"
			label="Amount ({getCurrencySymbol()})"
			placeholder="0.00"
		/>
		<Input bind:value={settleNotes} label="Notes (optional)" placeholder="e.g. Venmo, cash" />
		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={() => (showAddModal = false)}>Cancel</Button>
			<Button
				fullWidth
				disabled={submitting || !fromMember || !toMember || !settleAmount}
				onclick={recordSettlement}
			>
				{#if submitting}
					<span class="flex items-center justify-center gap-2">
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"
						></span>
						Saving...
					</span>
				{:else}
					Record
				{/if}
			</Button>
		</div>
	</div>
</Modal>
