<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { User, Settings, LogOut, Users, ArrowRight } from '@lucide/svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let userName = $state('');
	let showEditModal = $state(false);
	let newName = $state('');

	const groups = useQuery(api.groups.listByMember, () => (userName.trim() ? { userName: userName.trim() } : 'skip'));

	onMount(() => {
		const stored = localStorage.getItem('wesplit_user');
		if (stored) {
			userName = stored;
			newName = stored;
		} else {
			goto('/');
		}
	});

	function saveName() {
		if (!newName.trim()) return;
		localStorage.setItem('wesplit_user', newName.trim());
		userName = newName.trim();
		showEditModal = false;
	}

	function logout() {
		localStorage.removeItem('wesplit_user');
		goto('/');
	}
</script>

<svelte:head>
	<title>Profile - WeSplit</title>
</svelte:head>

<Modal bind:open={showEditModal} title="Edit name">
	<div class="space-y-4">
		<Input bind:value={newName} label="Your name" placeholder="Enter your name" onkeydown={(e) => e.key === 'Enter' && saveName()} />
		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={() => showEditModal = false}>Cancel</Button>
			<Button fullWidth onclick={saveName}>Save</Button>
		</div>
	</div>
</Modal>

<div class="space-y-6">
	<div class="p-5 bg-surface border border-border rounded-xl">
		<div class="flex items-center gap-4">
			<div class="p-3 bg-accent-dim rounded-xl">
				<User size={24} class="text-accent" />
			</div>
			<div class="flex-1">
				<h1 class="text-lg font-semibold">{userName}</h1>
				<p class="text-xs text-text-muted font-mono">@{userName.toLowerCase().replace(/\s+/g, '')}</p>
			</div>
			<Button variant="ghost" size="sm" onclick={() => showEditModal = true}>
				<span class="flex items-center gap-1.5">
					<Settings size={14} />
					Edit
				</span>
			</Button>
		</div>
	</div>

	<div>
		<h2 class="text-lg font-semibold mb-3">Your Groups</h2>
		{#if groups.isLoading}
			<div class="space-y-2">
				{#each [1, 2] as _}
					<div class="p-4 bg-surface border border-border rounded-lg animate-pulse">
						<div class="h-4 bg-surface-raised rounded w-1/3"></div>
					</div>
				{/each}
			</div>
		{:else if groups.data && groups.data.length > 0}
			<div class="space-y-2">
				{#each groups.data as group (group._id)}
					<a href="/{group._id}" class="flex items-center justify-between p-4 bg-surface border border-border rounded-lg hover:border-border-hover transition-colors group">
						<div class="flex items-center gap-3">
							<div class="p-2 bg-accent-dim rounded-md">
								<Users size={18} class="text-accent" />
							</div>
							<div>
								<h3 class="font-medium text-sm">{group.name}</h3>
								{#if group.description}
									<p class="text-xs text-text-muted">{group.description}</p>
								{/if}
							</div>
						</div>
						<ArrowRight size={16} class="text-text-muted group-hover:text-text-primary transition-colors" />
					</a>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-text-muted">Not in any groups yet</p>
		{/if}
	</div>

	<div class="pt-4 border-t border-border">
		<Button variant="ghost" fullWidth onclick={logout}>
			<span class="flex items-center justify-center gap-2">
				<LogOut size={16} />
				Sign Out
			</span>
		</Button>
	</div>
</div>
