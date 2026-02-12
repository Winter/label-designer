<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as FileDropZone from '$lib/components/ui/file-drop-zone';
	import { getSpreadsheet, hasSpreadsheetData, openFile, selectSheet } from '$lib/stores/spreadsheet.svelte';
	import {
		getTemplates,
		loadTemplate,
		deleteTemplate,
		exportTemplates,
		importTemplates,
		type LabelTemplate
	} from '$lib/stores/templates.svelte';
	import * as Select from '$lib/components/ui/select';
	import Upload from '@lucide/svelte/icons/upload';
	import Check from '@lucide/svelte/icons/check';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import LayoutTemplate from '@lucide/svelte/icons/layout-template';
	import Download from '@lucide/svelte/icons/download';
	import UploadIcon from '@lucide/svelte/icons/upload';

	let fileInput: HTMLInputElement;

	async function handleImportTemplates(e: Event) {
		const input = e.target as HTMLInputElement;

		const file = input.files?.[0];
		if (!file) {
			return;
		}

		try {
			await importTemplates(file);
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Could not import templates.');
		}

		input.value = '';
	}

	const spreadsheet = getSpreadsheet();
	const templates = getTemplates();

	let loaded = $derived(hasSpreadsheetData());
	let hasMultipleSheets = $derived(spreadsheet.sheetNames.length > 1);

	async function handleUpload(files: File[]) {
		const file = files[0];

		if (!file) {
			return alert('No file selected. Please select a CSV or Excel file to upload.');
		}

		const buffer = await file.arrayBuffer();

		if (!openFile(buffer, file.name)) {
			alert('Could not parse file. Make sure it contains data with headers.');
		}
	}

	function handleSheetChange(value: string | undefined) {
		if (value) {
			selectSheet(value);
		}
	}

	function handleLoad(template: LabelTemplate, index: number) {
		loadTemplate(template, index);
		
		if (loaded) {
			goto('/design');
		}
	}

	function handleDelete(index: number) {
		deleteTemplate(index);
	}

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Label Designer — Import Data & Design Custom Labels</title>
	<meta name="description" content="Import your CSV or Excel spreadsheet and design printable labels. Free, private, and runs entirely in your browser." />
	<meta property="og:title" content="Label Designer — Import Data & Design Custom Labels" />
	<meta property="og:description" content="Import your CSV or Excel spreadsheet and design printable labels. Free, private, and runs entirely in your browser." />
</svelte:head>

<div class="flex h-full w-full items-center justify-center overflow-y-auto">
	<div class="w-full max-w-130 px-6 py-12">
		<h1 class="text-center text-[28px] font-bold tracking-tight">Import your data</h1>
		<p class="text-muted-foreground mb-7 text-center text-sm">
			Drop a CSV or Excel file below to get started. All data stays on your computer.
		</p>

		<FileDropZone.Root onUpload={handleUpload} accept=".csv,.xlsx,.xls" maxFiles={1}>
			<FileDropZone.Trigger>
				{#snippet children()}
					<div class="hover:border-primary hover:bg-primary/10 flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-card px-6 py-13 text-center transition-all">
						<Upload class="text-muted-foreground size-10 opacity-50" />
						<p class="text-muted-foreground text-sm">
							<span class="text-primary font-semibold">Click to browse</span> or drag & drop
							a csv, xlsx, or xls file
						</p>
					</div>
				{/snippet}
			</FileDropZone.Trigger>
		</FileDropZone.Root>

		{#if hasMultipleSheets}
			<div class="mt-4 flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
				<FileSpreadsheet class="text-primary size-5 shrink-0" />

				<div class="min-w-0 flex-1">
					<span class="text-muted-foreground mb-1 block text-xs font-medium">
						Select a sheet
					</span>

					<Select.Root type="single" value={spreadsheet.selectedSheet} onValueChange={handleSheetChange}>
						<Select.Trigger class="w-full" placeholder="Select a sheet...">
							{spreadsheet.selectedSheet || "Select a sheet..."}
						</Select.Trigger>

						<Select.Content>
							{#each spreadsheet.sheetNames as sheetName}
								<Select.Item value={sheetName}>{sheetName}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>
		{/if}

		{#if loaded}
			<div class="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-500">
				<Check class="size-4" strokeWidth={2.5} />
				<span>{spreadsheet.fileName} — {spreadsheet.data.length} rows, {spreadsheet.headers.length} columns</span>
			</div>
		{/if}

		<div class="mt-5 text-center">
			<Button class="gap-2" disabled={!loaded} onclick={() => goto('/design')}>
				Continue to Designer
				<ArrowRight class="size-4" />
			</Button>
		</div>

		<input type="file" accept=".json" class="hidden" bind:this={fileInput} onchange={handleImportTemplates} />

		<div class="mt-10 border-t border-border pt-8">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<LayoutTemplate class="text-muted-foreground size-4.5" />
					<h2 class="text-sm font-semibold tracking-tight">Templates</h2>
				</div>

				<div class="flex items-center gap-1">
					<Button variant="ghost" size="sm" class="gap-1.5 text-xs" onclick={() => fileInput.click()}>
						<UploadIcon class="size-3.5" />
						Import
					</Button>
					
					<Button variant="ghost" size="sm" class="gap-1.5 text-xs" disabled={templates.length === 0} onclick={exportTemplates}>
						<Download class="size-3.5" />
						Export
					</Button>
				</div>
			</div>

			{#if templates.length === 0}
				<p class="text-muted-foreground py-4 text-center text-xs">
					No saved templates yet. Design a label layout, then save it as a template from the designer toolbar.
				</p>
			{:else}
				<div class="space-y-2">
					{#each templates as template, index}
						<div class="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">{template.name}</p>
								<p class="text-muted-foreground text-xs">
									{template.paperW}×{template.paperH}mm paper · {template.labelW}×{template.labelH}mm labels · {template.fields.length} field{template.fields.length === 1 ? '' : 's'} · {formatDate(template.createdAt)}
								</p>
							</div>

							<Button
								variant="outline"
								size="sm"
								class="gap-1.5 text-xs shrink-0"
								disabled={!loaded}
								onclick={() => handleLoad(template, index)}
							>
								<FolderOpen class="size-3.5" />
								Load
							</Button>

							<Button
								variant="ghost"
								size="sm"
								class="text-muted-foreground hover:text-destructive shrink-0 size-8 p-0"
								onclick={() => handleDelete(index)}
							>
								<Trash2 class="size-3.5" />
							</Button>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<footer class="mt-12 text-center text-xs text-muted-foreground">
			&copy; {new Date().getFullYear()} Edward. All rights reserved.
		</footer>
	</div>
</div>
