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

	let inputValue = $state(value);
	export { inputValue as value };
</script>

<div class="w-full {className}">
	{#if label}
		<label class="block text-sm font-medium text-text-secondary mb-1.5">
			{label}
			<input
				{type}
				{placeholder}
				{disabled}
				bind:value={inputValue}
				{onkeydown}
				class="w-full mt-1.5 px-3 py-2 text-sm bg-surface-raised border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors disabled:opacity-40"
			/>
		</label>
	{:else}
		<input
			{type}
			{placeholder}
			{disabled}
			bind:value={inputValue}
			{onkeydown}
			class="w-full px-3 py-2 text-sm bg-surface-raised border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors disabled:opacity-40"
		/>
	{/if}
	{#if error}
		<p class="mt-1 text-xs text-danger">{error}</p>
	{/if}
</div>
