<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
    import { cn } from 'tailwind-variants';

	let { children } = $props();

	const nav = [
		{ label: 'Import', href: '/' },
		{ label: 'Design', href: '/design' },
		{ label: 'Print', href: '/print' }
	] as const;

	function isActive(href: string): boolean {
		if (href === '/') {
			return page.url.pathname === '/';
		}
		
		return page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Label Designer</title>
</svelte:head>

<div class="flex h-screen flex-col overflow-hidden">
	<header class="bg-card border-border flex h-13 shrink-0 items-center gap-4 border-b px-5">
		<div class="text-primary flex items-center gap-2.5 border-r border-border pr-4 text-[15px] font-bold tracking-tight">
			<LayoutGrid class="size-5.5" />
			Label Designer
		</div>

		<nav class="flex gap-0.5">
			{#each nav as navItem, index}
				{@const active = isActive(navItem.href)}

				<Button
					variant="ghost"
					size="sm"
					href={navItem.href}
					class={cn("text-[12px] font-semibold uppercase tracking-wider", {
						"bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary": active,
						"text-muted-foreground hover:text-foreground": !active
					})}
				>
					<span class="mr-1.5">{index + 1}</span>
					{navItem.label}
				</Button>
			{/each}				
		</nav>
	</header>

	<main class="flex-1 overflow-hidden">
		{@render children()}
	</main>
</div>
