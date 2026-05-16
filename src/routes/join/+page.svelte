<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	import { CheckCircle } from '@lucide/svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';

	let code = $derived($page.url.searchParams.get('code') ?? '');
	let userName = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	let client: ReturnType<typeof useConvexClient>;

	onMount(() => {
		client = useConvexClient();
		const stored = localStorage.getItem('wesplit_user');
		if (stored) userName = stored;
	});

	async function joinGroup() {
		if (!userName.trim() || !code.trim()) return;
		loading = true;
		error = '';

		try {
			const inviteCode = code.trim().toUpperCase();
			const result = await client.mutation(api.groups.joinGroup, {
				inviteCode,
				userName: userName.trim()
			});

			localStorage.setItem('wesplit_user', userName.trim());
			success = true;

			setTimeout(() => goto(`/${result.groupId}/expenses`), 800);
		} catch (e: any) {
			error = e.message || 'Failed to join group';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Join Group - WeSplit</title>
</svelte:head>

<div class="flex min-h-[60vh] items-center justify-center">
	<div class="w-full max-w-sm space-y-6">
		<div class="text-center">
			<div class="mb-4 inline-flex rounded-xl bg-accent-dim p-3">
				<CheckCircle size={24} class="text-accent" />
			</div>
			<h1 class="mb-1 text-xl font-semibold">Join a group</h1>
			<p class="text-sm text-text-secondary">Enter your name to join</p>
		</div>

		{#if code}
			<div class="rounded-lg border border-border bg-surface-raised p-3">
				<p class="mb-1 text-xs text-text-muted">Invite code</p>
				<p class="font-mono text-sm text-text-primary">{code.toUpperCase()}</p>
			</div>
		{/if}

		<div class="space-y-3">
			<Input bind:value={userName} label="Your name" placeholder="Enter your name" />
			<Button fullWidth disabled={loading || !userName.trim() || !code.trim()} onclick={joinGroup}>
				{#if loading}
					<span class="flex items-center justify-center gap-2">
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"
						></span>
						Joining...
					</span>
				{:else}
					Join Group
				{/if}
			</Button>
		</div>

		{#if error}
			<p class="text-center text-sm text-danger">{error}</p>
		{/if}

		{#if success}
			<p class="text-center text-sm text-accent">Joined! Redirecting...</p>
		{/if}
	</div>
</div>
