<script lang="ts">
	import { X } from '@lucide/svelte';

	interface Props {
		open?: boolean;
		title?: string;
		size?: 'sm' | 'md' | 'lg';
		children: any;
	}

	let { open = $bindable(false), title = '', size = 'md', children }: Props = $props();

	const sizes = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg'
	};

	function close() {
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
		onkeydown={handleKeydown}
		tabindex="-1"
	>
		<div
			class="animate-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm"
			onclick={close}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Enter' && close()}
		></div>
		<div
			class="relative {sizes[
				size
			]} animate-slide-up mx-4 mb-0 w-full rounded-t-xl border border-border bg-surface shadow-2xl sm:mb-0 sm:rounded-xl"
			role="dialog"
			aria-modal="true"
		>
			{#if title}
				<div class="flex items-center justify-between border-b border-border px-5 py-4">
					<h2 class="text-base font-semibold text-text-primary">{title}</h2>
					<button
						type="button"
						onclick={close}
						class="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
					>
						<X size={18} />
					</button>
				</div>
			{/if}
			<div class="px-5 py-4">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes slide-up {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	.animate-fade-in {
		animation: fade-in 0.15s ease-out;
	}
	.animate-slide-up {
		animation: slide-up 0.2s ease-out;
	}
</style>
