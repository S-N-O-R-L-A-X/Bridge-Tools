import { COLORS, NUMBER2COLORICON, PROGRAM_POSITIONS } from "../../Utils/maps";
import { calculateSuitProbabilities, formatProbability } from "../../Utils/math";
import Board from "../../models/Board";

interface SuitProbabilityProps {
	boards: Board[];
}

export default function SuitProbability({ boards }: SuitProbabilityProps) {
	const probabilities = calculateSuitProbabilities(boards);

	return (
		<div className="suit-probability">
			<h3>花色分布概率 (共{boards.length}副)</h3>
			<table className="prob-table">
				<thead>
					<tr>
						<th>位置</th>
						{COLORS.map((suit) => (
							<th key={suit}>{NUMBER2COLORICON[COLORS.indexOf(suit) as 0 | 1 | 2 | 3]}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{PROGRAM_POSITIONS.map((position) => (
						<tr key={position}>
							<td className="position-cell">{position}</td>
							{COLORS.map((suit) => (
								<td key={suit}>
									<SuitProbCell probs={probabilities[position][suit]} />
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

interface SuitProbCellProps {
	probs: Record<number, number>;
}

function SuitProbCell({ probs }: SuitProbCellProps) {
	const entries = Object.entries(probs)
		.map(([count, prob]) => ({ count: Number(count), prob }))
		// .filter((e) => e.prob > 0.001) // 只显示概率大于0.1%的
		.sort((a, b) => b.prob - a.prob); // 按概率降序排列

	if (entries.length === 0) {
		return <span>-</span>;
	}

	return (
		<div className="prob-cell">
			{entries.map(({ count, prob }) => (
				<div key={count} className="prob-item">
					<span className="count">{count}张:</span>
					<span className="prob">{formatProbability(prob)}</span>
				</div>
			))}
		</div>
	);
}
