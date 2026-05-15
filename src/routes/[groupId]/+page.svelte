<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let groupId = $derived($page.params.groupId);
	goto(`/${groupId}/expenses`, { replaceState: true });
</script>
