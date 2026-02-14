<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import { getDesign, PPMM, updateField, deleteSelected, getSelectedField, formatSequenceValue } from '$lib/stores/design.svelte';
	import { getSpreadsheet } from '$lib/stores/spreadsheet.svelte';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	const design = getDesign();
	const spreadsheet = getSpreadsheet();
	let field = $derived(getSelectedField());
	let labelWpx = $derived(design.labelW * PPMM);
	let labelHpx = $derived(design.labelH * PPMM);

	function update(updates: Record<string, unknown>) {
		if (field) {
			updateField(field.id, updates);
		}
	}

	const weightOptions = [
		{ value: '400', label: 'Normal' },
		{ value: '600', label: 'Semi-bold' },
		{ value: '700', label: 'Bold' }
	];

	const alignOptions = [
		{ value: 'left', label: 'Left' },
		{ value: 'center', label: 'Center' },
		{ value: 'right', label: 'Right' }
	];

	const wrapOptions = [
		{ value: 'nowrap', label: 'No wrap (ellipsis)' },
		{ value: 'normal', label: 'Wrap text' }
	];
</script>

<aside class="flex w-65 shrink-0 flex-col overflow-y-auto border-l border-border bg-card">
	{#if design.selectedFieldIds.length > 1}
		<div class="flex flex-col items-center gap-3 px-5 py-10 text-center text-[13px]">
			<span class="text-muted-foreground">{design.selectedFieldIds.length} fields selected</span>
			<Button variant="destructive" size="sm" class="w-full" onclick={deleteSelected}>
				<Trash2 class="mr-1.5 size-3.5" />
				Delete All
			</Button>
		</div>
	{:else if !field}
		<div class="text-muted-foreground px-5 py-10 text-center text-[13px] leading-relaxed">
			Select an element on the label to edit its properties, or add one from the left sidebar.
		</div>
	{:else}
		<section class="border-b border-border px-4 py-3.5">
			<div class="text-[13px] font-semibold">
				{#if field.type === 'qr'}
					QR Code
				{:else if field.type === 'sequence'}
					Sequential Number
				{:else}
					Text Field
				{/if}
			</div>
			<div class="text-muted-foreground text-[11px]">
				{#if field.type === 'qr'}
					{field.column ? `Column: ${field.column}` : (field.text ? 'Manual data' : 'No data source')}
				{:else if field.type === 'sequence'}
					Auto-incrementing number
				{:else}
					{field.column ? `Column: ${field.column}` : (field.text ? 'Manual text' : 'No data source')}
				{/if}
			</div>
		</section>

		{#if field.type === 'text' || field.type === 'qr'}
			<section class="border-b border-border px-4 py-3.5">
				<h3 class="text-muted-foreground mb-2.5 text-[10px] font-bold uppercase tracking-wider">
					Data Source
				</h3>

				<Select.Root
					type="single"
					value={field.column ?? '__manual__'}
					onValueChange={(v) => {
						if (v === '__manual__') {
							update({ column: null });
						} else if (v) {
							update({ column: v });
						}
					}}
				>
					<Select.Trigger class="w-full" size="sm">
						{field.column ?? 'Manual Entry'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="__manual__">Manual Entry</Select.Item>
						{#each spreadsheet.headers as header}
							<Select.Item value={header}>{header}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				{#if !field.column}
					<div class="mt-2">
						<span class="text-muted-foreground mb-1 block text-[10px]">
							{field.type === 'qr' ? 'QR Data' : 'Text Content'}
						</span>
						<Input
							type="text"
							placeholder={field.type === 'qr' ? 'Enter QR data…' : 'Enter text…'}
							value={field.text}
							oninput={(e) => update({ text: e.currentTarget.value })}
							class="h-7 text-xs"
						/>
					</div>
				{/if}
			</section>
		{/if}

		{#if field.type === 'sequence'}
			<section class="border-b border-border px-4 py-3.5">
				<h3 class="text-muted-foreground mb-2.5 text-[10px] font-bold uppercase tracking-wider">
					Sequence Settings
				</h3>

				<div class="flex flex-col gap-2">
					<div class="grid grid-cols-2 gap-2">
						<div>
							<span class="text-muted-foreground mb-1 block text-[10px]">Start</span>
							<Input
								type="number"
								min={0}
								step={1}
								value={field.seqStart ?? 1}
								oninput={(e) => {
									const v = parseInt(e.currentTarget.value);
									if (!isNaN(v)) update({ seqStart: v });
								}}
								class="h-7 text-xs"
							/>
						</div>
						<div>
							<span class="text-muted-foreground mb-1 block text-[10px]">Step</span>
							<Input
								type="number"
								min={1}
								step={1}
								value={field.seqStep ?? 1}
								oninput={(e) => {
									const v = parseInt(e.currentTarget.value);
									if (!isNaN(v) && v > 0) update({ seqStep: v });
								}}
								class="h-7 text-xs"
							/>
						</div>
					</div>

					<div>
						<span class="text-muted-foreground mb-1 block text-[10px]">Padding (min digits)</span>
						<Input
							type="number"
							min={1}
							max={10}
							step={1}
							value={field.seqPadding ?? 1}
							oninput={(e) => {
								const v = parseInt(e.currentTarget.value);
								if (!isNaN(v) && v >= 1) update({ seqPadding: v });
							}}
							class="h-7 text-xs"
						/>
					</div>

					<div>
						<span class="text-muted-foreground mb-1 block text-[10px]">Prefix</span>
						<Input
							type="text"
							placeholder="e.g. INV-"
							value={field.seqPrefix ?? ''}
							oninput={(e) => update({ seqPrefix: e.currentTarget.value })}
							class="h-7 text-xs"
						/>
					</div>

					<div>
						<span class="text-muted-foreground mb-1 block text-[10px]">Suffix</span>
						<Input
							type="text"
							placeholder="e.g. -A"
							value={field.seqSuffix ?? ''}
							oninput={(e) => update({ seqSuffix: e.currentTarget.value })}
							class="h-7 text-xs"
						/>
					</div>

					<div class="text-muted-foreground mt-1 rounded border border-border bg-muted/50 px-2 py-1.5 font-mono text-[10px]">
						Preview: {formatSequenceValue(field, 0)}, {formatSequenceValue(field, 1)}, {formatSequenceValue(field, 2)}…
					</div>
				</div>
			</section>
		{/if}

		{#if field.type !== 'qr'}
			<section class="border-b border-border px-4 py-3.5">
				<h3 class="text-muted-foreground mb-2.5 text-[10px] font-bold uppercase tracking-wider">
					Typography
				</h3>

				<div class="flex flex-col gap-2">
					<div>
						<span class="text-muted-foreground mb-1 block text-[10px]">Font size (px)</span>
						<Input
							type="number"
							min={5}
							max={48}
							step={1}
							value={field.fontSize}
							oninput={(e) => {
								const v = parseInt(e.currentTarget.value);
								if (!isNaN(v)) update({ fontSize: v });
							}}
							class="h-7 text-xs"
						/>
					</div>

					<div>
						<span class="text-muted-foreground mb-1 block text-[10px]">Weight</span>
						<Select.Root
							type="single"
							value={field.fontWeight}
							onValueChange={(v) => { if (v) update({ fontWeight: v }); }}
						>
							<Select.Trigger class="w-full" size="sm">
								{weightOptions.find((o) => o.value === field?.fontWeight)?.label ?? 'Normal'}
							</Select.Trigger>
							<Select.Content>
								{#each weightOptions as opt}
									<Select.Item value={opt.value}>{opt.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div>
						<span class="text-muted-foreground mb-1 block text-[10px]">Align</span>
						<Select.Root
							type="single"
							value={field.textAlign}
							onValueChange={(v) => { if (v) update({ textAlign: v }); }}
						>
							<Select.Trigger class="w-full" size="sm">
								{alignOptions.find((o) => o.value === field?.textAlign)?.label ?? 'Left'}
							</Select.Trigger>

							<Select.Content>
								{#each alignOptions as opt}
									<Select.Item value={opt.value}>{opt.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div>
						<span class="text-muted-foreground mb-1 block text-[10px]">Color</span>
						<input
							type="color"
							value={field.color}
							oninput={(e) => update({ color: e.currentTarget.value })}
							class="h-7 w-full cursor-pointer rounded-md border border-border"
						/>
					</div>
				</div>
			</section>
		{/if}

		{#if field.type !== 'qr'}
			<section class="border-b border-border px-4 py-3.5">
				<h3 class="text-muted-foreground mb-2.5 text-[10px] font-bold uppercase tracking-wider">
					Overflow
				</h3>

				<Select.Root
					type="single"
					value={field.wrap}
					onValueChange={(v) => { if (v) update({ wrap: v }); }}
				>
					<Select.Trigger class="w-full" size="sm">
						{wrapOptions.find((o) => o.value === field?.wrap)?.label ?? 'No wrap'}
					</Select.Trigger>

					<Select.Content>
						{#each wrapOptions as opt}
							<Select.Item value={opt.value}>{opt.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</section>
		{/if}

		<section class="border-b border-border px-4 py-3.5">
			<h3 class="text-muted-foreground mb-2.5 text-[10px] font-bold uppercase tracking-wider">
				Position & Size
			</h3>

			<div class="grid grid-cols-2 gap-2">
				<div>
					<span class="text-muted-foreground mb-1 block text-[10px]">X</span>
					<Input
						type="number"
						step={1}
						value={Math.round(field.x)}
						oninput={(e) => {
							const v = parseFloat(e.currentTarget.value);
							if (!isNaN(v)) update({ x: Math.max(0, Math.min(v, labelWpx - field.w)) });
						}}
						class="h-7 text-xs"
					/>
				</div>

				<div>
					<span class="text-muted-foreground mb-1 block text-[10px]">Y</span>
					<Input
						type="number"
						step={1}
						value={Math.round(field.y)}
						oninput={(e) => {
							const v = parseFloat(e.currentTarget.value);
							if (!isNaN(v)) update({ y: Math.max(0, Math.min(v, labelHpx - field.h)) });
						}}
						class="h-7 text-xs"
					/>
				</div>

				<div>
					<span class="text-muted-foreground mb-1 block text-[10px]">W</span>
					<Input
						type="number"
						min={10}
						step={1}
						value={Math.round(field.w)}
						oninput={(e) => {
							const v = parseFloat(e.currentTarget.value);
							if (!isNaN(v)) update({ w: Math.max(10, Math.min(v, labelWpx - field.x)) });
						}}
						class="h-7 text-xs"
					/>
				</div>

				<div>
					<span class="text-muted-foreground mb-1 block text-[10px]">H</span>
					<Input
						type="number"
						min={10}
						step={1}
						value={Math.round(field.h)}
						oninput={(e) => {
							const v = parseFloat(e.currentTarget.value);
							if (!isNaN(v)) update({ h: Math.max(10, Math.min(v, labelHpx - field.y)) });
						}}
						class="h-7 text-xs"
					/>
				</div>
			</div>
		</section>

		<section class="px-4 py-3.5">
			<Button variant="destructive" size="sm" class="w-full" onclick={deleteSelected}>
				<Trash2 class="mr-1.5 size-3.5" />
				Delete Field
			</Button>
		</section>
	{/if}
</aside>
