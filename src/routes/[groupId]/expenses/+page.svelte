<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { DollarSign, Plus, Trash2, Pencil } from '@lucide/svelte';
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
		{ symbol: 'zł', code: 'PLN', name: 'Polish Zloty' },
	];

	let groupId = $derived($page.params.groupId as Id<'groups'>);
	let client: ReturnType<typeof useConvexClient>;

	const group = useQuery(api.groups.get, () => (groupId ? { groupId } : 'skip'));
	const members = useQuery(api.members.listByGroup, () => (groupId ? { groupId } : 'skip'));
	const expenses = useQuery(api.expenses.listByGroup, () => (groupId ? { groupId } : 'skip'));

	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let editingExpense = $state<any>(null);
	let description = $state('');
	let amount = $state('');
	let category = $state('');
	let paidBy = $state('' as Id<'members'>);
	let splitType = $state<'equal' | 'exact' | 'percentage'>('equal');
	let splitAmong = $state<Id<'members'>[]>([]);
	let splitDetails = $state<{ memberId: Id<'members'>; value: string }[]>([]);
	let submitting = $state(false);

	onMount(() => {
		client = useConvexClient();
	});

	function getCurrencySymbol(): string {
		if (!group.data?.currency) return '$';
		const found = CURRENCIES.find(c => c.code === group.data!.currency);
		return found?.symbol ?? '$';
	}

	function formatCurrency(n: number): string {
		return `${getCurrencySymbol()}${n.toFixed(2)}`;
	}

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function openAddModal() {
		if (!members.data || members.data.length === 0) return;
		paidBy = members.data[0]._id;
		splitAmong = members.data.map((m: any) => m._id);
		splitDetails = members.data.map((m: any) => ({ memberId: m._id, value: '' }));
		description = '';
		amount = '';
		category = '';
		splitType = 'equal';
		showAddModal = true;
	}

	function openEditModal(expense: any) {
		if (!members.data || members.data.length === 0) return;
		editingExpense = expense;
		description = expense.description;
		amount = expense.amount.toString();
		category = expense.category || '';
		paidBy = expense.paidBy;
		splitType = expense.splitType;
		splitAmong = expense.splitAmong;
		if (expense.splitDetails) {
			splitDetails = expense.splitDetails.map((d: any) => ({ memberId: d.memberId, value: d.value.toString() }));
		} else {
			splitDetails = members.data.map((m: any) => ({ memberId: m._id, value: '' }));
		}
		showEditModal = true;
	}

	function getSplitValue(memberId: Id<'members'>): string {
		return splitDetails.find(d => d.memberId === memberId)?.value ?? '';
	}

	function setSplitValue(memberId: Id<'members'>, value: string) {
		const detail = splitDetails.find(d => d.memberId === memberId);
		if (detail) {
			detail.value = value;
		}
	}

	function toggleSplit(memberId: Id<'members'>) {
		if (splitAmong.includes(memberId)) {
			splitAmong = splitAmong.filter(id => id !== memberId);
		} else {
			splitAmong = [...splitAmong, memberId];
		}
	}

	function getShareAmount(): number {
		const amt = parseFloat(amount) || 0;
		if (splitType === 'equal') {
			return splitAmong.length > 0 ? amt / splitAmong.length : 0;
		}
		return 0;
	}

	async function submitExpense() {
		if (!description.trim() || !amount || !paidBy || splitAmong.length === 0) return;
		submitting = true;
		try {
			const amt = parseFloat(amount);
			if (splitType === 'equal') {
				await client.mutation(api.expenses.createEqual, {
					groupId,
					description: description.trim(),
					amount: amt,
					paidBy,
					splitAmong,
					category: category.trim() || undefined,
					date: Date.now()
				});
			} else if (splitType === 'exact') {
				const details = splitDetails
					.filter(d => parseFloat(d.value) > 0)
					.map(d => ({ memberId: d.memberId, value: parseFloat(d.value) }));
				await client.mutation(api.expenses.createExact, {
					groupId,
					description: description.trim(),
					amount: amt,
					paidBy,
					splitDetails: details,
					category: category.trim() || undefined,
					date: Date.now()
				});
			} else {
				const details = splitDetails
					.filter(d => parseFloat(d.value) > 0)
					.map(d => ({ memberId: d.memberId, value: parseFloat(d.value) }));
				await client.mutation(api.expenses.createPercentage, {
					groupId,
					description: description.trim(),
					amount: amt,
					paidBy,
					splitDetails: details,
					category: category.trim() || undefined,
					date: Date.now()
				});
			}
			resetForm();
		} catch (e) {
			console.error('Failed to create expense:', e);
		} finally {
			submitting = false;
		}
	}

	async function updateExpense() {
		if (!editingExpense || !description.trim() || !amount) return;
		submitting = true;
		try {
			const amt = parseFloat(amount);
			await client.mutation(api.expenses.update, {
				expenseId: editingExpense._id,
				description: description.trim(),
				amount: amt,
				paidBy,
				category: category.trim() || undefined,
				date: editingExpense.date
			});
			showEditModal = false;
			editingExpense = null;
		} catch (e) {
			console.error('Failed to update expense:', e);
		} finally {
			submitting = false;
		}
	}

	function resetForm() {
		showAddModal = false;
		description = '';
		amount = '';
		category = '';
		splitType = 'equal';
		splitAmong = [];
		splitDetails = [];
	}

	async function deleteExpense(expenseId: Id<'expenses'>) {
		await client.mutation(api.expenses.remove, { expenseId });
	}
