<script lang="ts">
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { setupConvex } from 'convex-svelte';
	import '../routes/layout.css';
	import { Split, User } from '@lucide/svelte';
	import { onMount } from 'svelte';

	const { children } = $props();
	setupConvex(PUBLIC_CONVEX_URL);

	let userName = $state('');

	onMount(() => {
		const stored = localStorage.getItem('wesplit_user');
		if (stored) userName = stored;
	});
</script>

<div class="flex min-h-screen flex-col bg-background">
	<header class="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
		<div class="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
			<a href="/" class="group flex items-center gap-2">
				<div class="rounded-md bg-accent-dim p-1.5 transition-colors group-hover:bg-accent/20">
					<Split size={18} class="text-accent" />
				</div>
				<span class="text-base font-semibold tracking-tight">WeSplit</span>
			</a>
			<a
				href="/profile"
				class="group flex items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-surface-raised"
			>
				<div class="flex h-7 w-7 items-center justify-center rounded-full bg-accent-dim">
					<User size={14} class="text-accent" />
				</div>
				{#if userName}
					<span
						class="hidden text-xs text-text-secondary transition-colors group-hover:text-text-primary sm:inline"
						>{userName}</span
					>
				{/if}
			</a>
		</div>
	</header>

	<main class="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
		{@render children()}
	</main>

	<footer class="border-t border-border py-4">
		<div class="mx-auto max-w-3xl px-4 text-center">
			<p class="font-mono text-xs text-text-muted">WeSplit &middot; Split fairly</p>
		</div>
	</footer>
</div>
