<script lang="ts">
	import { goto } from '$app/navigation';
	import { hasSpreadsheetData } from '$lib/stores/spreadsheet.svelte';
	import LeftSidebar from '$lib/components/design/left-sidebar.svelte';
	import Canvas from '$lib/components/design/canvas.svelte';
	import RightSidebar from '$lib/components/design/right-sidebar.svelte';

	if (!hasSpreadsheetData()) {
		goto('/', { replaceState: true });
	}
</script>

<div class="flex h-full">
	<LeftSidebar />
	<Canvas />
	<RightSidebar />
</div>
