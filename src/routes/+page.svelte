<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as FileDropZone from '$lib/components/ui/file-drop-zone';
	import { getSpreadsheet, hasSpreadsheetData, openFile, selectSheet } from '$lib/stores/spreadsheet.svelte';
	import * as Select from '$lib/components/ui/select';
	import Upload from '@lucide/svelte/icons/upload';
	import Check from '@lucide/svelte/icons/check';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
	
	const spreadsheet = getSpreadsheet();

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
</script>

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
	</div>
</div>
