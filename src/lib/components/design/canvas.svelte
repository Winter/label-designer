<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import {
		getDesign,
		PPMM,
		selectField,
		updateField,
		deleteSelected,
		zoomIn,
		zoomOut,
		zoomReset,
		type LabelField
	} from '$lib/stores/design.svelte';
	import { saveTemplate, getActiveTemplateName } from '$lib/stores/templates.svelte';
	import { getSpreadsheet } from '$lib/stores/spreadsheet.svelte';
	import ZoomIn from '@lucide/svelte/icons/zoom-in';
	import ZoomOut from '@lucide/svelte/icons/zoom-out';
	import Maximize from '@lucide/svelte/icons/maximize';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Save from '@lucide/svelte/icons/save';
	import * as Dialog from '$lib/components/ui/dialog';
    import { cn } from 'tailwind-variants';

	let dialogOpen = $state(false);
	let templateName = $state('');
	let isUpdate = $state(false);

	$effect(() => {
		if (dialogOpen) {
			isUpdate = getActiveTemplateName() !== null && templateName.trim() === getActiveTemplateName();
		}
	});

	function openSaveDialog() {
		templateName = getActiveTemplateName() ?? '';
		dialogOpen = true;
	}

	function handleSaveTemplate() {
		const name = templateName.trim();
		if (!name) {
			return;
		}

		saveTemplate(name);
		dialogOpen = false;
	}

	const design = getDesign();
	const spreadsheet = getSpreadsheet();

	let canvasW = $derived(design.labelW * PPMM * design.canvasScale);
	let canvasH = $derived(design.labelH * PPMM * design.canvasScale);

	let dragging = false;
	let dragFieldId = '';
	let dragStartX = 0;
	let dragStartY = 0;
	let dragFieldStartX = 0;
	let dragFieldStartY = 0;

	let resizing = false;
	let resizeFieldId = '';
	let resizeStartX = 0;
	let resizeStartY = 0;
	let resizeFieldStartW = 0;
	let resizeFieldStartH = 0;

	function getFieldDisplayText(field: LabelField): string {
		if (field.type === 'static') {
			return field.text || 'Label Text';
		}

		if (field.type === 'qr') {
			return '';
		}

		if (field.column && spreadsheet.data.length > 0) {
			return spreadsheet.data[0][field.column] ?? field.column;
		}

		return field.column ?? '';
	}

	function onCanvasClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			selectField(null);
		}
	}

	function onFieldPointerDown(e: PointerEvent, fieldId: string) {
		e.preventDefault();
		e.stopPropagation();
		selectField(fieldId);

		const field = design.fields.find((f) => f.id === fieldId);
		if (!field) {
			return;
		}

		dragging = true;
		dragFieldId = fieldId;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragFieldStartX = field.x;
		dragFieldStartY = field.y;

		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onFieldPointerMove(e: PointerEvent) {
		if (!dragging) {
			return;
		}

		const dx = (e.clientX - dragStartX) / design.canvasScale;
		const dy = (e.clientY - dragStartY) / design.canvasScale;

		const field = design.fields.find((f) => f.id === dragFieldId);
		if (!field) {
			return;
		}

		const maxX = design.labelW * PPMM - field.w;
		const maxY = design.labelH * PPMM - field.h;

		updateField(dragFieldId, {
			x: Math.max(0, Math.min(maxX, dragFieldStartX + dx)),
			y: Math.max(0, Math.min(maxY, dragFieldStartY + dy))
		});
	}

	function onFieldPointerUp() {
		dragging = false;
	}

	function onResizePointerDown(e: PointerEvent, fieldId: string) {
		e.preventDefault();
		e.stopPropagation();

		const field = design.fields.find((f) => f.id === fieldId);
		if (!field) {
			return;
		}

		resizing = true;
		resizeFieldId = fieldId;
		resizeStartX = e.clientX;
		resizeStartY = e.clientY;
		resizeFieldStartW = field.w;
		resizeFieldStartH = field.h;

		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onResizePointerMove(e: PointerEvent) {
		if (!resizing) {
			return;
		}

		const dx = (e.clientX - resizeStartX) / design.canvasScale;
		const dy = (e.clientY - resizeStartY) / design.canvasScale;

		updateField(resizeFieldId, {
			w: Math.max(10, resizeFieldStartW + dx),
			h: Math.max(10, resizeFieldStartH + dy)
		});
	}

	function onResizePointerUp() {
		resizing = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) {
			return;
		}

		if ((e.key === 'Delete' || e.key === 'Backspace') && design.selectedFieldId) {
			e.preventDefault();
			deleteSelected();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="relative flex flex-1 flex-col overflow-hidden">
	<div class="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
		<Button variant="ghost" size="sm" class="size-7 p-0" onclick={zoomIn} title="Zoom in">
			<ZoomIn class="size-4" />
		</Button>

		<Button variant="ghost" size="sm" class="size-7 p-0" onclick={zoomOut} title="Zoom out">
			<ZoomOut class="size-4" />
		</Button>

		<Button variant="ghost" size="sm" class="size-7 p-0" onclick={zoomReset} title="Reset zoom">
			<Maximize class="size-4" />
		</Button>

		<span class="mx-1 h-4 w-px bg-border"></span>

		<Button
			variant="ghost"
			size="sm"
			class="h-7 px-2 text-xs"
			disabled={!design.selectedFieldId}
			onclick={deleteSelected}
		>
			<Trash2 class="mr-1 size-3.5" />
			Delete
		</Button>

		<span class="mx-1 h-4 w-px bg-border"></span>

		<Button
			variant="ghost"
			size="sm"
			class="h-7 gap-1.5 px-2 text-xs"
			disabled={design.fields.length === 0}
			onclick={openSaveDialog}
		>
			<Save class="size-3.5" />
			Save Template
		</Button>

		<span class="mx-1 h-4 w-px bg-border"></span>

		<Button size="sm" class="h-7 gap-1.5 px-3 text-xs" onclick={() => goto('/print')}>
			Generate Labels
			<ArrowRight class="size-3.5" />
		</Button>
	</div>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="flex flex-1 items-center justify-center overflow-auto"
		style="background: radial-gradient(circle, var(--border) 0.8px, transparent 0.8px); background-size: 24px 24px;"
		onclick={onCanvasClick}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative shrink-0 overflow-hidden bg-white shadow-[0_4px_32px_rgba(0,0,0,0.4)]"
			style="width: {canvasW}px; height: {canvasH}px;"
			onclick={onCanvasClick}
		>
			{#each design.fields as field (field.id)}
				{@const isSelected = field.id === design.selectedFieldId}

				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class={cn("absolute cursor-move select-none rounded-sm border-[1.5px] transition-[border-color,box-shadow] duration-100", {
						'border-ring shadow-[0_0_0_2px] shadow-ring/25': isSelected,
						'border-transparent hover:border-ring/50': !isSelected
					})}
					style="
						left: {field.x * design.canvasScale}px;
						top: {field.y * design.canvasScale}px;
						width: {field.w * design.canvasScale}px;
						height: {field.h * design.canvasScale}px;
					"
					onpointerdown={(e) => onFieldPointerDown(e, field.id)}
					onpointermove={onFieldPointerMove}
					onpointerup={onFieldPointerUp}
				>
					{#if field.type === 'qr'}
						<div
							class="flex size-full items-center justify-center border border-border"
							style="background: repeating-conic-gradient(var(--muted) 0% 25%, white 0% 50%) 50% / 8px 8px;"
						>
							<span class="font-mono text-[9px] text-muted-foreground">QR</span>
						</div>
					{:else}
						<div
							class="size-full overflow-hidden"
							style="
								font-size: {field.fontSize * design.canvasScale}px;
								font-weight: {field.fontWeight};
								text-align: {field.textAlign};
								color: {field.color};
								line-height: 1.2;
								white-space: {field.wrap};
								text-overflow: {field.wrap === 'normal' ? 'clip' : 'ellipsis'};
							"
						>
							{getFieldDisplayText(field)}
						</div>
					{/if}

					{#if isSelected}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="absolute -right-1.25 -bottom-1.25 size-2.5 cursor-nwse-resize rounded-sm border-[1.5px] border-white bg-ring"
							onpointerdown={(e) => onResizePointerDown(e, field.id)}
							onpointermove={onResizePointerMove}
							onpointerup={onResizePointerUp}
						></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>{isUpdate ? 'Update Template' : 'Save Template'}</Dialog.Title>
				<Dialog.Description>
					{isUpdate
						? 'Update the existing template with your current layout, or change the name to save as new.'
						: 'Give your label layout a name so you can reuse it later with different data.'}
				</Dialog.Description>
			</Dialog.Header>

			<input
				type="text"
				bind:value={templateName}
				placeholder="e.g. Product Labels 2x10"
				class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
				onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveTemplate(); } }}
			/>

			<Dialog.Footer>
				<Dialog.Close>
					<Button variant="outline">Cancel</Button>
				</Dialog.Close>
				<Button disabled={!templateName.trim()} onclick={handleSaveTemplate}>
					{isUpdate ? 'Update Template' : 'Save Template'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>
