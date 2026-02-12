<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import { cn } from 'tailwind-variants';
	import { hasSpreadsheetData } from '$lib/stores/spreadsheet.svelte';
	import { getDesign } from '$lib/stores/design.svelte';

	let { children } = $props();

	const design = getDesign();

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

	function isReachable(href: string): boolean {
		if (href === '/') return true;
		if (href === '/design') return hasSpreadsheetData();
		if (href === '/print') return design.fields.length > 0;
		return true;
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
				{@const reachable = isReachable(navItem.href)}

				<Button
					variant="ghost"
					size="sm"
					href={reachable ? navItem.href : undefined}
					disabled={!reachable}
					class={cn("text-[12px] font-semibold uppercase tracking-wider", {
						"bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary": active,
						"text-muted-foreground hover:text-foreground": !active && reachable,
						"text-muted-foreground/40 cursor-not-allowed": !reachable
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
