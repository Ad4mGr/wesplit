<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Settings, Trash2, AlertTriangle, Copy, Pencil, Check, DollarSign } from '@lucide/svelte';
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
	let client: ReturnType<typeof useConvexClient>;

	const group = useQuery(api.groups.get, () => (groupId ? { groupId } : 'skip'));

	let showDeleteModal = $state(false);
	let showEditModal = $state(false);
	let showCurrencyModal = $state(false);
	let editName = $state('');
	let editDescription = $state('');
	let copied = $state(false);
	let deleting = $state(false);
	let saving = $state(false);

	onMount(() => {
		client = useConvexClient();
	});

	function copyInviteCode() {
		if (!group.data) return;
		navigator.clipboard.writeText(group.data.inviteCode);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}

	function openEditModal() {
		if (!group.data) return;
		editName = group.data.name;
		editDescription = group.data.description || '';
		showEditModal = true;
	}

	async function saveGroup() {
		if (!editName.trim()) return;
		saving = true;
		try {
			await client.mutation(api.groups.update, {
				groupId,
				name: editName.trim(),
				description: editDescription.trim() || undefined
			});
			showEditModal = false;
		} catch (e) {
			console.error('Failed to update group:', e);
		} finally {
			saving = false;
		}
	}

	async function updateCurrency(code: string) {
		try {
			await client.mutation(api.groups.update, {
				groupId,
				currency: code
			});
			showCurrencyModal = false;
		} catch (e) {
			console.error('Failed to update currency:', e);
		}
	}

	async function deleteGroup() {
		deleting = true;
		try {
			await client.mutation(api.groups.remove, { groupId });
			goto('/');
		} catch (e) {
			console.error('Failed to delete group:', e);
		} finally {
			deleting = false;
		}
	}

	function getCurrencyInfo() {
		if (!group.data?.currency) return { symbol: '$', name: 'US Dollar' };
		return (
			CURRENCIES.find((c) => c.code === group.data!.currency) || { symbol: '$', name: 'US Dollar' }
		);
	}
</script>

<svelte:head>
	<title>Settings - WeSplit</title>
</svelte:head>

<Modal bind:open={showEditModal} title="Edit group">
	<div class="space-y-4">
		<Input bind:value={editName} label="Group name" placeholder="e.g. Apartment 4B" />
		<Input
			bind:value={editDescription}
			label="Description (optional)"
			placeholder="e.g. Summer trip"
		/>
		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={() => (showEditModal = false)}>Cancel</Button>
			<Button fullWidth disabled={saving || !editName.trim()} onclick={saveGroup}>
				{#if saving}
					<span class="flex items-center justify-center gap-2">
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"
						></span>
						Saving...
					</span>
				{:else}
					Save
				{/if}
			</Button>
		</div>
	</div>
</Modal>

<Modal bind:open={showCurrencyModal} title="Currency" size="sm">
	<div class="space-y-2">
		{#each CURRENCIES as currency (currency.code)}
			<button
				type="button"
				onclick={() => updateCurrency(currency.code)}
				class="flex w-full items-center justify-between rounded-lg border p-3 transition-colors {group
					.data?.currency === currency.code
					? 'border-accent bg-accent-dim'
					: 'border-border bg-surface-raised hover:border-border-hover'}"
			>
				<div class="flex items-center gap-3">
					<span class="w-8 text-center font-mono text-lg">{currency.symbol}</span>
					<div class="text-left">
						<p class="text-sm font-medium">{currency.name}</p>
						<p class="text-xs text-text-muted">{currency.code}</p>
					</div>
				</div>
				{#if group.data?.currency === currency.code}
					<Check size={16} class="text-accent" />
				{/if}
			</button>
		{/each}
	</div>
</Modal>

<Modal bind:open={showDeleteModal} title="Delete group" size="sm">
	<div class="space-y-4">
		<div class="flex items-center gap-3 rounded-lg border border-danger/20 bg-danger-dim p-3">
			<AlertTriangle size={18} class="text-danger" />
			<p class="text-sm font-medium text-text-primary">This cannot be undone</p>
		</div>
		<p class="text-sm text-text-secondary">
			This will permanently delete the group, all members, expenses, and settlement history.
		</p>
		<div class="flex gap-2">
			<Button variant="ghost" fullWidth onclick={() => (showDeleteModal = false)}>Cancel</Button>
			<Button variant="danger" fullWidth disabled={deleting} onclick={deleteGroup}>
				{#if deleting}
					<span class="flex items-center justify-center gap-2">
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
						></span>
						Deleting...
					</span>
				{:else}
					Delete Group
				{/if}
			</Button>
		</div>
	</div>
</Modal>

<div class="space-y-6">
	<!-- Group Info -->
	{#if group.data}
		<div class="rounded-xl border border-border bg-surface p-5">
			<div class="flex items-start justify-between">
				<div>
					<h2 class="text-lg font-semibold">{group.data.name}</h2>
					{#if group.data.description}
						<p class="mt-1 text-sm text-text-secondary">{group.data.description}</p>
					{/if}
					<p class="mt-2 font-mono text-xs text-text-muted">
						Created {new Date(group.data.createdAt).toLocaleDateString()}
					</p>
				</div>
				<Button variant="ghost" size="sm" onclick={openEditModal}>
					<span class="flex items-center gap-1.5">
						<Pencil size={14} />
						Edit
					</span>
				</Button>
			</div>
		</div>
	{/if}

	<!-- Currency -->
	{#if group.data}
		<div class="rounded-xl border border-border bg-surface p-5">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="mb-1 text-sm font-medium text-text-secondary">Currency</h3>
					<div class="flex items-center gap-2">
						<span class="font-mono text-xl">{getCurrencyInfo().symbol}</span>
						<span class="text-sm">{getCurrencyInfo().name}</span>
					</div>
				</div>
				<Button variant="secondary" size="sm" onclick={() => (showCurrencyModal = true)}>
					<span class="flex items-center gap-1.5">
						<DollarSign size={14} />
						Change
					</span>
				</Button>
			</div>
		</div>
	{/if}

	<!-- Invite Code -->
	{#if group.data}
		<div class="rounded-xl border border-border bg-surface p-5">
			<h3 class="mb-3 text-sm font-medium text-text-secondary">Invite Code</h3>
			<div class="flex items-center gap-2">
				<code
					class="flex-1 rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-sm tracking-wider"
					>{group.data.inviteCode}</code
				>
				<Button variant="secondary" size="sm" onclick={copyInviteCode}>
					{#if copied}
						<span class="flex items-center gap-1.5">
							<Check size={14} class="text-accent" />
							Copied
						</span>
					{:else}
						<span class="flex items-center gap-1.5">
							<Copy size={14} />
							Copy
						</span>
					{/if}
				</Button>
			</div>
			<p class="mt-2 text-xs text-text-muted">
				Share this code or link: <span class="font-mono"
					>{window.location.origin}/join?code={group.data.inviteCode}</span
				>
			</p>
		</div>
	{/if}

	<!-- Danger Zone -->
	<div class="rounded-xl border border-danger/20 bg-surface p-5">
		<h3 class="mb-2 text-sm font-medium text-danger">Danger Zone</h3>
		<p class="mb-4 text-xs text-text-secondary">Permanently delete this group and all its data.</p>
		<Button variant="danger" size="sm" onclick={() => (showDeleteModal = true)}>
			<span class="flex items-center gap-1.5">
				<Trash2 size={14} />
				Delete Group
			</span>
		</Button>
	</div>
</div>
