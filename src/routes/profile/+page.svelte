<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { User, Settings, LogOut, Users, ArrowRight, Shield } from '@lucide/svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let userName = $state('');
	let showEditModal = $state(false);
	let newName = $state('');

	const groups = useQuery(api.groups.listByMember, () =>
		userName.trim() ? { userName: userName.trim() } : 'skip'
	);

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
		<Input
			bind:value={newName}
			label="Your name"
			placeholder="Enter your name"
			onkeydown={(e) => e.key === 'Enter' && saveName()}
		/>
		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={() => (showEditModal = false)}>Cancel</Button>
			<Button fullWidth onclick={saveName}>Save</Button>
		</div>
	</div>
</Modal>

<div class="space-y-6">
	<div class="rounded-xl border border-border bg-surface p-5">
		<div class="flex items-center gap-4">
			<div class="rounded-xl bg-accent-dim p-3">
				<User size={24} class="text-accent" />
			</div>
			<div class="flex-1">
				<h1 class="text-lg font-semibold">{userName}</h1>
				<p class="font-mono text-xs text-text-muted">
					@{userName.toLowerCase().replace(/\s+/g, '')}
				</p>
			</div>
			<Button variant="ghost" size="sm" onclick={() => (showEditModal = true)}>
				<span class="flex items-center gap-1.5">
					<Settings size={14} />
					Edit
				</span>
			</Button>
		</div>
	</div>

	<div class="rounded-xl border border-accent/20 bg-accent-dim p-5">
		<div class="flex items-start gap-3">
			<div class="rounded-lg bg-accent p-2">
				<Shield size={16} class="text-black" />
			</div>
			<div>
				<h3 class="text-sm font-semibold text-text-primary">Guest mode</h3>
				<p class="mt-1 text-xs text-text-secondary">
					You're using WeSplit as a guest. Your data is stored locally and tied to your name. For
					cross-device sync and account protection, sign-up will be available in a future update.
				</p>
			</div>
		</div>
	</div>

	<div>
		<h2 class="mb-3 text-lg font-semibold">Your Groups</h2>
		{#if groups.isLoading}
			<div class="space-y-2">
				{#each [1, 2] as _}
					<div class="animate-pulse rounded-lg border border-border bg-surface p-4">
						<div class="h-4 w-1/3 rounded bg-surface-raised"></div>
					</div>
				{/each}
			</div>
		{:else if groups.data && groups.data.length > 0}
			<div class="space-y-2">
				{#each groups.data as group (group._id)}
					<a
						href="/{group._id}"
						class="group flex items-center justify-between rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-hover"
					>
						<div class="flex items-center gap-3">
							<div class="rounded-md bg-accent-dim p-2">
								<Users size={18} class="text-accent" />
							</div>
							<div>
								<h3 class="text-sm font-medium">{group.name}</h3>
								{#if group.description}
									<p class="text-xs text-text-muted">{group.description}</p>
								{/if}
							</div>
						</div>
						<ArrowRight
							size={16}
							class="text-text-muted transition-colors group-hover:text-text-primary"
						/>
					</a>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-text-muted">Not in any groups yet</p>
		{/if}
	</div>

	<div class="border-t border-border pt-4">
		<Button variant="ghost" fullWidth onclick={logout}>
			<span class="flex items-center justify-center gap-2">
				<LogOut size={16} />
				Sign Out
			</span>
		</Button>
	</div>
</div>
