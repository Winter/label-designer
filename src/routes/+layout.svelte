<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { cn } from 'tailwind-variants';
	import { hasSpreadsheetData } from '$lib/stores/spreadsheet.svelte';
	import { getDesign } from '$lib/stores/design.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { LightSwitch } from '$lib/components/ui/light-switch';

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
	<meta name="description" content="Free browser-based label designer. Import CSV or Excel data, design custom label layouts, and print. All data stays on your device." />
	<meta property="og:title" content="Label Designer" />
	<meta property="og:description" content="Free browser-based label designer. Import CSV or Excel data, design custom label layouts, and print. All data stays on your device." />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Label Designer" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="Label Designer" />
	<meta name="twitter:description" content="Free browser-based label designer. Import CSV or Excel data, design custom label layouts, and print. All data stays on your device." />
</svelte:head>

<div class="flex h-screen flex-col overflow-hidden">
	<ModeWatcher />
	<header class="print-hide bg-card border-border flex h-13 shrink-0 items-center gap-4 border-b px-5">
		<a href='/'>
			<div class="text-black dark:text-primary flex items-center gap-2.5 border-r border-border pr-4 text-[15px] font-bold tracking-tight">
				<img src={favicon} alt="Label Designer Logo" class="size-7" />
				Label Designer
			</div>
		</a>

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

		<div class="ml-auto">
			<LightSwitch variant="ghost" />
		</div>
	</header>

	<main class="flex-1 overflow-hidden">
		{@render children()}
	</main>
</div>
