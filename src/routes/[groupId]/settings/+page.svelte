<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Settings, Trash2, AlertTriangle, Copy, Pencil, Check } from '@lucide/svelte';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '../../../convex/_generated/dataModel';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let groupId = $derived($page.params.groupId as Id<'groups'>);
	let client: ReturnType<typeof useConvexClient>;

	const group = useQuery(api.groups.get, () => (groupId ? { groupId } : 'skip'));

	let showDeleteModal = $state(false);
	let showEditModal = $state(false);
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
