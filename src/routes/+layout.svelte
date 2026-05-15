<script lang="ts">
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { setupConvex } from 'convex-svelte';
	import '../routes/layout.css';
	import { Split } from '@lucide/svelte';

	const { children } = $props();
	setupConvex(PUBLIC_CONVEX_URL);
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
			<div class="flex items-center gap-2">
				<span id="user-display" class="text-xs text-text-muted font-mono"></span>
			</div>
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
