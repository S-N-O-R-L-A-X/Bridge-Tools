// Web Worker for DDS (Double Dummy) calculations
// This runs in a separate thread to avoid blocking the UI

export {}; // Make this a module

interface DDSCalculateMessage {
	pbn: string;
	boardId: string;
}

// Import the DDS script
// Note: calcDDTable will be available globally after the script loads
const loadDDS = new Promise<void>((resolve) => {
	// @ts-ignore
	self.importScripts('/dds.js');
	resolve();
});

// Cache for DDS results
const ddsCache = new Map<string, any>();

// Format DDS result table
function formatDDTable(res: any): (string | number)[][] {
	const table = new Array(4).fill(0).map(() => new Array(5).fill("*"));
	table[0][0] = res["N"]["N"];
	table[0][1] = res["S"]["N"];
	table[0][2] = res["H"]["N"];
	table[0][3] = res["D"]["N"];
	table[0][4] = res["C"]["N"];
	table[1][0] = res["N"]["S"];
	table[1][1] = res["S"]["S"];
	table[1][2] = res["H"]["S"];
	table[1][3] = res["D"]["S"];
	table[1][4] = res["C"]["S"];
	table[2][0] = res["N"]["E"];
	table[2][1] = res["S"]["E"];
	table[2][2] = res["H"]["E"];
	table[2][3] = res["D"]["E"];
	table[2][4] = res["C"]["E"];
	table[3][0] = res["N"]["W"];
	table[3][1] = res["S"]["W"];
	table[3][2] = res["H"]["W"];
	table[3][3] = res["D"]["W"];
	table[3][4] = res["C"]["W"];
	return table;
}

self.onmessage = async (e: MessageEvent<DDSCalculateMessage>) => {
	const { pbn, boardId } = e.data;

	try {
		// Wait for DDS to load
		await loadDDS;

		// Check cache first
		if (ddsCache.has(pbn)) {
			const cached = ddsCache.get(pbn);
			self.postMessage({
				type: 'success',
				boardId,
				ddtricks: cached,
				fromCache: true
			});
			return;
		}

		// @ts-ignore - calcDDTable is a global function from WASM
		const res = calcDDTable(pbn);
		const table = formatDDTable(res);
		
		// Cache the result
		ddsCache.set(pbn, table);

		self.postMessage({
			type: 'success',
			boardId,
			ddtricks: table,
			fromCache: false
		});
	} catch (error) {
		self.postMessage({
			type: 'error',
			boardId,
			error: String(error)
		});
	}
};