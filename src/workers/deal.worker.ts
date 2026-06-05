// Web Worker for dealing cards
// This runs in a separate thread to avoid blocking the UI

import Board from "../models/Board";
import Hand from "../models/Hand";
import handFilter, { OneFilterProps, HandFilterProps } from "../models/HandFilter";
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

// Generate all valid shape distributions for a player given ambiguousShape constraints
function generateValidShapes(ambiguousShape: number[][]): Array<{ S: number; H: number; D: number; C: number }> {
	const [[minSpades, maxSpades], [minHearts, maxHearts], [minDiamonds, maxDiamonds], [minClubs, maxClubs]] = ambiguousShape;
	const validShapes: Array<{ S: number; H: number; D: number; C: number }> = [];

	for (let s = minSpades; s <= maxSpades; s++) {
		for (let h = minHearts; h <= maxHearts; h++) {
			for (let d = minDiamonds; d <= maxDiamonds; d++) {
				const c = 13 - s - h - d;
				if (c >= minClubs && c <= maxClubs) {
					validShapes.push({ S: s, H: h, D: d, C: c });
				}
			}
		}
	}

	return validShapes;
}

// Generate valid shape distribution for all players that respects total card count
function generateGlobalShapeDistribution(filters: Record<string, OneFilterProps>): Array<Array<{ S: number; H: number; D: number; C: number }> | null> {
	const players = ["N", "S", "E", "W"];
	const allPlayerShapes: Array<Array<{ S: number; H: number; D: number; C: number }>> = [];
	const hasConstraints: boolean[] = [false, false, false, false];

	// Generate valid shapes for each player with constraints
	for (let i = 0; i < 4; i++) {
		const player = players[i];
		const filter = filters[player];
		if (filter?.ambiguousShape) {
			const shapes = generateValidShapes(filter.ambiguousShape);
			if (shapes.length === 0) {
				return []; // No valid shapes for this player
			}
			allPlayerShapes.push(shapes);
			hasConstraints[i] = true;
		} else if (filter?.shapes) {
			// Fixed shape constraint
			const [s, h, d, c] = filter.shapes;
			if (s + h + d + c !== 13) {
				return []; // Invalid fixed shape
			}
			allPlayerShapes.push([{ S: s, H: h, D: d, C: c }]);
			hasConstraints[i] = true;
		} else {
			allPlayerShapes.push([]);
			hasConstraints[i] = false;
		}
	}

	const validDistributions: Array<Array<{ S: number; H: number; D: number; C: number }> | null> = [];

	// If no constraints at all, return empty (will use random dealing)
	if (!hasConstraints.some(Boolean)) {
		return [];
	}

	// Count players with constraints
	const constrainedPlayers = hasConstraints.filter(Boolean).length;

	if (constrainedPlayers === 4) {
		// All players have constraints - find combinations
		for (let nShape of allPlayerShapes[0]) {
			for (let sShape of allPlayerShapes[1]) {
				for (let eShape of allPlayerShapes[2]) {
					for (let wShape of allPlayerShapes[3]) {
						if (nShape.S + sShape.S + eShape.S + wShape.S === 13 &&
							nShape.H + sShape.H + eShape.H + wShape.H === 13 &&
							nShape.D + sShape.D + eShape.D + wShape.D === 13 &&
							nShape.C + sShape.C + eShape.C + wShape.C === 13) {
							validDistributions.push([nShape, sShape, eShape, wShape]);
						}
					}
				}
			}
		}
	} else if (constrainedPlayers === 3) {
		// 3 players have constraints - calculate the 4th
		const freePlayerIdx = hasConstraints.indexOf(false);
		const constrainedIndices = [0, 1, 2, 3].filter(i => i !== freePlayerIdx);

		for (let shape0 of allPlayerShapes[constrainedIndices[0]]) {
			for (let shape1 of allPlayerShapes[constrainedIndices[1]]) {
				for (let shape2 of allPlayerShapes[constrainedIndices[2]]) {
					const constrainedShapes = [shape0, shape1, shape2];
					const freeShape = {
						S: 13 - (constrainedShapes[0].S + constrainedShapes[1].S + constrainedShapes[2].S),
						H: 13 - (constrainedShapes[0].H + constrainedShapes[1].H + constrainedShapes[2].H),
						D: 13 - (constrainedShapes[0].D + constrainedShapes[1].D + constrainedShapes[2].D),
						C: 13 - (constrainedShapes[0].C + constrainedShapes[1].C + constrainedShapes[2].C)
					};
					
					// Check if free shape is valid
					if (freeShape.S >= 0 && freeShape.H >= 0 && freeShape.D >= 0 && freeShape.C >= 0 &&
						freeShape.S + freeShape.H + freeShape.D + freeShape.C === 13) {
						const result: Array<{ S: number; H: number; D: number; C: number }> = [{} as any, {} as any, {} as any, {} as any];
						result[constrainedIndices[0]] = constrainedShapes[0];
						result[constrainedIndices[1]] = constrainedShapes[1];
						result[constrainedIndices[2]] = constrainedShapes[2];
						result[freePlayerIdx] = freeShape;
						validDistributions.push(result);
					}
				}
			}
		}
	} else if (constrainedPlayers === 2) {
		// 2 players have constraints - handle as pairs
		const constrainedIndices = [0, 1, 2, 3].filter(i => hasConstraints[i]);
		const freeIndices = [0, 1, 2, 3].filter(i => !hasConstraints[i]);

		for (let shape0 of allPlayerShapes[constrainedIndices[0]]) {
			for (let shape1 of allPlayerShapes[constrainedIndices[1]]) {
				const constrainedShapes = [shape0, shape1];
				
				// Calculate remaining cards for free players
				const remainingS = 13 - (constrainedShapes[0].S + constrainedShapes[1].S);
				const remainingH = 13 - (constrainedShapes[0].H + constrainedShapes[1].H);
				const remainingD = 13 - (constrainedShapes[0].D + constrainedShapes[1].D);
				const remainingC = 13 - (constrainedShapes[0].C + constrainedShapes[1].C);

				// Generate all valid splits for the two free players
				for (let s1 = Math.max(0, remainingS - 13); s1 <= Math.min(13, remainingS); s1++) {
					const s2 = remainingS - s1;
					if (s2 < 0 || s2 > 13) continue;

					for (let h1 = Math.max(0, remainingH - 13); h1 <= Math.min(13, remainingH); h1++) {
						const h2 = remainingH - h1;
						if (h2 < 0 || h2 > 13) continue;

						for (let d1 = Math.max(0, remainingD - 13); d1 <= Math.min(13, remainingD); d1++) {
							const d2 = remainingD - d1;
							if (d2 < 0 || d2 > 13) continue;

							const c1 = 13 - s1 - h1 - d1;
							const c2 = 13 - s2 - h2 - d2;

							if (c1 === remainingC - c2 && c1 >= 0 && c1 <= 13 && c2 >= 0 && c2 <= 13) {
								const result: Array<{ S: number; H: number; D: number; C: number }> = [{} as any, {} as any, {} as any, {} as any];
								result[constrainedIndices[0]] = constrainedShapes[0];
								result[constrainedIndices[1]] = constrainedShapes[1];
								result[freeIndices[0]] = { S: s1, H: h1, D: d1, C: c1 };
								result[freeIndices[1]] = { S: s2, H: h2, D: d2, C: c2 };
								validDistributions.push(result);
							}
						}
					}
				}
			}
		}
	} else if (constrainedPlayers === 1) {
		// Only 1 player has constraint - simpler case
		const constrainedIdx = hasConstraints.indexOf(true);
		const freeIndices = [0, 1, 2, 3].filter(i => i !== constrainedIdx);

		for (let shape of allPlayerShapes[constrainedIdx]) {
			const remainingS = 13 - shape.S;
			const remainingH = 13 - shape.H;
			const remainingD = 13 - shape.D;
			const remainingC = 13 - shape.C;

			// Generate valid distributions for 3 free players
			// This is still expensive, but we only do it once upfront
			for (let s1 = Math.max(0, remainingS - 26); s1 <= Math.min(13, remainingS); s1++) {
				for (let s2 = Math.max(0, remainingS - s1 - 13); s2 <= Math.min(13, remainingS - s1); s2++) {
					const s3 = remainingS - s1 - s2;
					if (s3 < 0 || s3 > 13) continue;

					for (let h1 = Math.max(0, remainingH - 26); h1 <= Math.min(13, remainingH); h1++) {
						for (let h2 = Math.max(0, remainingH - h1 - 13); h2 <= Math.min(13, remainingH - h1); h2++) {
							const h3 = remainingH - h1 - h2;
							if (h3 < 0 || h3 > 13) continue;

							for (let d1 = Math.max(0, remainingD - 26); d1 <= Math.min(13, remainingD); d1++) {
								for (let d2 = Math.max(0, remainingD - d1 - 13); d2 <= Math.min(13, remainingD - d1); d2++) {
									const d3 = remainingD - d1 - d2;
									if (d3 < 0 || d3 > 13) continue;

									const c1 = 13 - s1 - h1 - d1;
									const c2 = 13 - s2 - h2 - d2;
									const c3 = 13 - s3 - h3 - d3;

									if (c1 >= 0 && c1 <= 13 && c2 >= 0 && c2 <= 13 && c3 >= 0 && c3 <= 13 &&
										c1 + c2 + c3 === remainingC) {
										const result: Array<{ S: number; H: number; D: number; C: number }> = [{} as any, {} as any, {} as any, {} as any];
										result[constrainedIdx] = shape;
										result[freeIndices[0]] = { S: s1, H: h1, D: d1, C: c1 };
										result[freeIndices[1]] = { S: s2, H: h2, D: d2, C: c2 };
										result[freeIndices[2]] = { S: s3, H: h3, D: d3, C: c3 };
										validDistributions.push(result);
									}
								}
							}
						}
					}
				}
			}
		}
	}

	return validDistributions;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(arr: T[]): void {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
}

// Constrained dealing algorithm - generates cards based on shape constraints
function constrainedDeal(hands: Hand[], fixed_cards?: { [key: string]: Card[] }, targetShapes?: Array<{ S: number; H: number; D: number; C: number }>): boolean {
	// Create card pool
	const allCards: Card[] = [];
	for (const suit of Card.SUIT) {
		for (const rank in Card.RANK) {
			allCards.push(new Card(suit, rank));
		}
	}

	// Remove fixed cards from pool
	if (fixed_cards) {
		for (const player in fixed_cards) {
			const knownCards = fixed_cards[player];
			for (const knownCard of knownCards) {
				const idx = allCards.findIndex(c => c.suit === knownCard.suit && c.rank === knownCard.rank);
				if (idx !== -1) {
					allCards.splice(idx, 1);
				}
			}
		}
	}

	// Shuffle remaining cards
	shuffleArray(allCards);

	// Deal according to target shapes if provided
	if (targetShapes) {
		for (let playerIdx = 0; playerIdx < 4; playerIdx++) {
			const shape = targetShapes[playerIdx];
			const hand = hands[playerIdx];

			// Add fixed cards first
			const playerName = ["N", "S", "E", "W"][playerIdx];
			if (fixed_cards?.[playerName]) {
				hand.addCards(fixed_cards[playerName]);
			}

			// Count cards already in hand from fixed cards
			const currentShape = { S: hand.shape.S, H: hand.shape.H, D: hand.shape.D, C: hand.shape.C };

			// Deal cards according to shape requirements
			for (const suit of Card.SUIT) {
				const needed = shape[suit] - currentShape[suit];
				for (let i = 0; i < needed; i++) {
					const cardIdx = allCards.findIndex(c => c.suit === suit);
					if (cardIdx !== -1) {
						hand.add(allCards.splice(cardIdx, 1)[0]);
					} else {
						return false; // Not enough cards of this suit
					}
				}
			}
		}
	} else {
		// Random deal for remaining cards
		for (let playerIdx = 0; playerIdx < 4; playerIdx++) {
			const hand = hands[playerIdx];
			const playerName = ["N", "S", "E", "W"][playerIdx];
			
			if (fixed_cards?.[playerName]) {
				hand.addCards(fixed_cards[playerName]);
			}

			const cardsNeeded = 13 - hand.cards.length;
			for (let i = 0; i < cardsNeeded; i++) {
				if (allCards.length > 0) {
					hand.add(allCards.pop()!);
				}
			}
		}
	}

	return true;
}

// Check if filters have shape constraints (either ambiguousShape or fixed shapes)
function hasShapeConstraints(filters: Record<string, OneFilterProps>): boolean {
	return Object.values(filters).some(f => f?.ambiguousShape !== undefined || f?.shapes !== undefined);
}

// Main optimized deal function
function deal(boardSize: number, filters: Record<string, OneFilterProps>): BoardData[] {
	const boards: BoardData[] = [];
	const MAX_ATTEMPTS = 100000;
	
	// Pre-calculate valid shape distributions if shape constraints are present
	const useConstrainedDealing = hasShapeConstraints(filters);
	let validShapeDistributions: Array<Array<{ S: number; H: number; D: number; C: number }> | null> = [];
	
	if (useConstrainedDealing) {
		validShapeDistributions = generateGlobalShapeDistribution(filters);
		if (validShapeDistributions.length === 0) {
			self.postMessage({ type: 'error', message: '没有找到符合模糊牌型约束的有效牌型分布，请检查约束条件是否合理' });
			return boards;
		}
	}

	for (let boardNum = 1; boardNum <= boardSize; ++boardNum) {
		let attempts = 0;
		let success = false;

		while (attempts < MAX_ATTEMPTS && !success) {
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

			// Use constrained dealing if we have ambiguous shapes
			if (useConstrainedDealing) {
				// Pick a random valid shape distribution
				const targetShapes = validShapeDistributions[Math.floor(Math.random() * validShapeDistributions.length)]!;
				if (!targetShapes) {
					continue;
				}
				
				const dealSuccess = constrainedDeal(players, known_cards, targetShapes);
				if (!dealSuccess) {
					continue;
				}
			} else {
				// Fall back to original dealing for simple cases
				board.deal(players, known_cards);
			}

			// Build filter props with actual Hand objects
			const filterProps = {
				"N": filters["N"] ? { hand: players[0], ...filters["N"] } : undefined,
				"S": filters["S"] ? { hand: players[1], ...filters["S"] } : undefined,
				"E": filters["E"] ? { hand: players[2], ...filters["E"] } : undefined,
				"W": filters["W"] ? { hand: players[3], ...filters["W"] } : undefined,
			};

			if (handFilter(filterProps as any)) {
				// Save the hands to board
				[board.Nhand, board.Shand, board.Ehand, board.Whand] = players;
				boards.push(serializeBoard(board));

				// Report progress every 10 boards or at the end
				if (boardNum % 10 === 0 || boardNum === boardSize) {
					self.postMessage({ type: 'progress', current: boardNum, total: boardSize });
				}
				success = true;
			}
		}

		if (!success) {
			self.postMessage({ type: 'error', message: `无法在 ${MAX_ATTEMPTS} 次尝试内找到符合条件的第 ${boardNum} 副牌` });
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
