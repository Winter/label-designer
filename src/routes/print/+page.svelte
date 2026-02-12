<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { getDesign, PPMM, type LabelField } from '$lib/stores/design.svelte';
	import { getSpreadsheet, hasSpreadsheetData } from '$lib/stores/spreadsheet.svelte';
	import QRCode from 'qrcode';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Printer from '@lucide/svelte/icons/printer';

	if (!hasSpreadsheetData()) {
		goto('/', { replaceState: true });
	}

	const design = getDesign();
	const spreadsheet = getSpreadsheet();

	let pageWpx = $derived(design.paperW * PPMM);
	let pageHpx = $derived(design.paperH * PPMM);
	let labelWpx = $derived(design.labelW * PPMM);
	let labelHpx = $derived(design.labelH * PPMM);
	let marginTop = $derived(design.labelMt * PPMM);
	let marginLeft = $derived(design.labelMl * PPMM);
	let hGap = $derived(design.labelHg * PPMM);
	let vGap = $derived(design.labelVg * PPMM);

	let perPage = $derived(design.labelCols * design.labelRows);
	let totalPages = $derived(Math.ceil(spreadsheet.data.length / perPage));

	interface PageData {
		pageIndex: number;
		labels: { row: Record<string, string>; col: number; r: number }[];
	}

	let pages = $derived.by(() => {
		const result: PageData[] = [];

		for (let p = 0; p < totalPages; p++) {
			const labels: PageData['labels'] = [];

			for (let r = 0; r < design.labelRows; r++) {
				for (let c = 0; c < design.labelCols; c++) {
					const idx = p * perPage + r * design.labelCols + c;
					if (idx >= spreadsheet.data.length) break;
					labels.push({ row: spreadsheet.data[idx], col: c, r });
				}
			}

			result.push({ pageIndex: p, labels });
		}

		return result;
	});

	function labelX(col: number): number {
		return marginLeft + col * (labelWpx + hGap);
	}

	function labelY(row: number): number {
		return marginTop + row * (labelHpx + vGap);
	}

	function getFieldText(field: LabelField, row: Record<string, string>): string {
		if (field.type === 'static') return field.text || '';
		if (field.column) return row[field.column] ?? '';
		return '';
	}

	const qrCache = new Map<string, string>();

	async function getQrDataUrl(text: string, size: number): Promise<string> {
		const key = `${text}:${size}`;

		if (qrCache.has(key)) {
			return qrCache.get(key)!;
		}

		const url = await QRCode.toDataURL(text, {
			width: Math.round(size),
			margin: 0,
			errorCorrectionLevel: 'M',
			color: { dark: '#000000', light: '#ffffff' }
		});

		qrCache.set(key, url);
		return url;
	}
</script>

<div class="print-root flex h-full flex-col">
	<div class="print-hide flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card px-5">
		<span class="text-muted-foreground text-[13px]">
			{spreadsheet.data.length} labels &middot; {totalPages} page{totalPages !== 1 ? 's' : ''}
		</span>

		<div class="ml-auto">
			<Button size="sm" class="gap-1.5" onclick={() => window.print()}>
				<Printer class="size-3.5" />
				Print
			</Button>
		</div>
	</div>

	<div
		class="print-scroll flex flex-1 flex-col items-center gap-6 overflow-auto px-8 py-8"
		style="background: radial-gradient(circle, var(--border) 0.8px, transparent 0.8px); background-size: 24px 24px;"
	>
		{#each pages as page (page.pageIndex)}
			<div
				class="print-page relative shrink-0 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.3)]"
				style="width: {pageWpx}px; height: {pageHpx}px;"
			>
				{#each page.labels as label}
					<div
						class="absolute overflow-hidden"
						style="
							left: {labelX(label.col)}px;
							top: {labelY(label.r)}px;
							width: {labelWpx}px;
							height: {labelHpx}px;
						"
					>
						{#each design.fields as field (field.id)}
							<div
								class="absolute overflow-hidden"
								style="
									left: {field.x}px;
									top: {field.y}px;
									width: {field.w}px;
									height: {field.h}px;
								"
							>
								{#if field.type === 'qr'}
									{@const val = field.column ? (label.row[field.column] ?? '') : ''}
									{#if val}
										{#await getQrDataUrl(val, Math.min(field.w, field.h)) then src}
											<img
												{src}
												alt="QR"
												style="width: {field.w}px; height: {field.h}px;"
												class="block"
											/>
										{/await}
									{/if}
								{:else}
									<div
										class="size-full overflow-hidden"
										style="
											font-size: {field.fontSize}px;
											font-weight: {field.fontWeight};
											text-align: {field.textAlign};
											color: {field.color};
											line-height: 1.25;
											white-space: {field.wrap};
											text-overflow: {field.wrap === 'normal' ? 'clip' : 'ellipsis'};
										"
									>
										{getFieldText(field, label.row)}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>
