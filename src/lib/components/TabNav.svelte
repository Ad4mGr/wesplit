<script lang="ts">
	interface Tab {
		label: string;
		href: string;
		active?: boolean;
	}

	interface Props {
		tabs: Tab[];
		basePath: string;
	}

	let { tabs, basePath }: Props = $props();
</script>

<nav class="-mx-4 border-b border-border px-4">
	<div class="scrollbar-hide flex gap-1 overflow-x-auto">
		{#each tabs as tab}
			<a
				href="{basePath}/{tab.href}"
				class="border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors {tab.active
					? 'border-accent text-accent'
					: 'border-transparent text-text-secondary hover:border-border-hover hover:text-text-primary'}"
			>
				{tab.label}
			</a>
		{/each}
	</div>
</nav>

<style>
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
