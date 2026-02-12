import { read, utils, type WorkBook } from 'xlsx';

interface SpreadsheetState {
	headers: string[];
	data: Record<string, string>[];
	fileName: string | null;
	sheetNames: string[];
	selectedSheet: string | undefined;
}

let workbook: WorkBook | null = null;

const spreadsheet = $state<SpreadsheetState>({
	headers: [],
	data: [],
	fileName: null,
	sheetNames: [],
	selectedSheet: undefined
});

export function getSpreadsheet() {
	return spreadsheet;
}

export function hasSpreadsheetData(): boolean {
	return spreadsheet.headers.length > 0 && spreadsheet.data.length > 0;
}

export function openFile(buffer: ArrayBuffer, fileName: string): boolean {
	workbook = read(buffer, { type: 'array' });

	if (!workbook.SheetNames.length) {
		return false;
	}

	spreadsheet.fileName = fileName;
	spreadsheet.sheetNames = workbook.SheetNames;
	spreadsheet.selectedSheet = undefined;
	spreadsheet.headers = [];
	spreadsheet.data = [];

	if (workbook.SheetNames.length === 1) {
		selectSheet(workbook.SheetNames[0]);
	}

	return true;
}

/** Parse and select a specific sheet by name. */
export function selectSheet(name: string) {
	if (!workbook) {
		return;
	}

	const worksheet = workbook.Sheets[name];
	spreadsheet.selectedSheet = name;

	if (!worksheet) {
		spreadsheet.headers = [];
		spreadsheet.data = [];
		return;
	}

	const json = utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: '' });

	if (json.length < 2) {
		spreadsheet.headers = [];
		spreadsheet.data = [];
		return;
	}

	// First row becomes column headers (["Name", "SKU", "Price"])
	spreadsheet.headers = json[0].map((h) => String(h).trim());

	// Remaining rows are converted from arrays into keyed objects ({ Name: "Widget", SKU: "A1", Price: "9.99" })
	// Empty rows are discarded.
	// I hate this but if it's dumb, and it works, is it really dumb? Maybe. Maybe not.
	spreadsheet.data = json
		.slice(1)
		.filter((row) => row.some((cell) => String(cell).trim() !== ''))
		.map((row) => {
			const obj: Record<string, string> = {};
			spreadsheet.headers.forEach((h, i) => (obj[h] = String(row[i] ?? '').trim()));
			return obj;
		});
}

export function clear() {
	workbook = null;
	spreadsheet.headers = [];
	spreadsheet.data = [];
	spreadsheet.fileName = null;
	spreadsheet.sheetNames = [];
	spreadsheet.selectedSheet = '';
}
