<script lang="ts">
	import { page } from '$app/stores';
	import {
		DollarSign,
		Users,
		HandCoins,
		TrendingUp,
		ArrowUpRight,
		ArrowDownLeft,
		Calculator
	} from '@lucide/svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	import type { Id } from '../../convex/_generated/dataModel';

	let groupId = $derived($page.params.groupId as Id<'groups'>);

	const group = useQuery(api.groups.get, () => (groupId ? { groupId } : 'skip'));
	const summary = useQuery(api.balances.getGroupSummary, () => (groupId ? { groupId } : 'skip'));
	const balances = useQuery(api.balances.getMemberBalances, () => (groupId ? { groupId } : 'skip'));
	const optimized = useQuery(api.balances.getOptimizedSettlements, () =>
		groupId ? { groupId } : 'skip'
	);

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

	function getCurrencySymbol(): string {
		if (!group.data?.currency) return '$';
		const found = CURRENCIES.find((c) => c.code === group.data!.currency);
		return found?.symbol ?? '$';
	}

	function formatCurrency(n: number): string {
		return `${getCurrencySymbol()}${n.toFixed(2)}`;
	}
</script>

<svelte:head>
	<title>{group.data?.name ?? 'Group'} - WeSplit</title>
</svelte:head>

{#if summary.isLoading}
	<div class="space-y-4">
		<div class="h-8 w-48 animate-pulse rounded bg-surface-raised"></div>
		<div class="grid grid-cols-2 gap-3">
			{#each [1, 2, 3, 4] as _}
				<div class="animate-pulse rounded-lg border border-border bg-surface p-4">
					<div class="mb-2 h-4 w-20 rounded bg-surface-raised"></div>
					<div class="h-6 w-24 rounded bg-surface-raised"></div>
				</div>
			{/each}
		</div>
	</div>
{:else if summary.data}
	<div class="space-y-6">
		<!-- Group Header -->
		<div>
			<h1 class="text-xl font-bold">{group.data?.name}</h1>
			{#if group.data?.description}
				<p class="mt-1 text-sm text-text-secondary">{group.data.description}</p>
			{/if}
		</div>

		<!-- Stats Grid -->
		<div class="grid grid-cols-2 gap-3">
			<div class="rounded-lg border border-border bg-surface p-4">
				<div class="mb-2 flex items-center gap-2">
					<DollarSign size={16} class="text-accent" />
					<span class="text-xs text-text-secondary">Total</span>
				</div>
				<p class="font-mono text-xl font-bold">{formatCurrency(summary.data.totalExpenses)}</p>
				<p class="mt-1 text-xs text-text-muted">
					{summary.data.expenseCount} expense{summary.data.expenseCount !== 1 ? 's' : ''}
				</p>
			</div>

			<div class="rounded-lg border border-border bg-surface p-4">
				<div class="mb-2 flex items-center gap-2">
					<HandCoins size={16} class="text-success" />
					<span class="text-xs text-text-secondary">Settled</span>
				</div>
				<p class="font-mono text-xl font-bold">{formatCurrency(summary.data.totalSettled)}</p>
				<p class="mt-1 text-xs text-text-muted">
					{summary.data.settlementCount} payment{summary.data.settlementCount !== 1 ? 's' : ''}
				</p>
			</div>

			<div class="rounded-lg border border-border bg-surface p-4">
				<div class="mb-2 flex items-center gap-2">
					<Users size={16} class="text-accent" />
					<span class="text-xs text-text-secondary">Members</span>
				</div>
				<p class="text-xl font-bold">{summary.data.memberCount}</p>
				<p class="mt-1 text-xs text-text-muted">
					{formatCurrency(summary.data.perPersonAverage)} avg/person
				</p>
			</div>

			<div class="rounded-lg border border-border bg-surface p-4">
				<div class="mb-2 flex items-center gap-2">
					<TrendingUp size={16} class="text-warning" />
					<span class="text-xs text-text-secondary">Avg expense</span>
				</div>
				<p class="font-mono text-xl font-bold">{formatCurrency(summary.data.averageExpense)}</p>
			</div>
		</div>

		<!-- Category Breakdown -->
		{#if summary.data.categoryBreakdown.length > 0}
			<div>
				<h2 class="mb-3 text-lg font-semibold">By Category</h2>
				<div class="space-y-2">
					{#each summary.data.categoryBreakdown.sort((a, b) => b.total - a.total) as cat}
						<div class="flex items-center gap-3">
							<span class="w-28 truncate text-sm text-text-secondary">{cat.category}</span>
							<div class="h-2 flex-1 overflow-hidden rounded-full bg-surface-raised">
								<div class="h-full rounded-full bg-accent" style="width: {cat.percentage}%"></div>
							</div>
							<span class="w-20 text-right font-mono text-sm">{formatCurrency(cat.total)}</span>
							<span class="w-12 text-right text-xs text-text-muted"
								>{cat.percentage.toFixed(0)}%</span
							>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Balances -->
		{#if balances.data && balances.data.length > 0}
			<div>
				<h2 class="mb-3 text-lg font-semibold">Balances</h2>
				<div class="space-y-2">
					{#each balances.data as b (b.memberId)}
						<div
							class="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
						>
							<span class="text-sm font-medium">{b.memberName}</span>
							{#if Math.abs(b.balance) < 0.01}
								<span class="font-mono text-xs text-text-muted">settled</span>
							{:else if b.balance > 0}
								<span class="font-mono text-xs text-accent">+{formatCurrency(b.balance)}</span>
							{:else}
								<span class="font-mono text-xs text-danger">-{formatCurrency(b.balance)}</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Settlement Plan -->
		{#if optimized.data && optimized.data.length > 0}
			<div>
				<h2 class="mb-3 text-lg font-semibold">Settlement Plan</h2>
				<p class="mb-3 text-xs text-text-muted">Minimum transactions to settle all debts</p>
				<div class="space-y-2">
					{#each optimized.data as s (s.from + s.to)}
						<div class="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
							<div class="rounded-md bg-danger-dim p-1.5">
								<ArrowUpRight size={14} class="text-danger" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm">
									<span class="text-text-secondary">{s.fromName}</span>
									<span class="mx-1 text-text-muted">pays</span>
									<span class="text-text-primary">{s.toName}</span>
								</p>
							</div>
							<span class="font-mono text-sm font-medium">{formatCurrency(s.amount)}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
