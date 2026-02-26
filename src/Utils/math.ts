import Board from "../models/Board";
import { ColorsShort, COLORS, Position } from "./maps";

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
