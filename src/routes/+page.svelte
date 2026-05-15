<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Link, Users, Copy, Check } from '@lucide/svelte';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '../convex/_generated/api';
	import type { Id } from '../convex/_generated/dataModel';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let userName = $state('');
	let showNameModal = $state(false);
	let showCreateModal = $state(false);
	let showJoinModal = $state(false);
	let groupName = $state('');
	let groupDescription = $state('');
	let inviteCode = $state('');
	let creating = $state(false);
	let joining = $state(false);
	let joinError = $state('');
	let copiedCode = $state<string | null>(null);

	const groups = useQuery(api.groups.list, {});

	let client: ReturnType<typeof useConvexClient>;

	onMount(() => {
		client = useConvexClient();
		const stored = localStorage.getItem('wesplit_user');
		if (stored) {
			userName = stored;
			const el = document.getElementById('user-display');
			if (el) el.textContent = `@${userName}`;
		} else {
			showNameModal = true;
		}
	});

	function saveName() {
		if (!userName.trim()) return;
		localStorage.setItem('wesplit_user', userName.trim());
		const el = document.getElementById('user-display');
		if (el) el.textContent = `@${userName.trim()}`;
		showNameModal = false;
	}

	async function handleCreateGroup() {
		if (!groupName.trim() || !userName) return;
		creating = true;
		try {
			const result = await client.mutation(api.groups.create, {
				name: groupName.trim(),
				description: groupDescription.trim() || undefined,
				createdBy: userName
			});
			showCreateModal = false;
			groupName = '';
			groupDescription = '';
			window.location.href = `/${result.groupId}/expenses`;
		} catch (e) {
			console.error('Failed to create group:', e);
		} finally {
			creating = false;
		}
	}

	async function handleJoinGroup() {
		if (!inviteCode.trim()) return;
		joining = true;
		joinError = '';
		try {
			const code = inviteCode.trim().toUpperCase();
			const group = await client.query(api.groups.getByInviteCode, { inviteCode: code });
			if (!group) {
				joinError = 'Invalid invite code';
				return;
			}
			showJoinModal = false;
			inviteCode = '';
			window.location.href = `/${group._id}/expenses`;
		} catch (e) {
			joinError = 'Failed to join group';
		} finally {
			joining = false;
		}
	}

	function copyInviteCode(code: string) {
		navigator.clipboard.writeText(code);
		copiedCode = code;
		setTimeout(() => { copiedCode = null; }, 2000);
	}
</script>

<svelte:head>
	<title>WeSplit</title>
</svelte:head>

<Modal bind:open={showNameModal} title="What's your name?">
	<div class="space-y-4">
		<Input bind:value={userName} placeholder="Enter your name" onkeydown={(e) => e.key === 'Enter' && saveName()} />
		<Button fullWidth onclick={saveName}>Continue</Button>
	</div>
</Modal>

<Modal bind:open={showCreateModal} title="Create a group">
	<div class="space-y-4">
		<Input bind:value={groupName} label="Group name" placeholder="e.g. Apartment 4B" />
		<Input bind:value={groupDescription} label="Description (optional)" placeholder="e.g. Summer trip expenses" />
		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={() => showCreateModal = false}>Cancel</Button>
			<Button fullWidth disabled={creating || !groupName.trim()} onclick={handleCreateGroup}>
				{#if creating}
					<span class="flex items-center justify-center gap-2">
						<span class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
						Creating...
					</span>
				{:else}
					Create
				{/if}
			</Button>
		</div>
	</div>
</Modal>

<Modal bind:open={showJoinModal} title="Join a group">
	<div class="space-y-4">
		<Input bind:value={inviteCode} label="Invite code or link" placeholder="Paste invite code or link" />
		{#if joinError}
			<p class="text-sm text-danger">{joinError}</p>
		{/if}
		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={() => showJoinModal = false}>Cancel</Button>
			<Button fullWidth disabled={joining || !inviteCode.trim()} onclick={handleJoinGroup}>
				{#if joining}
					<span class="flex items-center justify-center gap-2">
						<span class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
						Joining...
					</span>
				{:else}
					Join
				{/if}
			</Button>
		</div>
	</div>
</Modal>

<div class="space-y-6">
	<div class="text-center py-8">
		<h1 class="text-2xl font-bold tracking-tight mb-2">Your Groups</h1>
		<p class="text-text-secondary text-sm">Track expenses, split fairly, settle up</p>
	</div>

	<div class="flex gap-2">
		<Button fullWidth onclick={() => showCreateModal = true}>
			<span class="flex items-center justify-center gap-2">
				<Plus size={16} />
				New Group
			</span>
		</Button>
		<Button variant="secondary" fullWidth onclick={() => showJoinModal = true}>
			<span class="flex items-center justify-center gap-2">
				<Link size={16} />
				Join
			</span>
		</Button>
	</div>

	{#if groups.isLoading}
		<div class="space-y-2">
			{#each [1, 2, 3] as _}
				<div class="p-4 bg-surface border border-border rounded-lg animate-pulse">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 bg-surface-raised rounded-md"></div>
						<div class="flex-1 space-y-2">
							<div class="h-4 bg-surface-raised rounded w-1/3"></div>
							<div class="h-3 bg-surface-raised rounded w-1/4"></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if groups.data && groups.data.length > 0}
		<div class="space-y-2">
			{#each groups.data as group (group._id)}
				<a
					href="/{group._id}"
					class="block p-4 bg-surface border border-border rounded-lg hover:border-border-hover transition-colors group"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="p-2 bg-accent-dim rounded-md">
								<Users size={18} class="text-accent" />
							</div>
							<div>
								<h3 class="font-medium text-text-primary">{group.name}</h3>
								{#if group.description}
									<p class="text-xs text-text-muted">{group.description}</p>
								{/if}
							</div>
						</div>
						<button
							type="button"
							onclick={(e: MouseEvent) => { e.preventDefault(); copyInviteCode(group.inviteCode); }}
							class="p-2 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-all"
							title="Copy invite link"
						>
							{#if copiedCode === group.inviteCode}
								<Check size={16} class="text-accent" />
							{:else}
								<Copy size={16} />
							{/if}
						</button>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="text-center py-12 border border-border border-dashed rounded-lg">
			<Users size={32} class="mx-auto text-text-muted mb-3" />
			<p class="text-text-secondary text-sm">No groups yet</p>
			<p class="text-text-muted text-xs mt-1">Create one or join with an invite code</p>
		</div>
	{/if}
</div>
