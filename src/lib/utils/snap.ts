export interface SnapGuide {
	axis: 'x' | 'y';
	position: number;
}

export interface SnapResult {
	x: number;
	y: number;
	guides: SnapGuide[];
}

export interface ResizeSnapResult {
	w: number;
	h: number;
	guides: SnapGuide[];
}

/** Snap threshold in design-coordinate pixels (~12.5 screen px at default 2.5x zoom) */
export const SNAP_THRESHOLD = 5;

interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
}

function getAnchorsX(box: Box): number[] {
	return [box.x, box.x + box.w / 2, box.x + box.w];
}

function getAnchorsY(box: Box): number[] {
	return [box.y, box.y + box.h / 2, box.y + box.h];
}

export function computeSnap(
	dragged: Box,
	others: Box[],
	canvasW: number,
	canvasH: number
): SnapResult {
	// Collect all target anchor values
	const targetX: number[] = [canvasW / 2];
	const targetY: number[] = [canvasH / 2];

	for (const other of others) {
		targetX.push(other.x, other.x + other.w / 2, other.x + other.w);
		targetY.push(other.y, other.y + other.h / 2, other.y + other.h);
	}

	// Find best snap offset for X axis
	const dragAnchorsX = getAnchorsX(dragged);
	let bestDx = Infinity;

	for (const da of dragAnchorsX) {
		for (const tv of targetX) {
			const dx = tv - da;
			if (Math.abs(dx) < Math.abs(bestDx) && Math.abs(dx) < SNAP_THRESHOLD) {
				bestDx = dx;
			}
		}
	}

	let snapX = dragged.x;
	if (Math.abs(bestDx) < SNAP_THRESHOLD) {
		snapX = dragged.x + bestDx;
	}

	// Find best snap offset for Y axis
	const dragAnchorsY = getAnchorsY(dragged);
	let bestDy = Infinity;

	for (const da of dragAnchorsY) {
		for (const tv of targetY) {
			const dy = tv - da;
			if (Math.abs(dy) < Math.abs(bestDy) && Math.abs(dy) < SNAP_THRESHOLD) {
				bestDy = dy;
			}
		}
	}

	let snapY = dragged.y;
	if (Math.abs(bestDy) < SNAP_THRESHOLD) {
		snapY = dragged.y + bestDy;
	}

	// Collect active guides at snapped position
	const guides: SnapGuide[] = [];
	const snappedAnchorsX = [snapX, snapX + dragged.w / 2, snapX + dragged.w];
	const snappedAnchorsY = [snapY, snapY + dragged.h / 2, snapY + dragged.h];

	const guideXSet = new Set<number>();
	for (const sa of snappedAnchorsX) {
		for (const tv of targetX) {
			if (Math.abs(sa - tv) < 0.5) guideXSet.add(tv);
		}
	}
	for (const pos of guideXSet) {
		guides.push({ axis: 'x', position: pos });
	}

	const guideYSet = new Set<number>();
	for (const sa of snappedAnchorsY) {
		for (const tv of targetY) {
			if (Math.abs(sa - tv) < 0.5) guideYSet.add(tv);
		}
	}
	for (const pos of guideYSet) {
		guides.push({ axis: 'y', position: pos });
	}

	return { x: snapX, y: snapY, guides };
}

export function computeSnapForResize(
	field: Box,
	others: Box[],
	canvasW: number,
	canvasH: number
): ResizeSnapResult {
	const targetX: number[] = [canvasW / 2];
	const targetY: number[] = [canvasH / 2];

	for (const other of others) {
		targetX.push(other.x, other.x + other.w / 2, other.x + other.w);
		targetY.push(other.y, other.y + other.h / 2, other.y + other.h);
	}

	// Snap right edge and center-x
	const rightEdge = field.x + field.w;
	let bestDx = Infinity;

	for (const tv of targetX) {
		const distRight = tv - rightEdge;
		if (Math.abs(distRight) < Math.abs(bestDx) && Math.abs(distRight) < SNAP_THRESHOLD) {
			bestDx = distRight;
		}

		// Center-x snap: adjusting w so center aligns with target
		const dxForCenter = (tv - field.x) * 2 - field.w;
		if (Math.abs(dxForCenter) < Math.abs(bestDx) && Math.abs(dxForCenter) < SNAP_THRESHOLD) {
			bestDx = dxForCenter;
		}
	}

	let snappedW = field.w;
	if (Math.abs(bestDx) < SNAP_THRESHOLD) {
		snappedW = field.w + bestDx;
	}

	// Snap bottom edge and center-y
	const bottomEdge = field.y + field.h;
	let bestDy = Infinity;

	for (const tv of targetY) {
		const distBottom = tv - bottomEdge;
		if (Math.abs(distBottom) < Math.abs(bestDy) && Math.abs(distBottom) < SNAP_THRESHOLD) {
			bestDy = distBottom;
		}
		const dyForCenter = (tv - field.y) * 2 - field.h;
		if (Math.abs(dyForCenter) < Math.abs(bestDy) && Math.abs(dyForCenter) < SNAP_THRESHOLD) {
			bestDy = dyForCenter;
		}
	}

	let snappedH = field.h;
	if (Math.abs(bestDy) < SNAP_THRESHOLD) {
		snappedH = field.h + bestDy;
	}

	// Collect active guides
	const guides: SnapGuide[] = [];
	const snapped = { x: field.x, y: field.y, w: snappedW, h: snappedH };
	const anchorsX = getAnchorsX(snapped);
	const anchorsY = getAnchorsY(snapped);

	const guideXSet = new Set<number>();
	for (const a of anchorsX) {
		for (const tv of targetX) {
			if (Math.abs(a - tv) < 0.5) guideXSet.add(tv);
		}
	}
	for (const pos of guideXSet) {
		guides.push({ axis: 'x', position: pos });
	}

	const guideYSet = new Set<number>();
	for (const a of anchorsY) {
		for (const tv of targetY) {
			if (Math.abs(a - tv) < 0.5) guideYSet.add(tv);
		}
	}
	for (const pos of guideYSet) {
		guides.push({ axis: 'y', position: pos });
	}

	return { w: snappedW, h: snappedH, guides };
}
