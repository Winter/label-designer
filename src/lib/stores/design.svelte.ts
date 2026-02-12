export const PPMM = 96 / 25.4;
export const DEFAULT_SCALE = 2.5;

export const PAPER_PRESETS: Record<string, PaperPreset> = {
	a3: { label: 'A3 (297 × 420 mm)', w: 297, h: 420 },
	a4: { label: 'A4 (210 × 297 mm)', w: 210, h: 297 },
	a5: { label: 'A5 (148 × 210 mm)', w: 148, h: 210 },
	letter: { label: 'US Letter (216 × 279 mm)', w: 215.9, h: 279.4 },
	legal: { label: 'US Legal (216 × 356 mm)', w: 215.9, h: 355.6 },
};

export const LABEL_PRESETS: Record<string, LabelPreset> = {
	label98x25: { label: '98 × 25.4 mm — 20/sheet', w: 98, h: 25.4, cols: 2, rows: 10, mt: 12.7, ml: 5.5, hg: 3, vg: 3 },
};

export type FieldType = 'text' | 'qr' | 'static';

export interface PaperPreset {
	label: string;
	w: number;
	h: number;
}

export interface LabelPreset {
	label: string;
	w: number;
	h: number;
	cols: number;
	rows: number;
	mt: number;
	ml: number;
	hg: number;
	vg: number;
}

export interface LabelField {
	id: string;
	type: FieldType;
	column: string | null;
	text: string;
	x: number;
	y: number;
	w: number;
	h: number;
	fontSize: number;
	fontWeight: string;
	textAlign: string;
	color: string;
	wrap: string;
}

interface DesignState {
	paperPreset: string;
	paperW: number;
	paperH: number;
	labelPreset: string;
	labelW: number;
	labelH: number;
	labelCols: number;
	labelRows: number;
	labelMt: number;
	labelMl: number;
	labelHg: number;
	labelVg: number;
	fields: LabelField[];
	selectedFieldId: string | null;
	fieldIdCounter: number;
	canvasScale: number;
}

const defaultLabel = LABEL_PRESETS.label98x25;

const design = $state<DesignState>({
	paperPreset: 'a4',
	paperW: 210,
	paperH: 297,

	labelPreset: 'label98x25',
	labelW: defaultLabel.w,
	labelH: defaultLabel.h,
	labelCols: defaultLabel.cols,
	labelRows: defaultLabel.rows,
	labelMt: defaultLabel.mt,
	labelMl: defaultLabel.ml,
	labelHg: defaultLabel.hg,
	labelVg: defaultLabel.vg,

	fields: [],
	selectedFieldId: null,
	fieldIdCounter: 0,

	canvasScale: DEFAULT_SCALE
});

export function getDesign() {
	return design;
}

export function setPaperPreset(preset: string) {
	design.paperPreset = preset;
	const paperPreset = PAPER_PRESETS[preset];

	if (paperPreset) {
		design.paperW = paperPreset.w;
		design.paperH = paperPreset.h;
	}
}

export function setPaperSize(w: number, h: number) {
	design.paperW = w;
	design.paperH = h;
	design.paperPreset = 'custom';
}

export function setLabelPreset(preset: string) {
	design.labelPreset = preset;
	const labelPreset = LABEL_PRESETS[preset];

	if (labelPreset) {
		design.labelW = labelPreset.w;
		design.labelH = labelPreset.h;
		design.labelCols = labelPreset.cols;
		design.labelRows = labelPreset.rows;
		design.labelMt = labelPreset.mt;
		design.labelMl = labelPreset.ml;
		design.labelHg = labelPreset.hg;
		design.labelVg = labelPreset.vg;
	}
}

export function markPaperCustom() {
	design.paperPreset = 'custom';
}

export function markLabelCustom() {
	design.labelPreset = 'custom';
}

export function addField(type: FieldType, column: string | null): LabelField {
	const id = `field_${design.fieldIdCounter++}`;
	const labelW = design.labelW * PPMM;
	const labelH = design.labelH * PPMM;

	let field: LabelField;

	if (type === 'qr') {
		const size = Math.min(labelH * 0.75, labelW * 0.3);
		field = {
			id,
			type,
			column,
			text: '',
			x: 4,
			y: (labelH - size) / 2,
			w: size,
			h: size,
			fontSize: 10,
			fontWeight: '400',
			textAlign: 'left',
			color: '#222222',
			wrap: 'nowrap'
		};
	} else if (type === 'static') {
		field = {
			id,
			type,
			column: null,
			text: 'Label Text',
			x: 4,
			y: design.fields.length * 18,
			w: labelW * 0.6,
			h: 20,
			fontSize: 11,
			fontWeight: '400',
			textAlign: 'left',
			color: '#222222',
			wrap: 'nowrap'
		};
	} else {
		field = {
			id,
			type,
			column,
			text: '',
			x: 4,
			y: design.fields.length * 18,
			w: labelW * 0.7,
			h: 18,
			fontSize: 11,
			fontWeight: '400',
			textAlign: 'left',
			color: '#222222',
			wrap: 'nowrap'
		};
	}

	design.fields.push(field);
	design.selectedFieldId = id;
	return field;
}

export function selectField(id: string | null) {
	design.selectedFieldId = id;
}

export function getSelectedField(): LabelField | null {
	if (!design.selectedFieldId) return null;
	return design.fields.find((f) => f.id === design.selectedFieldId) ?? null;
}

export function deleteField(id: string) {
	const idx = design.fields.findIndex((f) => f.id === id);
	if (idx >= 0) {
		design.fields.splice(idx, 1);
		if (design.selectedFieldId === id) {
			design.selectedFieldId = null;
		}
	}
}

export function deleteSelected() {
	if (design.selectedFieldId) {
		deleteField(design.selectedFieldId);
	}
}

export function updateField(id: string, updates: Partial<LabelField>) {
	const field = design.fields.find((f) => f.id === id);
	if (field) {
		Object.assign(field, updates);
	}
}

export function zoomIn() {
	design.canvasScale = Math.min(5, design.canvasScale + 0.3);
}

export function zoomOut() {
	design.canvasScale = Math.max(1, design.canvasScale - 0.3);
}

export function zoomReset() {
	design.canvasScale = DEFAULT_SCALE;
}
