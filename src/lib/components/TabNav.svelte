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

<nav class="border-b border-border -mx-4 px-4">
	<div class="flex gap-1 overflow-x-auto scrollbar-hide">
		{#each tabs as tab}
			<a
				href="{basePath}/{tab.href}"
				class="px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors {tab.active ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-hover'}"
			>
				{tab.label}
			</a>
		{/each}
	</div>
</nav>

<style>
	.scrollbar-hide::-webkit-scrollbar { display: none; }
	.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
