<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { DollarSign, Plus, Trash2, Pencil, Search, Filter, Download } from '@lucide/svelte';
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
		{ symbol: 'د.ت', code: 'TND', name: 'Tunisian Dinar' },
		{ symbol: '¥', code: 'CNY', name: 'Chinese Yuan' },
		{ symbol: '₽', code: 'RUB', name: 'Russian Ruble' },
		{ symbol: '₺', code: 'TRY', name: 'Turkish Lira' },
		{ symbol: 'R', code: 'ZAR', name: 'South African Rand' },
		{ symbol: 'Rp', code: 'IDR', name: 'Indonesian Rupiah' },
		{ symbol: '₱', code: 'PHP', name: 'Philippine Peso' },
		{ symbol: '฿', code: 'THB', name: 'Thai Baht' },
		{ symbol: 'RM', code: 'MYR', name: 'Malaysian Ringgit' },
		{ symbol: 'S$', code: 'SGD', name: 'Singapore Dollar' },
		{ symbol: 'NZ$', code: 'NZD', name: 'New Zealand Dollar' },
		{ symbol: 'HK$', code: 'HKD', name: 'Hong Kong Dollar' },
		{ symbol: 'NT$', code: 'TWD', name: 'Taiwan Dollar' },
		{ symbol: 'Kč', code: 'CZK', name: 'Czech Koruna' },
		{ symbol: 'Ft', code: 'HUF', name: 'Hungarian Forint' },
		{ symbol: 'kr', code: 'SEK', name: 'Swedish Krona' },
		{ symbol: 'kr', code: 'NOK', name: 'Norwegian Krone' },
		{ symbol: 'kr', code: 'DKK', name: 'Danish Krone' },
		{ symbol: 'lei', code: 'RON', name: 'Romanian Leu' },
		{ symbol: 'лв', code: 'BGN', name: 'Bulgarian Lev' },
		{ symbol: 'kn', code: 'HRK', name: 'Croatian Kuna' },
		{ symbol: 'د.إ', code: 'AED', name: 'UAE Dirham' },
		{ symbol: '﷼', code: 'SAR', name: 'Saudi Riyal' },
		{ symbol: 'ر.ع', code: 'OMR', name: 'Omani Rial' },
		{ symbol: 'د.ك', code: 'KWD', name: 'Kuwaiti Dinar' },
		{ symbol: 'د.ب', code: 'BHD', name: 'Bahraini Dinar' },
		{ symbol: 'ر.ق', code: 'QAR', name: 'Qatari Riyal' },
		{ symbol: 'ج.م', code: 'EGP', name: 'Egyptian Pound' },
		{ symbol: 'د.ل', code: 'LYD', name: 'Libyan Dinar' },
		{ symbol: 'د.ج', code: 'DZD', name: 'Algerian Dinar' },
		{ symbol: 'د.م.', code: 'MAD', name: 'Moroccan Dirham' },
		{ symbol: 'N$', code: 'NGN', name: 'Nigerian Naira' },
		{ symbol: 'KSh', code: 'KES', name: 'Kenyan Shilling' },
		{ symbol: 'MT', code: 'MZN', name: 'Mozambican Metical' },
		{ symbol: 'Ar', code: 'MGA', name: 'Malagasy Ariary' },
		{ symbol: 'FBu', code: 'BIF', name: 'Burundian Franc' },
		{ symbol: 'FC', code: 'CDF', name: 'Congolese Franc' },
		{ symbol: 'CLP$', code: 'CLP', name: 'Chilean Peso' },
		{ symbol: 'COP$', code: 'COP', name: 'Colombian Peso' },
		{ symbol: 'S/.', code: 'PEN', name: 'Peruvian Sol' },
		{ symbol: 'Bs.', code: 'VES', name: 'Venezuelan Bolívar' },
		{ symbol: '₲', code: 'PYG', name: 'Paraguayan Guarani' },
		{ symbol: '$U', code: 'UYU', name: 'Uruguayan Peso' },
		{ symbol: 'Rs', code: 'PKR', name: 'Pakistani Rupee' },
		{ symbol: '৳', code: 'BDT', name: 'Bangladeshi Taka' },
		{ symbol: 'Rs', code: 'LKR', name: 'Sri Lankan Rupee' },
		{ symbol: 'NPRs', code: 'NPR', name: 'Nepalese Rupee' },
		{ symbol: 'MMK', code: 'MMK', name: 'Myanmar Kyat' },
		{ symbol: '₭', code: 'LAK', name: 'Lao Kip' },
		{ symbol: '៛', code: 'KHR', name: 'Cambodian Riel' },
		{ symbol: '₮', code: 'MNT', name: 'Mongolian Tugrik' },
		{ symbol: '₸', code: 'KZT', name: 'Kazakhstani Tenge' },
		{ symbol: 'лв', code: 'UZS', name: 'Uzbekistani Som' },
		{ symbol: 'GEL', code: 'GEL', name: 'Georgian Lari' },
		{ symbol: 'AMD', code: 'AMD', name: 'Armenian Dram' },
		{ symbol: '₴', code: 'UAH', name: 'Ukrainian Hryvnia' },
		{ symbol: 'RSD', code: 'RSD', name: 'Serbian Dinar' },
		{ symbol: 'MKD', code: 'MKD', name: 'Macedonian Denar' },
		{ symbol: 'ALL', code: 'ALL', name: 'Albanian Lek' },
		{ symbol: 'KM', code: 'BAM', name: 'Bosnia Mark' },
		{ symbol: '₼', code: 'AZN', name: 'Azerbaijani Manat' },
		{ symbol: 'Br', code: 'ETB', name: 'Ethiopian Birr' },
		{ symbol: 'GH₵', code: 'GHS', name: 'Ghanaian Cedi' },
		{ symbol: 'D', code: 'TWD', name: 'Tanzanian Shilling' },
		{ symbol: 'USh', code: 'UGX', name: 'Ugandan Shilling' },
		{ symbol: 'IQD', code: 'IQD', name: 'Iraqi Dinar' },
		{ symbol: '﷼', code: 'IRR', name: 'Iranian Rial' },
		{ symbol: 'JOD', code: 'JOD', name: 'Jordanian Dinar' },
		{ symbol: 'LBP', code: 'LBP', name: 'Lebanese Pound' },
		{ symbol: 'SYP', code: 'SYP', name: 'Syrian Pound' },
		{ symbol: 'YER', code: 'YER', name: 'Yemeni Rial' }
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
	let expenseDate = $state(Date.now());

	let searchQuery = $state('');
	let filterCategory = $state('');
	let filterMember = $state<Id<'members'> | ''>('');
	let filterDateFrom = $state('');
	let filterDateTo = $state('');
	let filterAmountMin = $state('');
	let filterAmountMax = $state('');
	let showFilters = $state(false);

	const filteredExpenses = $derived(
		(expenses.data ?? []).filter((e) => {
			if (
				searchQuery &&
				!e.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
				!(e.category ?? '').toLowerCase().includes(searchQuery.toLowerCase())
			)
				return false;
			if (filterCategory && e.category !== filterCategory) return false;
			if (filterMember && e.paidBy !== filterMember) return false;
			if (filterDateFrom) {
				const from = new Date(filterDateFrom).getTime();
				if (e.date < from) return false;
			}
			if (filterDateTo) {
				const to = new Date(filterDateTo + 'T23:59:59').getTime();
				if (e.date > to) return false;
			}
			if (filterAmountMin && e.amount < parseFloat(filterAmountMin)) return false;
			if (filterAmountMax && e.amount > parseFloat(filterAmountMax)) return false;
			return true;
		})
	);

	const categories = $derived([
		...new Set((expenses.data ?? []).map((e) => e.category).filter(Boolean))
	] as string[]);

	function exportCSV() {
		if (!filteredExpenses.length) return;
		const headers = ['Date', 'Description', 'Category', 'Amount', 'Paid By', 'Split Type'];
		const rows = filteredExpenses.map((e) => [
			new Date(e.date).toLocaleDateString('en-US'),
			`"${e.description}"`,
			e.category || '',
			e.amount.toFixed(2),
			e.payerName,
			e.splitType
		]);
		const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${group.data?.name ?? 'expenses'}-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function clearFilters() {
		searchQuery = '';
		filterCategory = '';
		filterMember = '';
		filterDateFrom = '';
		filterDateTo = '';
		filterAmountMin = '';
		filterAmountMax = '';
	}

	onMount(() => {
		client = useConvexClient();
	});

	function getCurrencySymbol(): string {
		if (!group.data?.currency) return '$';
		const found = CURRENCIES.find((c) => c.code === group.data!.currency);
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
		expenseDate = Date.now();
		showAddModal = true;
	}

	function openEditModal(expense: any) {
		if (!members.data || members.data.length === 0) return;
		editingExpense = expense;
		description = expense.description;
		amount = expense.amount.toString();
		category = expense.category || '';
		paidBy = expense.paidBy;
		splitType = expense.splitType || 'equal';
		splitAmong = expense.splitAmong || members.data.map((m: any) => m._id);
		expenseDate = expense.date || Date.now();
		if (expense.splitDetails) {
			splitDetails = expense.splitDetails.map((d: any) => ({
				memberId: d.memberId,
				value: d.value.toString()
			}));
		} else {
			splitDetails = members.data.map((m: any) => ({ memberId: m._id, value: '' }));
		}
		showEditModal = true;
	}

	function getSplitValue(memberId: Id<'members'>): string {
		return splitDetails.find((d) => d.memberId === memberId)?.value ?? '';
	}

	function setSplitValue(memberId: Id<'members'>, value: string) {
		const detail = splitDetails.find((d) => d.memberId === memberId);
		if (detail) {
			detail.value = value;
		}
	}

	function toggleSplit(memberId: Id<'members'>) {
		if (splitAmong.includes(memberId)) {
			splitAmong = splitAmong.filter((id) => id !== memberId);
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
					date: expenseDate,
					notes: undefined
				});
			} else if (splitType === 'exact') {
				const details = splitDetails
					.filter((d) => parseFloat(d.value) > 0)
					.map((d) => ({ memberId: d.memberId, value: parseFloat(d.value) }));
				await client.mutation(api.expenses.createExact, {
					groupId,
					description: description.trim(),
					amount: amt,
					paidBy,
					splitDetails: details,
					category: category.trim() || undefined,
					date: expenseDate,
					notes: undefined
				});
			} else {
				const details = splitDetails
					.filter((d) => parseFloat(d.value) > 0)
					.map((d) => ({ memberId: d.memberId, value: parseFloat(d.value) }));
				await client.mutation(api.expenses.createPercentage, {
					groupId,
					description: description.trim(),
					amount: amt,
					paidBy,
					splitDetails: details,
					category: category.trim() || undefined,
					date: expenseDate,
					notes: undefined
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
			const updates: any = {
				expenseId: editingExpense._id,
				description: description.trim(),
				amount: amt,
				paidBy,
				category: category.trim() || undefined,
				date: expenseDate,
				splitAmong,
				splitType
			};
			if (splitType === 'exact' || splitType === 'percentage') {
				updates.splitDetails = splitDetails
					.filter((d) => parseFloat(d.value) > 0)
					.map((d) => ({ memberId: d.memberId, value: parseFloat(d.value) }));
			}
			await client.mutation(api.expenses.update, updates);
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
		expenseDate = Date.now();
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
		<Input
			bind:value={description}
			label="Description"
			placeholder="e.g. Groceries, Rent, Dinner"
		/>
		<div class="grid grid-cols-2 gap-3">
			<Input
				bind:value={amount}
				type="number"
				label="Amount ({getCurrencySymbol()})"
				placeholder="0.00"
			/>
			<Input bind:value={category} label="Category" placeholder="e.g. Food" />
		</div>
		<div>
			<label class="mb-1.5 block text-sm font-medium text-text-secondary">Date</label>
			<input
				type="date"
				value={new Date(expenseDate).toISOString().split('T')[0]}
				oninput={(e) => {
					expenseDate = new Date((e.target as HTMLInputElement).value).getTime();
				}}
				class="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary transition-colors focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
			/>
		</div>

		{#if members.data && members.data.length > 0}
			<div>
				<label class="mb-1.5 block text-sm font-medium text-text-secondary">Paid by</label>
				<select
					bind:value={paidBy}
					class="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary transition-colors focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
				>
					{#each members.data as member}
						<option value={member._id}>{member.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="mb-1.5 block text-sm font-medium text-text-secondary">Split type</label>
				<div class="flex gap-1 rounded-md border border-border bg-surface-raised p-1">
					<button
						type="button"
						onclick={() => (splitType = 'equal')}
						class="flex-1 rounded py-1.5 text-xs font-medium transition-colors {splitType ===
						'equal'
							? 'bg-accent text-black'
							: 'text-text-secondary hover:text-text-primary'}">Equal</button
					>
					<button
						type="button"
						onclick={() => (splitType = 'exact')}
						class="flex-1 rounded py-1.5 text-xs font-medium transition-colors {splitType ===
						'exact'
							? 'bg-accent text-black'
							: 'text-text-secondary hover:text-text-primary'}">Exact</button
					>
					<button
						type="button"
						onclick={() => (splitType = 'percentage')}
						class="flex-1 rounded py-1.5 text-xs font-medium transition-colors {splitType ===
						'percentage'
							? 'bg-accent text-black'
							: 'text-text-secondary hover:text-text-primary'}">%</button
					>
				</div>
			</div>

			{#if splitType === 'equal'}
				<div>
					<label class="mb-1.5 block text-sm font-medium text-text-secondary">Split among</label>
					<div class="flex flex-wrap gap-2">
						{#each members.data as member}
							<button
								type="button"
								onclick={() => toggleSplit(member._id)}
								class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {splitAmong.includes(
									member._id
								)
									? 'border-accent bg-accent-dim text-accent'
									: 'border-border text-text-secondary hover:border-border-hover'}"
							>
								{member.name}
							</button>
						{/each}
					</div>
					{#if splitAmong.length > 0}
						<p class="mt-2 text-xs text-text-muted">
							{splitAmong.length} people &middot; {formatCurrency(getShareAmount())} each
						</p>
					{/if}
				</div>
			{:else}
				<div>
					<label class="mb-1.5 block text-sm font-medium text-text-secondary">
						{splitType === 'exact'
							? `Amount per person (${getCurrencySymbol()})`
							: 'Percentage per person (%)'}
					</label>
					<div class="space-y-2">
						{#each members.data as member}
							<div class="flex items-center gap-2">
								<span class="w-24 truncate text-sm text-text-secondary">{member.name}</span>
								<input
									type="number"
									value={getSplitValue(member._id)}
									oninput={(e) => setSplitValue(member._id, (e.target as HTMLInputElement).value)}
									placeholder={splitType === 'exact' ? '0.00' : '0'}
									class="flex-1 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
								/>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}

		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={resetForm}>Cancel</Button>
			<Button
				fullWidth
				disabled={submitting || !description.trim() || !amount}
				onclick={submitExpense}
			>
				{#if submitting}
					<span class="flex items-center justify-center gap-2">
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"
						></span>
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
		<Input
			bind:value={description}
			label="Description"
			placeholder="e.g. Groceries, Rent, Dinner"
		/>
		<div class="grid grid-cols-2 gap-3">
			<Input
				bind:value={amount}
				type="number"
				label="Amount ({getCurrencySymbol()})"
				placeholder="0.00"
			/>
			<Input bind:value={category} label="Category" placeholder="e.g. Food" />
		</div>
		<div>
			<label class="mb-1.5 block text-sm font-medium text-text-secondary">Date</label>
			<input
				type="date"
				value={new Date(expenseDate).toISOString().split('T')[0]}
				oninput={(e) => {
					expenseDate = new Date((e.target as HTMLInputElement).value).getTime();
				}}
				class="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary transition-colors focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
			/>
		</div>

		{#if members.data && members.data.length > 0}
			<div>
				<label class="mb-1.5 block text-sm font-medium text-text-secondary">Paid by</label>
				<select
					bind:value={paidBy}
					class="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary transition-colors focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
				>
					{#each members.data as member}
						<option value={member._id}>{member.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="mb-1.5 block text-sm font-medium text-text-secondary">Split type</label>
				<div class="flex gap-1 rounded-md border border-border bg-surface-raised p-1">
					<button
						type="button"
						onclick={() => (splitType = 'equal')}
						class="flex-1 rounded py-1.5 text-xs font-medium transition-colors {splitType ===
						'equal'
							? 'bg-accent text-black'
							: 'text-text-secondary hover:text-text-primary'}">Equal</button
					>
					<button
						type="button"
						onclick={() => (splitType = 'exact')}
						class="flex-1 rounded py-1.5 text-xs font-medium transition-colors {splitType ===
						'exact'
							? 'bg-accent text-black'
							: 'text-text-secondary hover:text-text-primary'}">Exact</button
					>
					<button
						type="button"
						onclick={() => (splitType = 'percentage')}
						class="flex-1 rounded py-1.5 text-xs font-medium transition-colors {splitType ===
						'percentage'
							? 'bg-accent text-black'
							: 'text-text-secondary hover:text-text-primary'}">%</button
					>
				</div>
			</div>

			{#if splitType === 'equal'}
				<div>
					<label class="mb-1.5 block text-sm font-medium text-text-secondary">Split among</label>
					<div class="flex flex-wrap gap-2">
						{#each members.data as member}
							<button
								type="button"
								onclick={() => toggleSplit(member._id)}
								class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {splitAmong.includes(
									member._id
								)
									? 'border-accent bg-accent-dim text-accent'
									: 'border-border text-text-secondary hover:border-border-hover'}"
							>
								{member.name}
							</button>
						{/each}
					</div>
					{#if splitAmong.length > 0}
						<p class="mt-2 text-xs text-text-muted">
							{splitAmong.length} people &middot; {formatCurrency(getShareAmount())} each
						</p>
					{/if}
				</div>
			{:else}
				<div>
					<label class="mb-1.5 block text-sm font-medium text-text-secondary">
						{splitType === 'exact'
							? `Amount per person (${getCurrencySymbol()})`
							: 'Percentage per person (%)'}
					</label>
					<div class="space-y-2">
						{#each members.data as member}
							<div class="flex items-center gap-2">
								<span class="w-24 truncate text-sm text-text-secondary">{member.name}</span>
								<input
									type="number"
									value={getSplitValue(member._id)}
									oninput={(e) => setSplitValue(member._id, (e.target as HTMLInputElement).value)}
									placeholder={splitType === 'exact' ? '0.00' : '0'}
									class="flex-1 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
								/>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}

		<div class="flex gap-2 pt-2">
			<Button
				variant="ghost"
				fullWidth
				onclick={() => {
					showEditModal = false;
					editingExpense = null;
				}}>Cancel</Button
			>
			<Button
				fullWidth
				disabled={submitting || !description.trim() || !amount}
				onclick={updateExpense}
			>
				{#if submitting}
					<span class="flex items-center justify-center gap-2">
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"
						></span>
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
				<p class="text-xs text-text-muted">
					{filteredExpenses.length} of {expenses.data.length} expense{expenses.data.length !== 1
						? 's'
						: ''}
				</p>
			{/if}
		</div>
		<div class="flex gap-2">
			<Button variant="secondary" size="sm" onclick={exportCSV} disabled={!filteredExpenses.length}>
				<span class="flex items-center gap-1.5">
					<Download size={14} />
					Export
				</span>
			</Button>
			<Button
				size="sm"
				onclick={openAddModal}
				disabled={!members.data || members.data.length === 0}
			>
				<span class="flex items-center gap-1.5">
					<Plus size={14} />
					Add
				</span>
			</Button>
		</div>
	</div>

	<!-- Search and Filters -->
	<div class="space-y-2">
		<div class="flex gap-2">
			<div class="relative flex-1">
				<Search
					size={16}
					class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
				/>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search expenses..."
					class="w-full rounded-md border border-border bg-surface-raised py-2 pr-3 pl-9 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
				/>
			</div>
			<button
				type="button"
				onclick={() => (showFilters = !showFilters)}
				class="rounded-md border border-border px-3 py-2 text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary {showFilters ||
				filterCategory ||
				filterMember ||
				filterDateFrom ||
				filterDateTo ||
				filterAmountMin ||
				filterAmountMax
					? 'border-accent text-accent'
					: ''}"
			>
				<Filter size={16} />
			</button>
		</div>

		{#if showFilters}
			<div class="space-y-2 rounded-lg border border-border bg-surface p-3">
				<div class="grid grid-cols-2 gap-2">
					<select
						bind:value={filterCategory}
						class="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
					>
						<option value="">All categories</option>
						{#each categories as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
					{#if members.data}
						<select
							bind:value={filterMember}
							class="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
						>
							<option value="">All members</option>
							{#each members.data as member}
								<option value={member._id}>{member.name}</option>
							{/each}
						</select>
					{/if}
				</div>
				<div class="grid grid-cols-2 gap-2">
					<input
						type="date"
						bind:value={filterDateFrom}
						placeholder="From date"
						class="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
					/>
					<input
						type="date"
						bind:value={filterDateTo}
						placeholder="To date"
						class="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
					/>
				</div>
				<div class="grid grid-cols-2 gap-2">
					<input
						type="number"
						bind:value={filterAmountMin}
						placeholder="Min amount"
						class="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
					/>
					<input
						type="number"
						bind:value={filterAmountMax}
						placeholder="Max amount"
						class="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
					/>
				</div>
				<button type="button" onclick={clearFilters} class="text-xs text-accent hover:underline"
					>Clear all filters</button
				>
			</div>
		{/if}
	</div>

	{#if expenses.isLoading || members.isLoading}
		<div class="space-y-2">
			{#each [1, 2, 3] as _}
				<div class="animate-pulse rounded-lg border border-border bg-surface p-4">
					<div class="flex justify-between">
						<div class="space-y-2">
							<div class="h-4 w-32 rounded bg-surface-raised"></div>
							<div class="h-3 w-20 rounded bg-surface-raised"></div>
						</div>
						<div class="h-4 w-16 rounded bg-surface-raised"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if filteredExpenses.length > 0}
		<div class="space-y-2">
			{#each filteredExpenses as expense (expense._id)}
				<div
					class="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-hover"
				>
					<div class="flex items-center justify-between">
						<div class="min-w-0 flex-1">
							<p class="truncate font-medium text-text-primary">{expense.description}</p>
							<p class="mt-0.5 text-xs text-text-muted">
								{expense.payerName} &middot; {formatDate(expense.date)}
								{#if expense.category}
									<span class="ml-1 rounded bg-surface-raised px-1.5 py-0.5 text-[10px]"
										>{expense.category}</span
									>
								{/if}
							</p>
						</div>
						<div class="flex items-center gap-2">
							<span class="font-mono text-sm font-medium">{formatCurrency(expense.amount)}</span>
							<button
								type="button"
								onclick={() => openEditModal(expense)}
								class="rounded p-1.5 text-text-muted opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-raised hover:text-text-primary"
								title="Edit expense"
							>
								<Pencil size={14} />
							</button>
							<button
								type="button"
								onclick={() => deleteExpense(expense._id)}
								class="rounded p-1.5 text-text-muted opacity-0 transition-all group-hover:opacity-100 hover:bg-danger-dim hover:text-danger"
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
		<div class="rounded-lg border border-dashed border-border py-16 text-center">
			<DollarSign size={32} class="mx-auto mb-3 text-text-muted" />
			<p class="text-sm text-text-secondary">
				{#if searchQuery || filterCategory || filterMember || filterDateFrom || filterDateTo || filterAmountMin || filterAmountMax}
					No matching expenses
				{:else}
					No expenses yet
				{/if}
			</p>
			<p class="mt-1 text-xs text-text-muted">
				{#if searchQuery || filterCategory || filterMember || filterDateFrom || filterDateTo || filterAmountMin || filterAmountMax}
					Try adjusting your filters
				{:else}
					Add the first expense to get started
				{/if}
			</p>
		</div>
	{/if}
</div>
