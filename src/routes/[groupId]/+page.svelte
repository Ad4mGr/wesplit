<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let groupId = $derived($page.params.groupId);

	onMount(() => {
		goto(`/${groupId}/expenses`, { replaceState: true });
	});
</script>
