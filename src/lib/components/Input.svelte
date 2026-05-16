<script lang="ts">
	interface Props {
		type?: 'text' | 'email' | 'number' | 'password';
		placeholder?: string;
		value?: string;
		label?: string;
		error?: string;
		disabled?: boolean;
		class?: string;
		onkeydown?: (e: KeyboardEvent) => void;
	}

	let {
		type = 'text',
		placeholder = '',
		value = $bindable(''),
		label = '',
		error = '',
		disabled = false,
		class: className = '',
		onkeydown
	}: Props = $props();
</script>

<div class="w-full {className}">
	{#if label}
		<label class="mb-1.5 block text-sm font-medium text-text-secondary">
			{label}
			<input
				{type}
				{placeholder}
				{disabled}
				bind:value
				{onkeydown}
				class="mt-1.5 w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none disabled:opacity-40"
			/>
		</label>
	{:else}
		<input
			{type}
			{placeholder}
			{disabled}
			bind:value
			{onkeydown}
			class="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none disabled:opacity-40"
		/>
	{/if}
	{#if error}
		<p class="mt-1 text-xs text-danger">{error}</p>
	{/if}
</div>
