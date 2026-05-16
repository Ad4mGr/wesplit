<script lang="ts">
	import { page } from '$app/stores';
	import TabNav from '$lib/components/TabNav.svelte';

	let groupId = $derived($page.url.pathname.split('/')[1]);
	let currentTab = $derived($page.url.pathname.split('/').pop() ?? '');

	const tabs = $derived([
		{ label: 'Dashboard', href: '', active: currentTab === groupId },
		{ label: 'Expenses', href: 'expenses', active: currentTab === 'expenses' },
		{ label: 'Balances', href: 'balances', active: currentTab === 'balances' },
		{ label: 'Settle', href: 'settle', active: currentTab === 'settle' },
		{ label: 'Members', href: 'members', active: currentTab === 'members' },
		{ label: 'Activity', href: 'activity', active: currentTab === 'activity' },
		{ label: 'Settings', href: 'settings', active: currentTab === 'settings' }
	]);

	let { children }: { children: () => any } = $props();
</script>

<div class="space-y-4">
	<TabNav {tabs} basePath="/{groupId}" />
	{@render children()}
</div>
