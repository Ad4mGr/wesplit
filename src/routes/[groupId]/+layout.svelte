<script lang="ts">
	import { page } from '$app/stores';
	import TabNav from '$lib/components/TabNav.svelte';

	let groupId = $derived($page.params.groupId);
	let currentTab = $derived($page.url.pathname.split('/').pop() ?? '');

	const tabs = $derived([
		{ label: 'Expenses', href: 'expenses', active: currentTab === 'expenses' || currentTab === groupId },
		{ label: 'Balances', href: 'balances', active: currentTab === 'balances' },
		{ label: 'Settle', href: 'settle', active: currentTab === 'settle' }
	]);

	let { children }: { children: () => any } = $props();
</script>

<div class="space-y-4">
	<TabNav {tabs} basePath="/{groupId}" />
	{@render children()}
</div>
