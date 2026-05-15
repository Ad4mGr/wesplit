<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Link, Users } from '@lucide/svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';

	interface Group {
		_id: string;
		name: string;
		description?: string;
		inviteCode: string;
	}

	let userName = $state('');
	let showNameModal = $state(false);
	let showCreateModal = $state(false);
	let showJoinModal = $state(false);
	let groupName = $state('');
	let groupDescription = $state('');
	let inviteCode = $state('');
	let groups = $state<Group[]>([]);

	onMount(() => {
		const stored = localStorage.getItem('wesplit_user');
		if (stored) {
			userName = stored;
			document.getElementById('user-display')!.textContent = `@${userName}`;
		} else {
			showNameModal = true;
		}
		loadGroups();
	});

	async function saveName() {
		if (!userName.trim()) return;
		localStorage.setItem('wesplit_user', userName.trim());
		document.getElementById('user-display')!.textContent = `@${userName.trim()}`;
		showNameModal = false;
	}

	async function loadGroups() {
		// TODO: Replace with actual Convex query
		groups = [];
	}

	async function createGroup() {
		// TODO: Replace with Convex mutation
		console.log('Create group:', { name: groupName, description: groupDescription });
		showCreateModal = false;
		groupName = '';
		groupDescription = '';
	}

	async function joinGroup() {
		// TODO: Replace with Convex mutation
		console.log('Join group:', { code: inviteCode });
		showJoinModal = false;
		inviteCode = '';
	}

	function copyInviteCode(code: string) {
		const url = `${window.location.origin}/join?code=${code}`;
		navigator.clipboard.writeText(url);
	}
</script>

<svelte:head>
	<title>WeSplit</title>
</svelte:head>

<!-- Name Setup Modal -->
<Modal bind:open={showNameModal} title="What's your name?">
	<div class="space-y-4">
		<Input bind:value={userName} placeholder="Enter your name" onkeydown={(e) => e.key === 'Enter' && saveName()} />
		<Button fullWidth onclick={saveName}>Continue</Button>
	</div>
</Modal>

<!-- Create Group Modal -->
<Modal bind:open={showCreateModal} title="Create a group">
	<div class="space-y-4">
		<Input bind:value={groupName} label="Group name" placeholder="e.g. Apartment 4B" />
		<Input bind:value={groupDescription} label="Description (optional)" placeholder="e.g. Summer trip expenses" />
		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={() => showCreateModal = false}>Cancel</Button>
			<Button fullWidth onclick={createGroup}>Create</Button>
		</div>
	</div>
</Modal>

<!-- Join Group Modal -->
<Modal bind:open={showJoinModal} title="Join a group">
	<div class="space-y-4">
		<Input bind:value={inviteCode} label="Invite code or link" placeholder="Paste invite code or link" />
		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={() => showJoinModal = false}>Cancel</Button>
			<Button fullWidth onclick={joinGroup}>Join</Button>
		</div>
	</div>
</Modal>

<!-- Main Content -->
<div class="space-y-6">
	<!-- Hero -->
	<div class="text-center py-8">
		<h1 class="text-2xl font-bold tracking-tight mb-2">Your Groups</h1>
		<p class="text-text-secondary text-sm">Track expenses, split fairly, settle up</p>
	</div>

	<!-- Actions -->
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

	<!-- Groups List -->
	{#if groups.length > 0}
		<div class="space-y-2">
			{#each groups as group}
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
							<Link size={16} />
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
