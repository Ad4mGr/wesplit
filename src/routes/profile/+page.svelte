<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import {
	User,
	Settings,
	LogOut,
	Users,
	ArrowRight,
	Shield,
	Mail,
	Eye,
	EyeOff,
	Check,
	Link
} from '@lucide/svelte';
import { useQuery, useConvexClient } from 'convex-svelte';
import { api } from '../../convex/_generated/api';
import Button from '$lib/components/Button.svelte';
import Input from '$lib/components/Input.svelte';
import Modal from '$lib/components/Modal.svelte';
import { signUp, signIn, signOut } from '$lib/auth/client';

const PUBLIC_CONVEX_URL = import.meta.env.VITE_PUBLIC_CONVEX_URL || 'https://qualified-porpoise-711.convex.cloud';

let userName = $state('');
let showEditModal = $state(false);
let newName = $state('');
let showAuthModal = $state(false);
let authMode = $state<'signin' | 'signup'>('signin');
let authEmail = $state('');
let authPassword = $state('');
let authName = $state('');
let authError = $state('');
let authLoading = $state(false);
let showPassword = $state(false);
let userEmail = $state('');
let linkingGuest = $state(false);
let linkResult = $state<{ linked: number } | null>(null);

let client: ReturnType<typeof useConvexClient>;

const currentUser = useQuery(api.users.current, {});
const groups = useQuery(api.groups.listByMember, () =>
	userName.trim() ? { userName: userName.trim() } : 'skip'
);

onMount(() => {
	client = useConvexClient();

	const stored = localStorage.getItem('wesplit_user');
	if (stored) {
		userName = stored;
		newName = stored;
	} else {
		goto('/');
		return;
	}
});

$effect(() => {
	if (currentUser.data) {
		userEmail = currentUser.data.email ?? '';
		if (currentUser.data.name && currentUser.data.name !== userName) {
			userName = currentUser.data.name;
			localStorage.setItem('wesplit_user', currentUser.data.name);
		}
	}
});

	function saveName() {
		if (!newName.trim()) return;
		localStorage.setItem('wesplit_user', newName.trim());
		userName = newName.trim();
		showEditModal = false;
	}

	async function handleAuth() {
		authError = '';
		authLoading = true;
		try {
			if (authMode === 'signup') {
				await signUp(PUBLIC_CONVEX_URL, authEmail, authPassword, authName || undefined);
			} else {
				await signIn(PUBLIC_CONVEX_URL, authEmail, authPassword);
			}

			showAuthModal = false;
			await handleLinkGuest();
		} catch (e: any) {
			authError = e.message || 'Authentication failed';
		} finally {
			authLoading = false;
		}
	}

	async function handleLinkGuest() {
		try {
			const result = await client.mutation(api.users.linkGuestMemberships, {});
			if (result && result.linked > 0) {
				linkResult = result;
			}
		} catch {
			// Silently fail
		}
	}

	async function handleSignOut() {
		await signOut(PUBLIC_CONVEX_URL);
		userEmail = '';
		linkResult = null;
		localStorage.removeItem('wesplit_user');
		goto('/');
	}

	function openAuthModal(mode: 'signin' | 'signup') {
		authMode = mode;
		authError = '';
		authEmail = '';
		authPassword = '';
		authName = '';
		showAuthModal = true;
	}
</script>

<svelte:head>
	<title>Profile - WeSplit</title>
</svelte:head>

<Modal bind:open={showEditModal} title="Edit name">
	<div class="space-y-4">
		<Input
			bind:value={newName}
			label="Your name"
			placeholder="Enter your name"
			onkeydown={(e) => e.key === 'Enter' && saveName()}
		/>
		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={() => (showEditModal = false)}>Cancel</Button>
			<Button fullWidth onclick={saveName}>Save</Button>
		</div>
	</div>
</Modal>

