<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Users, Plus, UserMinus, Trash2, AlertTriangle } from '@lucide/svelte';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '../../../convex/_generated/dataModel';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let groupId = $derived($page.params.groupId as Id<'groups'>);
	let client: ReturnType<typeof useConvexClient>;

	const members = useQuery(api.members.listByGroup, () => (groupId ? { groupId } : 'skip'));

	let showAddModal = $state(false);
	let showDeleteModal = $state(false);
	let deleteTarget = $state<Id<'members'> | null>(null);
	let newName = $state('');
	let newEmail = $state('');

	onMount(() => {
		client = useConvexClient();
	});

	async function addMember() {
		if (!newName.trim()) return;
		try {
			await client.mutation(api.members.add, {
				groupId,
				name: newName.trim(),
				email: newEmail.trim() || undefined
			});
			showAddModal = false;
			newName = '';
			newEmail = '';
		} catch (e) {
			console.error('Failed to add member:', e);
		}
	}

	async function deactivateMember(memberId: Id<'members'>) {
		try {
			await client.mutation(api.members.deactivate, { memberId });
			showDeleteModal = false;
			deleteTarget = null;
		} catch (e) {
			console.error('Failed to deactivate:', e);
		}
	}

	async function removeMember(memberId: Id<'members'>) {
		try {
			await client.mutation(api.members.remove, { memberId });
			showDeleteModal = false;
			deleteTarget = null;
		} catch (e: any) {
			alert(e.message);
		}
	}

	function openDeleteModal(memberId: Id<'members'>) {
		deleteTarget = memberId;
		showDeleteModal = true;
	}
</script>

<svelte:head>
	<title>Members - WeSplit</title>
</svelte:head>

<Modal bind:open={showAddModal} title="Add member">
	<div class="space-y-4">
		<Input
			bind:value={newName}
			label="Name"
			placeholder="Enter name"
			onkeydown={(e) => e.key === 'Enter' && addMember()}
		/>
		<Input
			bind:value={newEmail}
			label="Email (optional)"
			type="email"
			placeholder="email@example.com"
		/>
		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={() => (showAddModal = false)}>Cancel</Button>
			<Button fullWidth disabled={!newName.trim()} onclick={addMember}>Add</Button>
		</div>
	</div>
</Modal>

<Modal bind:open={showDeleteModal} title="Remove member" size="sm">
	<div class="space-y-4">
		<div class="flex items-center gap-3 rounded-lg border border-danger/20 bg-danger-dim p-3">
			<AlertTriangle size={18} class="text-danger" />
			<p class="text-sm text-text-primary">This action cannot be undone.</p>
		</div>
		<p class="text-sm text-text-secondary">
			If this member has expense history, they will be deactivated instead of deleted.
		</p>
		<div class="flex gap-2">
			<Button
				variant="ghost"
				fullWidth
				onclick={() => {
					showDeleteModal = false;
					deleteTarget = null;
				}}>Cancel</Button
			>
			<Button
				variant="danger"
				fullWidth
				disabled={!deleteTarget}
				onclick={() => deleteTarget && removeMember(deleteTarget)}>Remove</Button
			>
		</div>
	</div>
</Modal>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-lg font-semibold">Members</h2>
			{#if members.data}
				<p class="text-xs text-text-muted">
					{members.data.length} member{members.data.length !== 1 ? 's' : ''}
				</p>
			{/if}
		</div>
		<Button size="sm" onclick={() => (showAddModal = true)}>
			<span class="flex items-center gap-1.5">
				<Plus size={14} />
				Add
			</span>
		</Button>
	</div>

	{#if members.isLoading}
		<div class="space-y-2">
			{#each [1, 2, 3] as _}
				<div class="animate-pulse rounded-lg border border-border bg-surface p-4">
					<div class="flex items-center gap-3">
						<div class="h-10 w-10 rounded-full bg-surface-raised"></div>
						<div class="h-4 w-24 rounded bg-surface-raised"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if members.data && members.data.length > 0}
		<div class="space-y-2">
			{#each members.data as member (member._id)}
				<div
					class="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-hover"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-accent-dim">
								<span class="text-sm font-medium text-accent"
									>{member.name.charAt(0).toUpperCase()}</span
								>
							</div>
							<div>
								<p class="text-sm font-medium">{member.name}</p>
								{#if member.email}
									<p class="text-xs text-text-muted">{member.email}</p>
								{/if}
							</div>
						</div>
						<button
							type="button"
							onclick={() => openDeleteModal(member._id)}
							class="rounded p-1.5 text-text-muted opacity-0 transition-all group-hover:opacity-100 hover:bg-danger-dim hover:text-danger"
							title="Remove member"
						>
							<UserMinus size={16} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="rounded-lg border border-dashed border-border py-16 text-center">
			<Users size={32} class="mx-auto mb-3 text-text-muted" />
			<p class="text-sm text-text-secondary">No members yet</p>
			<p class="mt-1 text-xs text-text-muted">Add members to start splitting expenses</p>
		</div>
	{/if}
</div>
