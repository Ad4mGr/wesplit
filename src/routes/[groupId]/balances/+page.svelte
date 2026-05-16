<script lang="ts">
	import { page } from '$app/stores';
	import { Calculator, ArrowUpRight, ArrowDownLeft } from '@lucide/svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '../../../convex/_generated/dataModel';

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
		{ symbol: 'D', code: 'TZS', name: 'Tanzanian Shilling' },
		{ symbol: 'USh', code: 'UGX', name: 'Ugandan Shilling' },
		{ symbol: 'IQD', code: 'IQD', name: 'Iraqi Dinar' },
		{ symbol: '﷼', code: 'IRR', name: 'Iranian Rial' },
		{ symbol: 'JOD', code: 'JOD', name: 'Jordanian Dinar' },
		{ symbol: 'LBP', code: 'LBP', name: 'Lebanese Pound' },
		{ symbol: 'SYP', code: 'SYP', name: 'Syrian Pound' },
		{ symbol: 'YER', code: 'YER', name: 'Yemeni Rial' },
	];

	let groupId = $derived($page.params.groupId as Id<'groups'>);

	const balances = useQuery(api.balances.getMemberBalances, () => (groupId ? { groupId } : 'skip'));
	const debts = useQuery(api.balances.getDetailedDebts, () => (groupId ? { groupId } : 'skip'));
	const optimized = useQuery(api.balances.getOptimizedSettlements, () =>
		groupId ? { groupId } : 'skip'
	);
	const group = useQuery(api.groups.get, () => (groupId ? { groupId } : 'skip'));

	function getCurrencySymbol(): string {
		if (!group.data?.currency) return '$';
		const found = CURRENCIES.find((c) => c.code === group.data!.currency);
		return found?.symbol ?? '$';
	}

	function formatCurrency(n: number): string {
		return `${getCurrencySymbol()}${Math.abs(n).toFixed(2)}`;
	}
</script>

<svelte:head>
	<title>Balances - WeSplit</title>
</svelte:head>

<div class="space-y-6">
	{#if balances.isLoading}
		<div class="space-y-2">
			{#each [1, 2, 3] as _}
				<div class="animate-pulse rounded-lg border border-border bg-surface p-4">
					<div class="flex justify-between">
						<div class="h-4 w-24 rounded bg-surface-raised"></div>
						<div class="h-4 w-16 rounded bg-surface-raised"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if balances.data && balances.data.length > 0}
		<!-- Balance Summary -->
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

		<!-- Optimized Settlement Plan -->
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

		<!-- Detailed Debts -->
		{#if debts.data && debts.data.length > 0}
			<div>
				<h2 class="mb-3 text-lg font-semibold">All Debts</h2>
				<div class="space-y-2">
					{#each debts.data as d (d.from + d.to)}
						<div class="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
							<div class="rounded-md bg-warning-dim p-1.5">
								<ArrowDownLeft size={14} class="text-warning" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm">
									<span class="text-text-secondary">{d.fromName}</span>
									<span class="mx-1 text-text-muted">owes</span>
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
		<div class="rounded-lg border border-dashed border-border py-16 text-center">
			<Calculator size={32} class="mx-auto mb-3 text-text-muted" />
			<p class="text-sm text-text-secondary">No balances to show</p>
			<p class="mt-1 text-xs text-text-muted">Add expenses to see who owes whom</p>
		</div>
	{/if}
</div>
