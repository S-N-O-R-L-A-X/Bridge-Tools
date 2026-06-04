// Web Worker for dealing cards
// This runs in a separate thread to avoid blocking the UI

import Board from "../models/Board";
import Hand from "../models/Hand";
import handFilter, { OneFilterProps } from "../models/HandFilter";
import Card from "../models/Card";
import { ColorsShort } from "../Utils/maps";

// Serializable types for transferring data between main thread and worker
interface CardData {
	suit: ColorsShort;
	rank: string;
}

interface HandData {
	cards: CardData[];
	hand: { [key: string]: string[] };
	points: number;
	shape: { [key: string]: number };
}

interface BoardData {
	boardnum: number;
	vul: string;
	dealer: string;
	Nhand: HandData;
	Shand: HandData;
	Ehand: HandData;
	Whand: HandData;
}

interface DealMessage {
	boardSize: number;
	filters: Record<string, OneFilterProps>;
}

// Convert Hand to serializable data
function serializeHand(hand: Hand): HandData {
	return {
		cards: hand.cards.map(c => ({ suit: c.suit, rank: c.rank })),
		hand: hand.hand,
		points: hand.points,
		shape: hand.shape
	};
}

// Convert Board to serializable data
function serializeBoard(board: Board): BoardData {
	return {
		boardnum: board.boardnum,
		vul: board.vul,
		dealer: board.dealer,
		Nhand: serializeHand(board.Nhand),
		Shand: serializeHand(board.Shand),
		Ehand: serializeHand(board.Ehand),
		Whand: serializeHand(board.Whand)
	};
}

// Convert CardData back to Card (for filters with known cards)
function deserializeCards(cards?: CardData[]): Card[] | undefined {
	if (!cards) return undefined;
	return cards.map(c => new Card(c.suit, c.rank));
}

function deal(boardSize: number, filters: Record<string, OneFilterProps>): BoardData[] {
	const boards: BoardData[] = [];
	const MAX_ATTEMPTS = 100000;

	for (let boardNum = 1; boardNum <= boardSize; ++boardNum) {
		let attempts = 0;

		while (attempts < MAX_ATTEMPTS) {
			attempts++;

			const board = new Board(boardNum);
			const players: Hand[] = [new Hand(), new Hand(), new Hand(), new Hand()];

			// Build fixed cards from filter
			let known_cards: Record<string, Card[]> | undefined = undefined;
			const { N, S, E, W } = filters;

			if (N?.cards || S?.cards || E?.cards || W?.cards) {
				known_cards = {};
				const nCards = deserializeCards(N?.cards as CardData[] | undefined);
				const sCards = deserializeCards(S?.cards as CardData[] | undefined);
				const eCards = deserializeCards(E?.cards as CardData[] | undefined);
				const wCards = deserializeCards(W?.cards as CardData[] | undefined);
				if (nCards) known_cards["N"] = nCards;
				if (sCards) known_cards["S"] = sCards;
				if (eCards) known_cards["E"] = eCards;
				if (wCards) known_cards["W"] = wCards;
			}

			board.deal(players, known_cards);

			// Build filter props with actual Hand objects
			const filterProps = {
				"N": filters["N"] ? { hand: players[0], ...filters["N"] } : undefined,
				"S": filters["S"] ? { hand: players[1], ...filters["S"] } : undefined,
				"E": filters["E"] ? { hand: players[2], ...filters["E"] } : undefined,
				"W": filters["W"] ? { hand: players[3], ...filters["W"] } : undefined,
			};

			if (handFilter(filterProps as any)) {
				boards.push(serializeBoard(board));

				// Report progress every 10 boards or at the end
				if (boardNum % 10 === 0 || boardNum === boardSize) {
					self.postMessage({ type: 'progress', current: boardNum, total: boardSize });
				}
				break;
			}
		}

		if (attempts >= MAX_ATTEMPTS) {
			self.postMessage({ type: 'error', message: `无法在 ${MAX_ATTEMPTS} 次尝试内找到符合条件的第 ${boardNum} 副牌` });
			return boards;
		}
	}

	return boards;
}

self.onmessage = (e: MessageEvent<DealMessage>) => {
	const { boardSize, filters } = e.data;

	try {
		const boards = deal(boardSize, filters);
		self.postMessage({ type: 'complete', boards });
	} catch (error) {
		self.postMessage({ type: 'error', message: String(error) });
	}
};