</script>

<svelte:head>
	<title>Expenses - WeSplit</title>
</svelte:head>

<Modal bind:open={showAddModal} title="Add expense" size="lg">
	<div class="space-y-4">
		<Input bind:value={description} label="Description" placeholder="e.g. Groceries, Rent, Dinner" />
		<div class="grid grid-cols-2 gap-3">
			<Input bind:value={amount} type="number" label="Amount ({getCurrencySymbol()})" placeholder="0.00" />
			<Input bind:value={category} label="Category" placeholder="e.g. Food" />
		</div>

		{#if members.data && members.data.length > 0}
			<div>
				<label class="block text-sm font-medium text-text-secondary mb-1.5">Paid by</label>
				<select bind:value={paidBy} class="w-full px-3 py-2 text-sm bg-surface-raised border border-border rounded-md text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors">
					{#each members.data as member}
						<option value={member._id}>{member.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-sm font-medium text-text-secondary mb-1.5">Split type</label>
				<div class="flex gap-1 bg-surface-raised border border-border rounded-md p-1">
					<button type="button" onclick={() => splitType = 'equal'} class="flex-1 py-1.5 text-xs font-medium rounded transition-colors {splitType === 'equal' ? 'bg-accent text-black' : 'text-text-secondary hover:text-text-primary'}">Equal</button>
					<button type="button" onclick={() => splitType = 'exact'} class="flex-1 py-1.5 text-xs font-medium rounded transition-colors {splitType === 'exact' ? 'bg-accent text-black' : 'text-text-secondary hover:text-text-primary'}">Exact</button>
					<button type="button" onclick={() => splitType = 'percentage'} class="flex-1 py-1.5 text-xs font-medium rounded transition-colors {splitType === 'percentage' ? 'bg-accent text-black' : 'text-text-secondary hover:text-text-primary'}">%</button>
				</div>
			</div>

			{#if splitType === 'equal'}
				<div>
					<label class="block text-sm font-medium text-text-secondary mb-1.5">Split among</label>
					<div class="flex flex-wrap gap-2">
						{#each members.data as member}
							<button
								type="button"
								onclick={() => toggleSplit(member._id)}
								class="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors {splitAmong.includes(member._id) ? 'bg-accent-dim border-accent text-accent' : 'border-border text-text-secondary hover:border-border-hover'}"
							>
								{member.name}
							</button>
						{/each}
					</div>
					{#if splitAmong.length > 0}
						<p class="mt-2 text-xs text-text-muted">{splitAmong.length} people &middot; {formatCurrency(getShareAmount())} each</p>
					{/if}
				</div>
			{:else}
				<div>
					<label class="block text-sm font-medium text-text-secondary mb-1.5">
						{splitType === 'exact' ? `Amount per person (${getCurrencySymbol()})` : 'Percentage per person (%)'}
					</label>
					<div class="space-y-2">
						{#each members.data as member}
							<div class="flex items-center gap-2">
								<span class="text-sm text-text-secondary w-24 truncate">{member.name}</span>
								<input
									type="number"
									value={getSplitValue(member._id)}
									oninput={(e) => setSplitValue(member._id, (e.target as HTMLInputElement).value)}
									placeholder={splitType === 'exact' ? '0.00' : '0'}
									class="flex-1 px-3 py-1.5 text-sm bg-surface-raised border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
								/>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}

		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={resetForm}>Cancel</Button>
			<Button fullWidth disabled={submitting || !description.trim() || !amount} onclick={submitExpense}>
				{#if submitting}
					<span class="flex items-center justify-center gap-2">
						<span class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
						Adding...
					</span>
				{:else}
					Add Expense
				{/if}
			</Button>
		</div>
	</div>
</Modal>

<Modal bind:open={showEditModal} title="Edit expense" size="lg">
	<div class="space-y-4">
		<Input bind:value={description} label="Description" placeholder="e.g. Groceries, Rent, Dinner" />
		<div class="grid grid-cols-2 gap-3">
			<Input bind:value={amount} type="number" label="Amount ({getCurrencySymbol()})" placeholder="0.00" />
			<Input bind:value={category} label="Category" placeholder="e.g. Food" />
		</div>

		{#if members.data && members.data.length > 0}
			<div>
				<label class="block text-sm font-medium text-text-secondary mb-1.5">Paid by</label>
				<select bind:value={paidBy} class="w-full px-3 py-2 text-sm bg-surface-raised border border-border rounded-md text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors">
					{#each members.data as member}
						<option value={member._id}>{member.name}</option>
					{/each}
				</select>
			</div>
		{/if}

		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={() => { showEditModal = false; editingExpense = null; }}>Cancel</Button>
			<Button fullWidth disabled={submitting || !description.trim() || !amount} onclick={updateExpense}>
				{#if submitting}
					<span class="flex items-center justify-center gap-2">
						<span class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
						Saving...
					</span>
				{:else}
					Save Changes
				{/if}
			</Button>
		</div>
	</div>
</Modal>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-lg font-semibold">Expenses</h2>
			{#if expenses.data}
				<p class="text-xs text-text-muted">{expenses.data.length} expense{expenses.data.length !== 1 ? 's' : ''}</p>
			{/if}
		</div>
		<Button size="sm" onclick={openAddModal} disabled={!members.data || members.data.length === 0}>
			<span class="flex items-center gap-1.5">
				<Plus size={14} />
				Add
			</span>
		</Button>
	</div>

	{#if expenses.isLoading || members.isLoading}
		<div class="space-y-2">
			{#each [1, 2, 3] as _}
				<div class="p-4 bg-surface border border-border rounded-lg animate-pulse">
					<div class="flex justify-between">
						<div class="space-y-2">
							<div class="h-4 bg-surface-raised rounded w-32"></div>
							<div class="h-3 bg-surface-raised rounded w-20"></div>
						</div>
						<div class="h-4 bg-surface-raised rounded w-16"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if expenses.data && expenses.data.length > 0}
		<div class="space-y-2">
			{#each expenses.data as expense (expense._id)}
				<div class="p-4 bg-surface border border-border rounded-lg group hover:border-border-hover transition-colors">
					<div class="flex items-center justify-between">
						<div class="flex-1 min-w-0">
							<p class="font-medium text-text-primary truncate">{expense.description}</p>
							<p class="text-xs text-text-muted mt-0.5">
								{expense.payerName} &middot; {formatDate(expense.date)}
								{#if expense.category}
									<span class="ml-1 px-1.5 py-0.5 bg-surface-raised rounded text-[10px]">{expense.category}</span>
								{/if}
							</p>
						</div>
						<div class="flex items-center gap-2">
							<span class="font-mono text-sm font-medium">{formatCurrency(expense.amount)}</span>
							<button
								type="button"
								onclick={() => openEditModal(expense)}
								class="p-1.5 text-text-muted opacity-0 group-hover:opacity-100 hover:text-text-primary hover:bg-surface-raised rounded transition-all"
								title="Edit expense"
							>
								<Pencil size={14} />
							</button>
							<button
								type="button"
								onclick={() => deleteExpense(expense._id)}
								class="p-1.5 text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-danger-dim rounded transition-all"
								title="Delete expense"
							>
								<Trash2 size={14} />
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-16 border border-border border-dashed rounded-lg">
			<DollarSign size={32} class="mx-auto text-text-muted mb-3" />
			<p class="text-text-secondary text-sm">No expenses yet</p>
			<p class="text-text-muted text-xs mt-1">Add the first expense to get started</p>
		</div>
	{/if}
</div>