<Modal bind:open={showAuthModal} title={authMode === 'signin' ? 'Sign in' : 'Create account'}>
	<div class="space-y-4">
		{#if authMode === 'signup'}
			<Input
				bind:value={authName}
				label="Display name"
				placeholder="Your name"
				onkeydown={(e) => e.key === 'Enter' && handleAuth()}
			/>
		{/if}
		<Input
			bind:value={authEmail}
			label="Email"
			type="email"
			placeholder="you@example.com"
			onkeydown={(e) => e.key === 'Enter' && handleAuth()}
		/>
		<div>
			<Input
				bind:value={authPassword}
				label="Password"
				type={showPassword ? 'text' : 'password'}
				placeholder="••••••••"
				onkeydown={(e) => e.key === 'Enter' && handleAuth()}
			/>
			<button
				type="button"
				onclick={() => (showPassword = !showPassword)}
				class="mt-1 flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
			>
				{#if showPassword}
					<EyeOff size={12} />
				{:else}
					<Eye size={12} />
				{/if}
				{showPassword ? 'Hide' : 'Show'} password
			</button>
		</div>
		{#if authError}
			<p class="text-sm text-danger">{authError}</p>
		{/if}
		<div class="flex gap-2 pt-2">
			<Button variant="ghost" fullWidth onclick={() => (showAuthModal = false)}>Cancel</Button>
			<Button fullWidth disabled={authLoading} onclick={handleAuth}>
				{#if authLoading}
					<span class="flex items-center justify-center gap-2">
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"
						></span>
						{authMode === 'signin' ? 'Signing in...' : 'Creating...'}
					</span>
				{:else}
					{authMode === 'signin' ? 'Sign in' : 'Create account'}
				{/if}
			</Button>
		</div>
		<div class="pt-2 text-center">
			<button
				type="button"
				onclick={() => {
					authMode = authMode === 'signin' ? 'signup' : 'signin';
					authError = '';
				}}
				class="text-sm text-accent hover:underline"
			>
				{authMode === 'signin'
					? "Don't have an account? Sign up"
					: 'Already have an account? Sign in'}
			</button>
		</div>
	</div>
</Modal>

{#if linkResult && linkResult.linked > 0}
	<Modal open={true} title="Groups linked">
		<div class="space-y-4">
			<div class="flex items-start gap-3">
				<div class="rounded-lg bg-accent p-2">
					<Link size={18} class="text-black" />
				</div>
				<div>
					<p class="text-sm text-text-primary">
						Successfully linked <strong>{linkResult.linked}</strong> group{linkResult.linked > 1
							? 's'
							: ''} to your account.
					</p>
					<p class="mt-1 text-xs text-text-secondary">
						Your guest memberships are now tied to your email.
					</p>
				</div>
			</div>
			<Button fullWidth onclick={() => (linkResult = null)}>Got it</Button>
		</div>
	</Modal>
{/if}

<div class="space-y-6">
	<div class="rounded-xl border border-border bg-surface p-5">
		<div class="flex items-center gap-4">
			<div class="rounded-xl bg-accent-dim p-3">
				<User size={24} class="text-accent" />
			</div>
			<div class="flex-1">
				<h1 class="text-lg font-semibold">{userName}</h1>
				<p class="font-mono text-xs text-text-muted">
					@{userName.toLowerCase().replace(/\s+/g, '')}
				</p>
				{#if currentUser.data}
					<div class="mt-1 flex items-center gap-1">
						<Check size={12} class="text-accent" />
						<span class="text-xs text-accent">
							{userEmail}
						</span>
					</div>
				{/if}
			</div>
			{#if currentUser.data}
				<Button variant="ghost" size="sm" onclick={handleSignOut}>
					<span class="flex items-center gap-1.5">
						<LogOut size={14} />
						Sign out
					</span>
				</Button>
			{:else}
				<Button variant="ghost" size="sm" onclick={() => openAuthModal('signin')}>
					<span class="flex items-center gap-1.5">
						<Mail size={14} />
						Sign in
					</span>
				</Button>
			{/if}
		</div>
	</div>

	{#if !currentUser.data}
		<div class="rounded-xl border border-accent/20 bg-accent-dim p-5">
			<div class="flex items-start gap-3">
				<div class="rounded-lg bg-accent p-2">
					<Shield size={16} class="text-black" />
				</div>
				<div class="flex-1">
					<h3 class="text-sm font-semibold text-text-primary">Secure your account</h3>
					<p class="mt-1 text-xs text-text-secondary">
						Sign in to protect your groups and expenses. Your data follows you across devices.
					</p>
					<div class="mt-3 flex gap-2">
						<Button size="sm" onclick={() => openAuthModal('signup')}>Create account</Button>
						<Button size="sm" variant="secondary" onclick={() => openAuthModal('signin')}>
							Sign in
						</Button>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="rounded-xl border border-success/20 bg-success/5 p-5">
			<div class="flex items-start gap-3">
				<div class="rounded-lg bg-success p-2">
					<Check size={16} class="text-black" />
				</div>
				<div>
					<h3 class="text-sm font-semibold text-text-primary">Account secured</h3>
					<p class="mt-1 text-xs text-text-secondary">
						Your groups and expenses are tied to your account. Sign in from any device to access
						them.
					</p>
				</div>
			</div>
		</div>
	{/if}

	{#if !currentUser.data}
		<div class="rounded-xl border border-border bg-surface p-5">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-sm font-medium text-text-secondary">Display name</h3>
					<p class="mt-0.5 text-sm">{userName}</p>
				</div>
				<Button variant="secondary" size="sm" onclick={() => (showEditModal = true)}>
					<span class="flex items-center gap-1.5">
						<Settings size={14} />
						Edit
					</span>
				</Button>
			</div>
		</div>
	{/if}

	<div>
		<h2 class="mb-3 text-lg font-semibold">Your Groups</h2>
		{#if groups.isLoading}
			<div class="space-y-2">
				{#each [1, 2] as _}
					<div class="animate-pulse rounded-lg border border-border bg-surface p-4">
						<div class="h-4 w-1/3 rounded bg-surface-raised"></div>
					</div>
				{/each}
			</div>
		{:else if groups.data && groups.data.length > 0}
			<div class="space-y-2">
				{#each groups.data as group (group._id)}
					<a
						href="/{group._id}"
						class="group flex items-center justify-between rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-hover"
					>
						<div class="flex items-center gap-3">
							<div class="rounded-md bg-accent-dim p-2">
								<Users size={18} class="text-accent" />
							</div>
							<div>
								<h3 class="text-sm font-medium">{group.name}</h3>
								{#if group.description}
									<p class="text-xs text-text-muted">{group.description}</p>
								{/if}
							</div>
						</div>
						<ArrowRight
							size={16}
							class="text-text-muted transition-colors group-hover:text-text-primary"
						/>
					</a>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-text-muted">Not in any groups yet</p>
		{/if}
	</div>

	{#if !currentUser.data}
		<div class="border-t border-border pt-4">
			<Button
				variant="ghost"
				fullWidth
				onclick={() => (localStorage.removeItem('wesplit_user'), goto('/'))}
			>
				<span class="flex items-center justify-center gap-2">
					<LogOut size={16} />
					Sign Out
				</span>
			</Button>
		</div>
	{/if}
</div>
