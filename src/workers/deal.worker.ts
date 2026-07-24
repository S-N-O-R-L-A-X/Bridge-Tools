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

// Compute binomial coefficient C(n, k)
function binom(n: number, k: number): number {
	if (k < 0 || k > n) return 0;
	if (k === 0 || k === n) return 1;
	let result = 1;
	for (let i = 1; i <= k; i++) {
		result = result * (n - k + i) / i;
	}
	return result;
}

// Compute natural probability weight for a shape distribution
// Weight = number of distinct card deals that produce this shape distribution
// For each suit, iterates over constrained players computing C(remaining, shape[suit])
function computeDistributionWeight(distribution: Array<{ S: number; H: number; D: number; C: number } | null>): number {
	const suits: ('S' | 'H' | 'D' | 'C')[] = ['S', 'H', 'D', 'C'];
	let weight = 1;
	for (const suit of suits) {
		let remaining = 13;
		for (const shape of distribution) {
			if (shape) {
				weight *= binom(remaining, shape[suit]);
				remaining -= shape[suit];
			}
		}
	}
	return weight;
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
// Returns shape specifications for each player; null means "deal randomly"
function generateGlobalShapeDistribution(filters: Record<string, OneFilterProps>, fixed_cards?: { [key: string]: Card[] }): Array<Array<{ S: number; H: number; D: number; C: number } | null>> {
	const players = ["N", "S", "E", "W"];
	const allPlayerShapes: Array<Array<{ S: number; H: number; D: number; C: number }>> = [];
	const hasConstraints: boolean[] = [false, false, false, false];
	const minRequiredShapes: Array<{ S: number; H: number; D: number; C: number }> = [{ S: 0, H: 0, D: 0, C: 0 }, { S: 0, H: 0, D: 0, C: 0 }, { S: 0, H: 0, D: 0, C: 0 }, { S: 0, H: 0, D: 0, C: 0 }];

	// Calculate minimum required cards from fixed cards
	if (fixed_cards) {
		for (const player in fixed_cards) {
			const playerIdx = players.indexOf(player);
			if (playerIdx !== -1) {
				const knownCards = fixed_cards[player];
				for (const card of knownCards) {
					minRequiredShapes[playerIdx][card.suit]++;
				}
			}
		}
	}

	// Generate valid shapes for each player with constraints
	for (let i = 0; i < 4; i++) {
		const player = players[i];
		const filter = filters[player];
		const minShape = minRequiredShapes[i];

		if (filter?.ambiguousShape) {
			const shapes = generateValidShapes(filter.ambiguousShape);
			// Filter shapes that are compatible with fixed cards
			const validShapes = shapes.filter(shape =>
				shape.S >= minShape.S && shape.H >= minShape.H &&
				shape.D >= minShape.D && shape.C >= minShape.C
			);

			if (validShapes.length === 0) {
				return []; // No valid shapes for this player considering fixed cards
			}
			allPlayerShapes.push(validShapes);
			hasConstraints[i] = true;
		} else if (filter?.shapes) {
			// Fixed shape constraint
			const [s, h, d, c] = filter.shapes;
			if (s + h + d + c !== 13) {
				return []; // Invalid fixed shape
			}
			// Check if fixed shape is compatible with fixed cards
			if (s < minShape.S || h < minShape.H || d < minShape.D || c < minShape.C) {
				return []; // Fixed shape conflicts with fixed cards
			}
			allPlayerShapes.push([{ S: s, H: h, D: d, C: c }]);
			hasConstraints[i] = true;
		} else {
			allPlayerShapes.push([]);
			hasConstraints[i] = false;
		}
	}

	const validDistributions: Array<Array<{ S: number; H: number; D: number; C: number } | null>> = [];

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
		// 2 players have constraints - only enumerate the constrained pair
		const constrainedIndices = [0, 1, 2, 3].filter(i => hasConstraints[i]);

		for (let shape0 of allPlayerShapes[constrainedIndices[0]]) {
			for (let shape1 of allPlayerShapes[constrainedIndices[1]]) {
				// Check that constrained players' suits don't exceed 13 globally
				if (shape0.S + shape1.S > 13 || shape0.H + shape1.H > 13 ||
					shape0.D + shape1.D > 13 || shape0.C + shape1.C > 13) {
					continue;
				}
				const result: Array<{ S: number; H: number; D: number; C: number } | null> = [null, null, null, null];
				result[constrainedIndices[0]] = shape0;
				result[constrainedIndices[1]] = shape1;
				validDistributions.push(result);
			}
		}
	} else if (constrainedPlayers === 1) {
		// Only 1 player has constraint - just enumerate that player's valid shapes
		const constrainedIdx = hasConstraints.indexOf(true);

		for (let shape of allPlayerShapes[constrainedIdx]) {
			const result: Array<{ S: number; H: number; D: number; C: number } | null> = [null, null, null, null];
			result[constrainedIdx] = shape;
			validDistributions.push(result);
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
// targetShapes entries can be null for players without shape constraints (dealt randomly)
function constrainedDeal(hands: Hand[], fixed_cards?: { [key: string]: Card[] }, targetShapes?: Array<{ S: number; H: number; D: number; C: number } | null>): boolean {
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

	// Group remaining cards by suit for constrained dealing
	const cardsBySuit: { [key: string]: Card[] } = { S: [], H: [], D: [], C: [] };
	for (const card of allCards) {
		cardsBySuit[card.suit].push(card);
	}

	// Track which players have been dealt
	const dealt = [false, false, false, false];

	// Deal according to target shapes for constrained players
	if (targetShapes) {
		for (let playerIdx = 0; playerIdx < 4; playerIdx++) {
			const shape = targetShapes[playerIdx];
			if (!shape) continue; // null means no shape constraint, deal randomly later

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
				const suitCards = cardsBySuit[suit];

				if (suitCards.length < needed) {
					return false; // Not enough cards of this suit
				}

				// Take cards from the end of the suit array
				for (let i = 0; i < needed; i++) {
					hand.add(suitCards.pop()!);
				}
			}

			dealt[playerIdx] = true;
		}
	}

	// Collect remaining cards from all suits into a single pool
	const remainingCards: Card[] = [];
	for (const suit of Card.SUIT) {
		remainingCards.push(...cardsBySuit[suit]);
	}
	shuffleArray(remainingCards);

	// Deal remaining cards randomly to players without shape constraints
	for (let playerIdx = 0; playerIdx < 4; playerIdx++) {
		if (dealt[playerIdx]) continue;

		const hand = hands[playerIdx];
		const playerName = ["N", "S", "E", "W"][playerIdx];

		if (fixed_cards?.[playerName]) {
			hand.addCards(fixed_cards[playerName]);
		}

		const cardsNeeded = 13 - hand.cards.length;
		if (remainingCards.length < cardsNeeded) {
			return false;
		}
		for (let i = 0; i < cardsNeeded; i++) {
			hand.add(remainingCards.pop()!);
		}

		dealt[playerIdx] = true;
	}

	return true;
}

// Check if filters have shape constraints (either ambiguousShape or fixed shapes)
function hasShapeConstraints(filters: Record<string, OneFilterProps>): boolean {
	return Object.values(filters).some(f => f?.ambiguousShape !== undefined || f?.shapes !== undefined);
}

// Main optimized deal function
function deal(boardSize: number, filters: Record<string, OneFilterProps>): BoardData[] {
	console.log(filters);
	const boards: BoardData[] = [];
	const MAX_ATTEMPTS = 100000;

	// Pre-calculate valid shape distributions if shape constraints are present
	const useConstrainedDealing = hasShapeConstraints(filters);
	let validShapeDistributions: Array<Array<{ S: number; H: number; D: number; C: number } | null>> = [];

	// Build fixed cards from filter for constraint checking
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

	if (useConstrainedDealing) {
		validShapeDistributions = generateGlobalShapeDistribution(filters, known_cards);
		if (validShapeDistributions.length === 0) {
			self.postMessage({ type: 'error', message: '没有找到符合模糊牌型约束的有效牌型分布，请检查约束条件是否合理' });
			return boards;
		}
	}

	// Pre-compute natural probability weights for weighted random selection
	const distributionWeights = useConstrainedDealing
		? validShapeDistributions.map(d => computeDistributionWeight(d))
		: [];
	// Normalize to prevent floating point issues with extreme weights
	let normalizedWeights: number[] = [];
	let totalNormalizedWeight = 0;
	if (distributionWeights.length > 0) {
		const maxW = Math.max(...distributionWeights);
		normalizedWeights = distributionWeights.map(w => w / maxW);
		totalNormalizedWeight = normalizedWeights.reduce((a, b) => a + b, 0);
	}

	for (let boardNum = 1; boardNum <= boardSize; ++boardNum) {
		let attempts = 0;
		let success = false;

		while (attempts < MAX_ATTEMPTS && !success) {
			attempts++;

			const board = new Board(boardNum);
			const players: Hand[] = [new Hand(), new Hand(), new Hand(), new Hand()];

			// Use constrained dealing if we have ambiguous shapes
			if (useConstrainedDealing) {
				// Weighted random selection by natural probability
				let r = Math.random() * totalNormalizedWeight;
				let targetShapes: typeof validShapeDistributions[number] | null = null;
				for (let i = 0; i < normalizedWeights.length; i++) {
					r -= normalizedWeights[i];
					if (r <= 0) {
						targetShapes = validShapeDistributions[i]!;
						break;
					}
				}
				if (!targetShapes) {
					targetShapes = validShapeDistributions[validShapeDistributions.length - 1]!;
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
