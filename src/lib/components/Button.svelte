<script lang="ts">
	type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type ButtonSize = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: ButtonVariant;
		size?: ButtonSize;
		fullWidth?: boolean;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		children: any;
		onclick?: (e: MouseEvent) => void;
	}

	let {
		variant = 'primary' as ButtonVariant,
		size = 'md' as ButtonSize,
		fullWidth = false,
		disabled = false,
		type = 'button',
		class: className = '',
		children,
		onclick
	}: Props = $props();

	const variants: Record<ButtonVariant, string> = {
		primary: 'bg-accent text-black font-medium hover:bg-accent-hover active:scale-[0.98]',
		secondary:
			'bg-surface-raised text-text-primary border border-border hover:border-border-hover active:scale-[0.98]',
		ghost:
			'text-text-secondary hover:text-text-primary hover:bg-surface-raised active:scale-[0.98]',
		danger: 'bg-danger-dim text-danger hover:bg-danger hover:text-white active:scale-[0.98]'
	};

	const sizes: Record<ButtonSize, string> = {
		sm: 'px-3 py-1.5 text-sm rounded-sm',
		md: 'px-4 py-2 text-sm rounded-md',
		lg: 'px-5 py-2.5 text-base rounded-md'
	};
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="{variants[variant]} {sizes[size]} {fullWidth
		? 'w-full'
		: ''} transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 {className}"
>
	{@render children()}
</button>
