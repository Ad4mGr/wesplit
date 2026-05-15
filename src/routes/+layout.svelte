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

<div class="min-h-screen bg-background flex flex-col">
	<header class="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
		<div class="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
			<a href="/" class="flex items-center gap-2 group">
				<div class="p-1.5 bg-accent-dim rounded-md group-hover:bg-accent/20 transition-colors">
					<Split size={18} class="text-accent" />
				</div>
				<span class="text-base font-semibold tracking-tight">WeSplit</span>
			</a>
			<a href="/profile" class="flex items-center gap-2 p-1.5 hover:bg-surface-raised rounded-md transition-colors group">
				<div class="w-7 h-7 bg-accent-dim rounded-full flex items-center justify-center">
					<User size={14} class="text-accent" />
				</div>
				{#if userName}
					<span class="text-xs text-text-secondary group-hover:text-text-primary transition-colors hidden sm:inline">{userName}</span>
				{/if}
			</a>
		</div>
	</header>

	<main class="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
		{@render children()}
	</main>

	<footer class="border-t border-border py-4">
		<div class="max-w-3xl mx-auto px-4 text-center">
			<p class="text-xs text-text-muted font-mono">WeSplit &middot; Split fairly</p>
		</div>
	</footer>
</div>
