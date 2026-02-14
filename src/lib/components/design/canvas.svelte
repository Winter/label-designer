<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import {
		getDesign,
		PPMM,
		selectField,
		toggleFieldSelection,
		selectFieldIds,
		updateField,
		deleteSelected,
		zoomIn,
		zoomOut,
		zoomReset,
		formatSequenceValue,
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
	import Grid3x3 from '@lucide/svelte/icons/grid-3x3';
	import Magnet from '@lucide/svelte/icons/magnet';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
    import { cn } from 'tailwind-variants';
	import { computeSnap, computeSnapForResize, type SnapGuide } from '$lib/utils/snap';
	import { getSettings } from '$lib/stores/settings.svelte';
	import QRCode from 'qrcode';

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
	const settings = getSettings();

	let canvasW = $derived(design.labelW * PPMM * design.canvasScale);
	let canvasH = $derived(design.labelH * PPMM * design.canvasScale);

	let dragging = false;
	let dragFieldId = '';
	let dragStartX = 0;
	let dragStartY = 0;
	let dragFieldStartX = 0;
	let dragFieldStartY = 0;
	let dragGroupStarts: Map<string, { x: number; y: number }> = new Map();

	let resizing = false;
	let resizeFieldId = '';
	let resizeStartX = 0;
	let resizeStartY = 0;
	let resizeFieldStartW = 0;
	let resizeFieldStartH = 0;

	let activeGuides: SnapGuide[] = $state([]);

	let marquee = $state(false);
	let marqueeStartX = $state(0);
	let marqueeStartY = $state(0);
	let marqueeCurrentX = $state(0);
	let marqueeCurrentY = $state(0);
	let canvasEl: HTMLDivElement;
	let wrapperEl: HTMLDivElement;

	let sampleRow = $state(0);

	function getFieldDisplayText(field: LabelField): string {
		if (field.type === 'sequence') {
			return formatSequenceValue(field, sampleRow);
		}

		if (field.type === 'qr') {
			return '';
		}

		if (field.column && spreadsheet.data.length > 0) {
			const row = spreadsheet.data[sampleRow] ?? spreadsheet.data[0];
			return row[field.column] ?? field.column;
		}

		if (field.text) {
			return field.text;
		}

		return field.column ?? 'No data';
	}

	function getQrText(field: LabelField): string {
		if (field.column && spreadsheet.data.length > 0) {
			const row = spreadsheet.data[sampleRow] ?? spreadsheet.data[0];
			return row[field.column] ?? '';
		}
		return field.text || '';
	}

	let qrCache = $state<Map<string, string>>(new Map());

	function generateQr(text: string, size: number) {
		const key = `${text}:${size}`;
		if (qrCache.has(key)) return;
		
		qrCache.set(key, '');
		QRCode.toDataURL(text, {
			width: Math.round(size),
			margin: 0,
			errorCorrectionLevel: 'M',
			color: { dark: '#000000', light: '#ffffff' }
		}).then((url) => {
			qrCache = new Map(qrCache).set(key, url);
		});
	}

	function onWrapperPointerDown(e: PointerEvent) {
		if (e.target !== wrapperEl && e.target !== canvasEl) return;
		e.preventDefault();

		const rect = wrapperEl.getBoundingClientRect();
		marqueeStartX = e.clientX - rect.left + wrapperEl.scrollLeft;
		marqueeStartY = e.clientY - rect.top + wrapperEl.scrollTop;
		marqueeCurrentX = marqueeStartX;
		marqueeCurrentY = marqueeStartY;
		marquee = true;

		wrapperEl.setPointerCapture(e.pointerId);
	}

	function onWrapperPointerMove(e: PointerEvent) {
		if (!marquee) return;

		const rect = wrapperEl.getBoundingClientRect();
		marqueeCurrentX = e.clientX - rect.left + wrapperEl.scrollLeft;
		marqueeCurrentY = e.clientY - rect.top + wrapperEl.scrollTop;
	}

	function onWrapperPointerUp() {
		if (!marquee) return;
		marquee = false;

		const wasDrag = Math.abs(marqueeCurrentX - marqueeStartX) > 3 || Math.abs(marqueeCurrentY - marqueeStartY) > 3;

		if (wasDrag) {
			const canvasRect = canvasEl.getBoundingClientRect();
			const wrapperRect = wrapperEl.getBoundingClientRect();
			const canvasOffsetX = canvasRect.left - wrapperRect.left + wrapperEl.scrollLeft;
			const canvasOffsetY = canvasRect.top - wrapperRect.top + wrapperEl.scrollTop;

			const x1 = (Math.min(marqueeStartX, marqueeCurrentX) - canvasOffsetX) / design.canvasScale;
			const y1 = (Math.min(marqueeStartY, marqueeCurrentY) - canvasOffsetY) / design.canvasScale;
			const x2 = (Math.max(marqueeStartX, marqueeCurrentX) - canvasOffsetX) / design.canvasScale;
			const y2 = (Math.max(marqueeStartY, marqueeCurrentY) - canvasOffsetY) / design.canvasScale;

			const ids = design.fields
				.filter((f) => f.x + f.w > x1 && f.x < x2 && f.y + f.h > y1 && f.y < y2)
				.map((f) => f.id);
			selectFieldIds(ids);
		} else {
			selectField(null);
		}
	}

	function onFieldPointerDown(e: PointerEvent, fieldId: string) {
		e.preventDefault();
		e.stopPropagation();

		if (e.shiftKey) {
			toggleFieldSelection(fieldId);
		} else if (!design.selectedFieldIds.includes(fieldId)) {
			selectField(fieldId);
		}

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

		// Store start positions of all selected fields for group drag
		dragGroupStarts = new Map();
		for (const id of design.selectedFieldIds) {
			const f = design.fields.find((ff) => ff.id === id);
			if (f) dragGroupStarts.set(id, { x: f.x, y: f.y });
		}

		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onFieldPointerMove(e: PointerEvent) {
		if (!dragging) {
			return;
		}

		const dx = (e.clientX - dragStartX) / design.canvasScale;
		const dy = (e.clientY - dragStartY) / design.canvasScale;

		const canvasDesignW = design.labelW * PPMM;
		const canvasDesignH = design.labelH * PPMM;

		// Compute the group bounding box at its proposed position
		let groupX = Infinity, groupY = Infinity, groupR = -Infinity, groupB = -Infinity;
		for (const [id, start] of dragGroupStarts) {
			const f = design.fields.find((ff) => ff.id === id);
			if (!f) continue;
			const nx = start.x + dx;
			const ny = start.y + dy;
			groupX = Math.min(groupX, nx);
			groupY = Math.min(groupY, ny);
			groupR = Math.max(groupR, nx + f.w);
			groupB = Math.max(groupB, ny + f.h);
		}

		// Clamp the group bounding box within the canvas
		let clampDx = dx;
		let clampDy = dy;
		if (groupX < 0) clampDx = dx - groupX;
		else if (groupR > canvasDesignW) clampDx = dx - (groupR - canvasDesignW);
		if (groupY < 0) clampDy = dy - groupY;
		else if (groupB > canvasDesignH) clampDy = dy - (groupB - canvasDesignH);

		// Recompute the clamped group bounding box for snap
		groupX = Infinity; groupY = Infinity; groupR = -Infinity; groupB = -Infinity;
		for (const [id, start] of dragGroupStarts) {
			const f = design.fields.find((ff) => ff.id === id);
			if (!f) continue;
			groupX = Math.min(groupX, start.x + clampDx);
			groupY = Math.min(groupY, start.y + clampDy);
			groupR = Math.max(groupR, start.x + clampDx + f.w);
			groupB = Math.max(groupB, start.y + clampDy + f.h);
		}

		let snapDx = 0;
		let snapDy = 0;

		if (settings.smartGuides) {
			const selectedIds = design.selectedFieldIds;
			const otherFields = design.fields.filter((f) => !selectedIds.includes(f.id));
			const groupBox = { x: groupX, y: groupY, w: groupR - groupX, h: groupB - groupY };
			const snap = computeSnap(groupBox, otherFields, canvasDesignW, canvasDesignH);

			snapDx = snap.x - groupBox.x;
			snapDy = snap.y - groupBox.y;
			activeGuides = snap.guides;
		} else {
			activeGuides = [];
		}

		// Apply clamped delta + snap offset to all selected fields
		for (const [id, start] of dragGroupStarts) {
			updateField(id, {
				x: start.x + clampDx + snapDx,
				y: start.y + clampDy + snapDy
			});
		}
	}

	function onFieldPointerUp() {
		dragging = false;
		activeGuides = [];
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

		const field = design.fields.find((f) => f.id === resizeFieldId);
		if (!field) {
			return;
		}

		const canvasDesignW = design.labelW * PPMM;
		const canvasDesignH = design.labelH * PPMM;
		const freeW = Math.max(10, resizeFieldStartW + dx);
		const freeH = Math.max(10, resizeFieldStartH + dy);

		if (settings.smartGuides) {
			const otherFields = design.fields.filter((f) => f.id !== resizeFieldId);
			const snap = computeSnapForResize(
				{ x: field.x, y: field.y, w: freeW, h: freeH },
				otherFields,
				canvasDesignW,
				canvasDesignH
			);

			updateField(resizeFieldId, {
				w: Math.max(10, snap.w),
				h: Math.max(10, snap.h)
			});

			activeGuides = snap.guides;
		} else {
			updateField(resizeFieldId, { w: freeW, h: freeH });
			activeGuides = [];
		}
	}

	function onResizePointerUp() {
		resizing = false;
		activeGuides = [];
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		if (e.deltaY < 0) {
			zoomIn();
		} else {
			zoomOut();
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) {
			return;
		}

		if ((e.key === 'Delete' || e.key === 'Backspace') && design.selectedFieldIds.length > 0) {
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

		<Button variant="ghost" size="sm" class={cn("size-7 p-0", settings.showGrid && "bg-accent text-accent-foreground")} onclick={() => settings.showGrid = !settings.showGrid} title="Toggle grid">
			<Grid3x3 class="size-4" />
		</Button>

		<Button variant="ghost" size="sm" class={cn("size-7 p-0", settings.smartGuides && "bg-accent text-accent-foreground")} onclick={() => settings.smartGuides = !settings.smartGuides} title="Toggle smart guides">
			<Magnet class="size-4" />
		</Button>

		<span class="mx-1 h-4 w-px bg-border"></span>

		<Button
			variant="ghost"
			size="sm"
			class="h-7 px-2 text-xs"
			disabled={design.selectedFieldIds.length === 0}
			onclick={deleteSelected}
		>
			<Trash2 class="mr-1 size-3.5" />
			Delete
		</Button>

		{#if spreadsheet.data.length > 1}
			<span class="mx-1 h-4 w-px bg-border"></span>

			<div class="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
				<span>Sample</span>
				<Select.Root
					type="single"
					value={String(sampleRow)}
					onValueChange={(v) => { if (v) sampleRow = parseInt(v); }}
				>
					<Select.Trigger class="h-7 w-16" size="sm">
						{sampleRow + 1}
					</Select.Trigger>
					
					<Select.Content>
						{#each spreadsheet.data as _, i}
							<Select.Item value={String(i)}>{i + 1}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		{/if}

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

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={wrapperEl}
		class="relative flex flex-1 items-center justify-center overflow-auto"
		style="background: radial-gradient(circle, var(--border) 0.8px, transparent 0.8px); background-size: 24px 24px;"
		onpointerdown={onWrapperPointerDown}
		onpointermove={onWrapperPointerMove}
		onpointerup={onWrapperPointerUp}
		onwheel={onWheel}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={canvasEl}
			class="relative shrink-0 overflow-hidden bg-white shadow-[0_4px_32px_rgba(0,0,0,0.4)]"
			style="width: {canvasW}px; height: {canvasH}px;"
		>
			{#if settings.showGrid}
				{@const gridSize = PPMM * 5 * design.canvasScale}
				{@const cx = canvasW / 2}
				{@const cy = canvasH / 2}
				<svg class="pointer-events-none absolute inset-0 size-full">
					<defs>
						<pattern id="grid" x={cx % gridSize} y={cy % gridSize} width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
							<path d="M {gridSize} 0 L 0 0 0 {gridSize}" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="1" stroke-dasharray="4 3" />
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#grid)" />
					<line x1={cx} y1="0" x2={cx} y2="100%" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="6 4" stroke-dashoffset={-(cy - 3)} />
					<line x1="0" y1={cy} x2="100%" y2={cy} stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="6 4" stroke-dashoffset={-(cx - 3)} />
				</svg>
			{/if}

			{#each design.fields as field (field.id)}
				{@const isSelected = design.selectedFieldIds.includes(field.id)}

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
						{@const qrText = getQrText(field)}
						{@const qrSize = Math.round(Math.min(field.w, field.h) * design.canvasScale)}
						{@const qrKey = `${qrText}:${qrSize}`}
						{@const qrUrl = qrText ? (generateQr(qrText, qrSize), qrCache.get(qrKey)) : ''}
						{#if qrUrl}
							<img src={qrUrl} alt="QR" class="size-full object-contain" draggable="false" />
						{:else}
							<div
								class="flex size-full flex-col items-center justify-center border border-border text-muted-foreground text-[10px]"
								style="background: repeating-conic-gradient(var(--muted) 0% 25%, white 0% 50%) 50% / 8px 8px;"
							>
								{#if !qrText}No data{/if}
							</div>
						{/if}
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

			{#each activeGuides as guide (`${guide.axis}-${guide.position}`)}
				{#if guide.axis === 'x'}
					<div
						class="pointer-events-none absolute top-0 z-50"
						style="left: {guide.position * design.canvasScale}px; width: 1px; height: 100%; background: cyan;"
					></div>
				{:else}
					<div
						class="pointer-events-none absolute left-0 z-50"
						style="top: {guide.position * design.canvasScale}px; height: 1px; width: 100%; background: magenta;"
					></div>
				{/if}
			{/each}

		</div>

		{#if marquee}
			{@const mx = Math.min(marqueeStartX, marqueeCurrentX)}
			{@const my = Math.min(marqueeStartY, marqueeCurrentY)}
			{@const mw = Math.abs(marqueeCurrentX - marqueeStartX)}
			{@const mh = Math.abs(marqueeCurrentY - marqueeStartY)}
			<div
				class="pointer-events-none absolute z-50 border border-ring bg-ring/10"
				style="left: {mx}px; top: {my}px; width: {mw}px; height: {mh}px;"
			></div>
		{/if}
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
				class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
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
