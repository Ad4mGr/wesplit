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
		setTimeout(() => { copied = false; }, 2000);
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
		return CURRENCIES.find(c => c.code === group.data!.currency) || { symbol: '$', name: 'US Dollar' };
	}
</script>

<svelte:head>
	<title>Settings - WeSplit</title>
</svelte:head>

<Modal bind:open={showEditModal} title="Edit group">
	<div class="space-y-4">
		<Input bind:value={editName} label="Group name" placeholder="e.g. Apartment 4B" />
		<Input bind:value={editDescription} label="Description (optional)" placeholder="e.g. Summer trip" />
		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={() => showEditModal = false}>Cancel</Button>
			<Button fullWidth disabled={saving || !editName.trim()} onclick={saveGroup}>
				{#if saving}
					<span class="flex items-center justify-center gap-2">
						<span class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
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
				class="w-full flex items-center justify-between p-3 rounded-lg border transition-colors {group.data?.currency === currency.code ? 'bg-accent-dim border-accent' : 'bg-surface-raised border-border hover:border-border-hover'}"
			>
				<div class="flex items-center gap-3">
					<span class="text-lg font-mono w-8 text-center">{currency.symbol}</span>
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
		<div class="flex items-center gap-3 p-3 bg-danger-dim border border-danger/20 rounded-lg">
			<AlertTriangle size={18} class="text-danger" />
			<p class="text-sm text-text-primary font-medium">This cannot be undone</p>
		</div>
		<p class="text-sm text-text-secondary">This will permanently delete the group, all members, expenses, and settlement history.</p>
		<div class="flex gap-2">
			<Button variant="ghost" fullWidth onclick={() => showDeleteModal = false}>Cancel</Button>
			<Button variant="danger" fullWidth disabled={deleting} onclick={deleteGroup}>
				{#if deleting}
					<span class="flex items-center justify-center gap-2">
						<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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
		<div class="p-5 bg-surface border border-border rounded-xl">
			<div class="flex items-start justify-between">
				<div>
					<h2 class="text-lg font-semibold">{group.data.name}</h2>
					{#if group.data.description}
						<p class="text-sm text-text-secondary mt-1">{group.data.description}</p>
					{/if}
					<p class="text-xs text-text-muted mt-2 font-mono">Created {new Date(group.data.createdAt).toLocaleDateString()}</p>
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
		<div class="p-5 bg-surface border border-border rounded-xl">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-sm font-medium text-text-secondary mb-1">Currency</h3>
					<div class="flex items-center gap-2">
						<span class="text-xl font-mono">{getCurrencyInfo().symbol}</span>
						<span class="text-sm">{getCurrencyInfo().name}</span>
					</div>
				</div>
				<Button variant="secondary" size="sm" onclick={() => showCurrencyModal = true}>
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
		<div class="p-5 bg-surface border border-border rounded-xl">
			<h3 class="text-sm font-medium text-text-secondary mb-3">Invite Code</h3>
			<div class="flex items-center gap-2">
				<code class="flex-1 px-3 py-2 bg-surface-raised border border-border rounded-md font-mono text-sm tracking-wider">{group.data.inviteCode}</code>
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
			<p class="text-xs text-text-muted mt-2">Share this code or link: <span class="font-mono">{window.location.origin}/join?code={group.data.inviteCode}</span></p>
		</div>
	{/if}

	<!-- Danger Zone -->
	<div class="p-5 bg-surface border border-danger/20 rounded-xl">
		<h3 class="text-sm font-medium text-danger mb-2">Danger Zone</h3>
		<p class="text-xs text-text-secondary mb-4">Permanently delete this group and all its data.</p>
		<Button variant="danger" size="sm" onclick={() => showDeleteModal = true}>
			<span class="flex items-center gap-1.5">
				<Trash2 size={14} />
				Delete Group
			</span>
		</Button>
	</div>
</div>
