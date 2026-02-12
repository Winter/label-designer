import { getDesign, type LabelField } from './design.svelte';

export interface LabelTemplate {
	name: string;
	createdAt: number;
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
}

const TEMPLATES_KEY = 'label-designer-templates';

function readStorage(): LabelTemplate[] {
	try {
		const raw = localStorage.getItem(TEMPLATES_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function persist() {
	localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

const templates = $state<LabelTemplate[]>(readStorage());
let activeTemplateIndex = $state<number | null>(null);
let activeTemplateName = $state<string | null>(null);

export function getTemplates(): LabelTemplate[] {
	return templates;
}

export function getActiveTemplateName(): string | null {
	return activeTemplateName;
}

function buildTemplate(name: string): LabelTemplate {
	const design = getDesign();
	return {
		name,
		createdAt: Date.now(),
		paperPreset: design.paperPreset,
		paperW: design.paperW,
		paperH: design.paperH,
		labelPreset: design.labelPreset,
		labelW: design.labelW,
		labelH: design.labelH,
		labelCols: design.labelCols,
		labelRows: design.labelRows,
		labelMt: design.labelMt,
		labelMl: design.labelMl,
		labelHg: design.labelHg,
		labelVg: design.labelVg,
		fields: design.fields.map((f) => ({ ...f }))
	};
}

export function saveTemplate(name: string): LabelTemplate {
	const template = buildTemplate(name);

	const isOverwrite =
		activeTemplateIndex !== null &&
		activeTemplateIndex < templates.length &&
		name === activeTemplateName;

	if (isOverwrite && activeTemplateIndex !== null) {
		templates[activeTemplateIndex] = template;
	} else {
		templates.unshift(template);
		activeTemplateIndex = 0;
	}

	persist();
	activeTemplateName = name;
	return template;
}

export function loadTemplate(template: LabelTemplate, index: number) {
	const design = getDesign();
	design.paperPreset = template.paperPreset;
	design.paperW = template.paperW;
	design.paperH = template.paperH;
	design.labelPreset = template.labelPreset;
	design.labelW = template.labelW;
	design.labelH = template.labelH;
	design.labelCols = template.labelCols;
	design.labelRows = template.labelRows;
	design.labelMt = template.labelMt;
	design.labelMl = template.labelMl;
	design.labelHg = template.labelHg;
	design.labelVg = template.labelVg;
	design.fields = template.fields.map((f) => ({ ...f }));
	design.selectedFieldId = null;
	activeTemplateIndex = index;
	activeTemplateName = template.name;
}

export function exportTemplates() {
	const json = JSON.stringify(templates, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'label-templates.json';
	a.click();
	URL.revokeObjectURL(url);
}

export function importTemplates(file: File): Promise<number> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const imported = JSON.parse(reader.result as string);
				if (!Array.isArray(imported)) {
					return reject(new Error('Invalid template file.'));
				}

				templates.unshift(...imported);
				persist();
				resolve(imported.length);
			} catch {
				reject(new Error('Could not parse template file.'));
			}
		};
		reader.onerror = () => reject(new Error('Could not read file.'));
		reader.readAsText(file);
	});
}

export function deleteTemplate(index: number) {
	templates.splice(index, 1);
	persist();

	if (activeTemplateIndex === index) {
		activeTemplateIndex = null;
		activeTemplateName = null;
	} else if (activeTemplateIndex !== null && activeTemplateIndex > index) {
		activeTemplateIndex--;
	}
}
