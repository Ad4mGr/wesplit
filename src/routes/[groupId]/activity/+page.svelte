<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Bell, DollarSign, Users, HandCoins, Pencil, Trash2, Check } from '@lucide/svelte';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '../../../convex/_generated/dataModel';

	let groupId = $derived($page.params.groupId as Id<'groups'>);
	let client: ReturnType<typeof useConvexClient>;

	const members = useQuery(api.members.listByGroup, () => (groupId ? { groupId } : 'skip'));
	const notifications = useQuery(api.notifications.listByGroup, () =>
		groupId ? { groupId } : 'skip'
	);

	let selectedMember = $state<Id<'members'> | 'all'>('all');

	onMount(() => {
		client = useConvexClient();
	});

	function getIcon(type: string) {
		switch (type) {
			case 'expense_added':
				return DollarSign;
			case 'expense_updated':
				return Pencil;
			case 'expense_deleted':
				return Trash2;
			case 'settlement_recorded':
				return HandCoins;
			case 'member_joined':
				return Users;
			case 'member_left':
				return Users;
			default:
				return Bell;
		}
	}

	function getIconColor(type: string): string {
		switch (type) {
			case 'expense_added':
				return 'text-accent';
			case 'expense_updated':
				return 'text-warning';
			case 'expense_deleted':
				return 'text-danger';
			case 'settlement_recorded':
				return 'text-success';
			case 'member_joined':
				return 'text-accent';
			case 'member_left':
				return 'text-text-muted';
			default:
				return 'text-text-muted';
		}
	}

	function getBgColor(type: string): string {
		switch (type) {
			case 'expense_added':
				return 'bg-accent-dim';
			case 'expense_updated':
				return 'bg-warning-dim';
			case 'expense_deleted':
				return 'bg-danger-dim';
			case 'settlement_recorded':
				return 'bg-success-dim';
			case 'member_joined':
				return 'bg-accent-dim';
			case 'member_left':
				return 'bg-surface-raised';
			default:
				return 'bg-surface-raised';
		}
	}

	function formatDate(ts: number): string {
		const now = Date.now();
		const diff = now - ts;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	async function markAsRead(notificationId: Id<'notifications'>) {
		await client.mutation(api.notifications.markAsRead, { notificationId });
	}

	async function markAllAsRead() {
		if (selectedMember !== 'all' && members.data) {
			const member = members.data.find((m) => m._id === selectedMember);
			if (member) {
				await client.mutation(api.notifications.markAllAsRead, { memberId: member._id });
			}
		} else if (members.data && members.data.length > 0) {
			for (const member of members.data) {
				await client.mutation(api.notifications.markAllAsRead, { memberId: member._id });
			}
		}
	}

	const filteredNotifications = $derived(
		notifications.data?.filter((n) => selectedMember === 'all' || n.memberId === selectedMember) ??
			[]
	);

	const unreadCount = $derived(notifications.data?.filter((n) => !n.readAt).length ?? 0);
</script>

<svelte:head>
	<title>Activity - WeSplit</title>
</svelte:head>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-lg font-semibold">Activity</h2>
			{#if unreadCount > 0}
				<p class="text-xs text-text-muted">{unreadCount} unread</p>
			{/if}
		</div>
		{#if unreadCount > 0}
			<button
				type="button"
				onclick={markAllAsRead}
				class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:text-accent/80"
			>
				<Check size={14} />
				Mark all read
			</button>
		{/if}
	</div>

	<!-- Member filter -->
	{#if members.data && members.data.length > 1}
		<div class="flex gap-1 overflow-x-auto rounded-md border border-border bg-surface-raised p-1">
			<button
				type="button"
				onclick={() => (selectedMember = 'all')}
				class="rounded px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors {selectedMember ===
				'all'
					? 'bg-accent text-black'
					: 'text-text-secondary hover:text-text-primary'}"
			>
				All
			</button>
			{#each members.data as member}
				<button
					type="button"
					onclick={() => (selectedMember = member._id)}
					class="rounded px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors {selectedMember ===
					member._id
						? 'bg-accent text-black'
						: 'text-text-secondary hover:text-text-primary'}"
				>
					{member.name}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Notifications list -->
	{#if notifications.isLoading}
		<div class="space-y-2">
			{#each [1, 2, 3, 4] as _}
				<div class="animate-pulse rounded-lg border border-border bg-surface p-4">
					<div class="flex items-start gap-3">
						<div class="h-8 w-8 rounded-md bg-surface-raised"></div>
						<div class="flex-1 space-y-2">
							<div class="h-4 w-3/4 rounded bg-surface-raised"></div>
							<div class="h-3 w-1/2 rounded bg-surface-raised"></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if filteredNotifications.length > 0}
		<div class="space-y-2">
			{#each filteredNotifications as n (n._id)}
				{@const Icon = getIcon(n.type)}
				<div
					class="rounded-lg border border-border bg-surface p-4 transition-colors {!n.readAt
						? 'border-accent/30 bg-accent/5'
						: 'hover:border-border-hover'}"
				>
					<div class="flex items-start gap-3">
						<div class="p-1.5 {getBgColor(n.type)} rounded-md">
							<Icon size={14} class={getIconColor(n.type)} />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium text-text-primary">{n.title}</p>
							<p class="mt-0.5 text-xs text-text-secondary">{n.message}</p>
							<p class="mt-1 text-xs text-text-muted">{formatDate(n.createdAt)}</p>
						</div>
						{#if !n.readAt}
							<button
								type="button"
								onclick={() => markAsRead(n._id)}
								class="p-1 text-text-muted transition-colors hover:text-accent"
								title="Mark as read"
							>
								<Check size={14} />
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="rounded-lg border border-dashed border-border py-16 text-center">
			<Bell size={32} class="mx-auto mb-3 text-text-muted" />
			<p class="text-sm text-text-secondary">No activity yet</p>
			<p class="mt-1 text-xs text-text-muted">Actions in this group will appear here</p>
		</div>
	{/if}
</div>
