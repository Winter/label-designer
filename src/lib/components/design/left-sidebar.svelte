<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import {
		getDesign,
		PAPER_PRESETS,
		LABEL_PRESETS,
		setPaperPreset,
		markPaperCustom,
		setLabelPreset,
		markLabelCustom,
		addField
	} from '$lib/stores/design.svelte';
	import { getSpreadsheet } from '$lib/stores/spreadsheet.svelte';

	const design = getDesign();
	const spreadsheet = getSpreadsheet();

	const paperOptions = [
		...Object.entries(PAPER_PRESETS).map(([value, p]) => ({ value, label: p.label })),
		{ value: 'custom', label: 'Custom…' }
	];

	const labelOptions = [
		...Object.entries(LABEL_PRESETS).map(([value, p]) => ({ value, label: p.label })),
		{ value: 'custom', label: 'Custom…' }
	];

	function handlePaperPreset(value: string | undefined) {
		if (value) {
			setPaperPreset(value);
		}
	}

	function handleLabelPreset(value: string | undefined) {
		if (value) {
			setLabelPreset(value);
		}
	}

	function onPaperFieldChange() {
		markPaperCustom();
	}

	function onLabelFieldChange() {
		markLabelCustom();
	}
</script>

<aside class="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-border bg-card">
	<section class="border-b border-border px-4 py-3.5">
		<h3 class="text-muted-foreground mb-2.5 text-[10px] font-bold uppercase tracking-wider">
			Paper Size
		</h3>

		<Select.Root type="single" value={design.paperPreset} onValueChange={handlePaperPreset}>
			<Select.Trigger class="w-full" size="sm">
				{paperOptions.find(option => option.value === design.paperPreset)?.label ?? 'Custom…'}
			</Select.Trigger>
			<Select.Content>
				{#each paperOptions as opt}
					<Select.Item value={opt.value}>{opt.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<div class="mt-2 grid grid-cols-2 gap-2">
			<div>
				<span class="text-muted-foreground mb-1 block text-[10px]">Width (mm)</span>
				<Input
					type="number"
					min={10}
					step={1}
					bind:value={design.paperW}
					oninput={onPaperFieldChange}
					class="h-7 text-xs"
				/>
			</div>

			<div>
				<span class="text-muted-foreground mb-1 block text-[10px]">Height (mm)</span>
				<Input
					type="number"
					min={10}
					step={1}
					bind:value={design.paperH}
					oninput={onPaperFieldChange}
					class="h-7 text-xs"
				/>
			</div>
		</div>
	</section>

	<section class="border-b border-border px-4 py-3.5">
		<h3 class="text-muted-foreground mb-2.5 text-[10px] font-bold uppercase tracking-wider">
			Label Size
		</h3>

		<Select.Root type="single" value={design.labelPreset} onValueChange={handleLabelPreset}>
			<Select.Trigger class="w-full" size="sm">
				{labelOptions.find((o) => o.value === design.labelPreset)?.label ?? 'Custom…'}
			</Select.Trigger>

			<Select.Content>
				{#each labelOptions as opt}
					<Select.Item value={opt.value}>{opt.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<div class="mt-2.5 grid grid-cols-2 gap-2">
			<div>
				<span class="text-muted-foreground mb-1 block text-[10px]">Width (mm)</span>
				<Input
					type="number"
					min={5}
					step={0.5}
					bind:value={design.labelW}
					oninput={onLabelFieldChange}
					class="h-7 text-xs"
				/>
			</div>
			<div>
				<span class="text-muted-foreground mb-1 block text-[10px]">Height (mm)</span>
				<Input
					type="number"
					min={5}
					step={0.5}
					bind:value={design.labelH}
					oninput={onLabelFieldChange}
					class="h-7 text-xs"
				/>
			</div>
		</div>

		<div class="mt-2 grid grid-cols-2 gap-2">
			<div>
				<span class="text-muted-foreground mb-1 block text-[10px]">Columns</span>
				<Input
					type="number"
					min={1}
					max={20}
					bind:value={design.labelCols}
					oninput={onLabelFieldChange}
					class="h-7 text-xs"
				/>
			</div>

			<div>
				<span class="text-muted-foreground mb-1 block text-[10px]">Rows</span>
				<Input
					type="number"
					min={1}
					max={50}
					bind:value={design.labelRows}
					oninput={onLabelFieldChange}
					class="h-7 text-xs"
				/>
			</div>
		</div>

		<div class="mt-2 grid grid-cols-2 gap-2">
			<div>
				<span class="text-muted-foreground mb-1 block text-[10px]">Top (mm)</span>
				<Input
					type="number"
					min={0}
					step={0.5}
					bind:value={design.labelMt}
					oninput={onLabelFieldChange}
					class="h-7 text-xs"
				/>
			</div>

			<div>
				<span class="text-muted-foreground mb-1 block text-[10px]">Left (mm)</span>
				<Input
					type="number"
					min={0}
					step={0.5}
					bind:value={design.labelMl}
					oninput={onLabelFieldChange}
					class="h-7 text-xs"
				/>
			</div>
		</div>

		<div class="mt-2 grid grid-cols-2 gap-2">
			<div>
				<span class="text-muted-foreground mb-1 block text-[10px]">Horizontal Gap (mm)</span>
				<Input
					type="number"
					min={0}
					step={0.5}
					bind:value={design.labelHg}
					oninput={onLabelFieldChange}
					class="h-7 text-xs"
				/>
			</div>

			<div>
				<span class="text-muted-foreground mb-1 block text-[10px]">Vertical Gap (mm)</span>
				<Input
					type="number"
					min={0}
					step={0.5}
					bind:value={design.labelVg}
					oninput={onLabelFieldChange}
					class="h-7 text-xs"
				/>
			</div>
		</div>
	</section>

	<section class="border-b border-border px-4 py-3.5">
		<h3 class="text-muted-foreground mb-2.5 text-[10px] font-bold uppercase tracking-wider">
			Elements
		</h3>

		<div class="flex flex-col gap-1">
			<button
				class="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-left text-[12px] transition-colors hover:border-primary hover:bg-primary/10"
				onclick={() => addField('text')}
			>
				<span class="size-2 shrink-0 rounded-full bg-chart-1"></span>
				<span class="min-w-0 flex-1 truncate">Text Field</span>
				<span class="text-muted-foreground shrink-0 font-mono text-[10px]">TEXT</span>
			</button>

			<button
				class="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-left text-[12px] transition-colors hover:border-primary hover:bg-primary/10"
				onclick={() => addField('qr')}
			>
				<span class="size-2 shrink-0 rounded-full bg-chart-3"></span>
				<span class="min-w-0 flex-1 truncate">QR Code</span>
				<span class="text-muted-foreground shrink-0 font-mono text-[10px]">QR</span>
			</button>

			<button
				class="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-left text-[12px] transition-colors hover:border-primary hover:bg-primary/10"
				onclick={() => addField('sequence')}
			>
				<span class="size-2 shrink-0 rounded-full bg-chart-4"></span>
				<span class="min-w-0 flex-1 truncate">Sequential Number</span>
				<span class="text-muted-foreground shrink-0 font-mono text-[10px]">SEQ</span>
			</button>
		</div>
	</section>

	{#if spreadsheet.headers.length > 0}
		<section class="border-b border-border px-4 py-3.5">
			<h3 class="text-muted-foreground mb-2.5 text-[10px] font-bold uppercase tracking-wider">
				Spreadsheet Columns
			</h3>

			<div class="flex flex-col gap-1">
				{#each spreadsheet.headers as header}
					<button
						class="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-left text-[12px] transition-colors hover:border-primary hover:bg-primary/10"
						onclick={() => addField('text', header)}
					>
						<span class="size-2 shrink-0 rounded-full bg-chart-1"></span>
						<span class="min-w-0 flex-1 truncate">{header}</span>
						<span class="text-muted-foreground shrink-0 font-mono text-[10px]">TEXT</span>
					</button>
				{/each}
			</div>
		</section>
	{/if}
</aside>
