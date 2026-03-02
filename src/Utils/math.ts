import Board from "../models/Board";
import Hand from "../models/Hand";
import { ColorsShort, COLORS, Position, RANK } from "./maps";

/**
* 根据发出的牌局统计每家持有各花色特定张数的概率
* @param boards 发出的牌局数组
* @returns 概率表 { position: { suit: { count: probability } } }
*/
export function calculateSuitProbabilities(
	boards: Board[]
): Record<Position, Record<ColorsShort, Record<number, number>>> {
	const totalBoards = boards.length;

	// 结果概率表：统计每个位置每个花色各张数出现的次数
	const counts: Record<Position, Record<ColorsShort, Record<number, number>>> = {
		N: { S: {}, H: {}, D: {}, C: {} },
		S: { S: {}, H: {}, D: {}, C: {} },
		E: { S: {}, H: {}, D: {}, C: {} },
		W: { S: {}, H: {}, D: {}, C: {} },
	};

	// 遍历每副牌
	boards.forEach((board) => {
		const hands: Record<Position, Record<ColorsShort, number>> = {
			N: board.Nhand.shape as Record<ColorsShort, number>,
			S: board.Shand.shape as Record<ColorsShort, number>,
			E: board.Ehand.shape as Record<ColorsShort, number>,
			W: board.Whand.shape as Record<ColorsShort, number>,
		};

		// 统计每家每花色的张数
		(["N", "S", "E", "W"] as Position[]).forEach((position) => {
			COLORS.forEach((suit) => {
				const count = hands[position][suit];
				counts[position][suit][count] = (counts[position][suit][count] || 0) + 1;
			});
		});
	});

	// 转换为概率
	const result: Record<Position, Record<ColorsShort, Record<number, number>>> = {
		N: { S: {}, H: {}, D: {}, C: {} },
		S: { S: {}, H: {}, D: {}, C: {} },
		E: { S: {}, H: {}, D: {}, C: {} },
		W: { S: {}, H: {}, D: {}, C: {} },
	};

	if (totalBoards > 0) {
		(["N", "S", "E", "W"] as Position[]).forEach((position) => {
			COLORS.forEach((suit) => {
				Object.entries(counts[position][suit]).forEach(([count, num]) => {
					result[position][suit][Number(count)] = num / totalBoards;
				});
			});
		});
	}

	return result;
}

/**
* 格式化概率为百分比字符串
*/
export function formatProbability(prob: number): string {
	return (prob * 100).toFixed(1) + "%";
}

/**
* 根据发出的牌局统计某张牌在各家出现的概率
* @param boards 发出的牌局数组
* @returns 概率表 { cardKey: { position: probability } }
* cardKey 格式为 "花色-点数"，如 "S-A" 表示黑桃A
*/
export function calculateCardProbabilities(
	boards: Board[]
): Record<string, Record<Position, number>> {
	const totalBoards = boards.length;

	// 结果概率表：统计每张牌在每个位置出现的次数
	const counts: Record<string, Record<Position, number>> = {};

	// 初始化所有52张牌的计数
	COLORS.forEach((suit) => {
		Object.keys(RANK).forEach((rank) => {
			const cardKey = `${suit}-${rank}`;
			counts[cardKey] = { N: 0, S: 0, E: 0, W: 0 };
		});
	});

	// 遍历每副牌
	boards.forEach((board) => {
		const hands: Record<Position, Hand> = {
			N: board.Nhand,
			S: board.Shand,
			E: board.Ehand,
			W: board.Whand,
		};

		// 统计每张牌在哪一家
		(["N", "S", "E", "W"] as Position[]).forEach((position) => {
			const hand = hands[position];
			hand.cards.forEach((card) => {
				const cardKey = `${card.suit}-${card.rank}`;
				counts[cardKey][position]++;
			});
		});
	});

	// 转换为概率
	const result: Record<string, Record<Position, number>> = {};

	if (totalBoards > 0) {
		Object.entries(counts).forEach(([cardKey, positionCounts]) => {
			result[cardKey] = {
				N: positionCounts.N / totalBoards,
				S: positionCounts.S / totalBoards,
				E: positionCounts.E / totalBoards,
				W: positionCounts.W / totalBoards,
			};
		});
	}

	return result;
}
