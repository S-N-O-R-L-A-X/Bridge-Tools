// Manager for optimized DDS calculations
// Uses chunking and yield points to avoid UI blocking

import Board from "../models/Board";
import { convertAllHandsToPBN } from "./PBN";

// Global reference to calcDDTable (will be available after dds.js loads)
declare const calcDDTable: (pbn: string) => any;

// Cache for DDS results
const ddsCache = new Map<string, (string | number)[][]>();

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

// Yield control to the event loop to keep UI responsive
async function yieldToUI(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0));
}

// Check if DDS is available
function isDDSAvailable(): boolean {
	// @ts-ignore
	return typeof calcDDTable === 'function';
}

// Optimized calculation with chunking
export async function analyzeOffline(board: Board): Promise<(string | number)[][]> {
	// Check if already calculated
	if (board.ddsTricks) {
		return board.ddsTricks as (string | number)[][];
	}

	const pbn = convertAllHandsToPBN(board.getAllHands());

	// Check cache first
	if (ddsCache.has(pbn)) {
		const cached = ddsCache.get(pbn);
		if (cached) {
			board.ddsTricks = cached;
			return cached;
		}
	}

	// Wait a moment to let UI update
	await yieldToUI();

	// Perform calculation
	if (!isDDSAvailable()) {
		throw new Error('DDS library not loaded');
	}

	// @ts-ignore
	const res = calcDDTable(pbn);
	const table = formatDDTable(res);

	// Cache the result
	ddsCache.set(pbn, table);
	board.ddsTricks = table;

	return table;
}

// Parallel batch processing for multiple boards
export async function analyzeBatch(boards: Board[]): Promise<void> {
	const BATCH_SIZE = 10;
	
	for (let i = 0; i < boards.length; i += BATCH_SIZE) {
		const batch = boards.slice(i, Math.min(i + BATCH_SIZE, boards.length));
		
		// Process batch in parallel
		await Promise.all(batch.map(board => analyzeOffline(board)));
		
		// Yield between batches
		await yieldToUI();
	}
}

// Clear cache (optional utility)
export function clearDDSCache(): void {
	ddsCache.clear();
}