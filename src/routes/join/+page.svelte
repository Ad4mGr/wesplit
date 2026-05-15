<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { CheckCircle } from '@lucide/svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';

	let code = $derived($page.url.searchParams.get('code') ?? '');
	let userName = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	onMount(() => {
		const stored = localStorage.getItem('wesplit_user');
		if (stored) userName = stored;
	});

	async function joinGroup() {
		if (!userName.trim() || !code.trim()) return;
		loading = true;
		error = '';

		// TODO: Replace with Convex mutation
		await new Promise(r => setTimeout(r, 500));

		localStorage.setItem('wesplit_user', userName.trim());
		success = true;
		loading = false;

		setTimeout(() => goto('/mock-group-id/expenses'), 1000);
	}
</script>

<svelte:head>
	<title>Join Group - WeSplit</title>
</svelte:head>

<div class="flex items-center justify-center min-h-[60vh]">
	<div class="w-full max-w-sm space-y-6">
		<div class="text-center">
			<div class="inline-flex p-3 bg-accent-dim rounded-xl mb-4">
				<CheckCircle size={24} class="text-accent" />
			</div>
			<h1 class="text-xl font-semibold mb-1">Join a group</h1>
			<p class="text-text-secondary text-sm">Enter your name to join</p>
		</div>

		{#if code}
			<div class="p-3 bg-surface-raised border border-border rounded-lg">
				<p class="text-xs text-text-muted mb-1">Invite code</p>
				<p class="font-mono text-sm text-text-primary">{code}</p>
			</div>
		{/if}

		<div class="space-y-3">
			<Input bind:value={userName} label="Your name" placeholder="Enter your name" />
			<Button fullWidth disabled={loading || !userName.trim() || !code.trim()} onclick={joinGroup}>
				{#if loading}
					<span class="flex items-center justify-center gap-2">
						<span class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
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
