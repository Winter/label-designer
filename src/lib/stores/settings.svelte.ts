const SETTINGS_KEY = 'label-designer-settings';

interface Settings {
	showGrid: boolean;
	smartGuides: boolean;
}

const defaults: Settings = {
	showGrid: true,
	smartGuides: true
};

function readStorage(): Settings {
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
	} catch {
		return { ...defaults };
	}
}

const settings = $state<Settings>(readStorage());

$effect.root(() => {
	$effect(() => {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify($state.snapshot(settings)));
	});
});

export function getSettings() {
	return settings;
}
