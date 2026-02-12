<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import { getDesign, PPMM, updateField, deleteSelected, getSelectedField } from '$lib/stores/design.svelte';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	const design = getDesign();
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
	{#if !field}
		<div class="text-muted-foreground px-5 py-10 text-center text-[13px] leading-relaxed">
			Select a field on the label to edit its properties, or click a column on the left to add it.
		</div>
	{:else}
		<section class="border-b border-border px-4 py-3.5">
			<div class="text-[13px] font-semibold">
				{#if field.type === 'static'}
					Static Text
				{:else if field.type === 'qr'}
					QR: {field.column}
				{:else}
					{field.column}
				{/if}
			</div>
			<div class="text-muted-foreground text-[11px]">
				{#if field.type === 'static'}
					Static text field
				{:else if field.type === 'qr'}
					QR Code
				{:else}
					CSV text field
				{/if}
			</div>
		</section>

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

		{#if field.type === 'static'}
			<section class="border-b border-border px-4 py-3.5">
				<h3 class="text-muted-foreground mb-2.5 text-[10px] font-bold uppercase tracking-wider">
					Text Content
				</h3>

				<Input
					type="text"
					placeholder="Enter text…"
					value={field.text}
					oninput={(e) => update({ text: e.currentTarget.value })}
					class="h-7 text-xs"
				/>
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
