import { useState } from "react";
import Board from "../../models/Board";
import { COLORS, NUMBER2COLORICON, PROGRAM_POSITIONS, RANK2CARD, ColorsShort } from "../../Utils/maps";
import { calculateCardProbabilities, formatProbability } from "../../Utils/math";

interface CardProbabilityProps {
	boards: Board[];
}

export default function CardProbability({ boards }: CardProbabilityProps) {
	const [selectedSuit, setSelectedSuit] = useState<ColorsShort>("S");
	const [selectedRank, setSelectedRank] = useState<string>("A");

	const probabilities = calculateCardProbabilities(boards);
	const cardKey = `${selectedSuit}-${selectedRank}`;
	const cardProbs = probabilities[cardKey] || { N: 0, S: 0, E: 0, W: 0 };

	return (
		<div className="card-probability">
			<h3>单张牌概率 (共{boards.length}副)</h3>
			<div className="card-selector">
				<div className="selector-group">
					<label>花色：</label>
					<div className="suit-buttons">
						{COLORS.map((suit, idx) => (
							<button
								key={suit}
								className={`suit-btn ${selectedSuit === suit ? "active" : ""}`}
								onClick={() => setSelectedSuit(suit)}
							>
								{NUMBER2COLORICON[idx as 0 | 1 | 2 | 3]}
							</button>
						))}
					</div>
				</div>
				<div className="selector-group">
					<label>点数：</label>
					<div className="rank-buttons">
						{RANK2CARD.map((rank) => (
							<button
								key={rank}
								className={`rank-btn ${selectedRank === rank ? "active" : ""}`}
								onClick={() => setSelectedRank(rank)}
							>
								{rank}
							</button>
						))}
					</div>
				</div>
			</div>
			<div className="selected-card">
				选中：{NUMBER2COLORICON[COLORS.indexOf(selectedSuit) as 0 | 1 | 2 | 3]}{selectedRank}
			</div>
			<table className="prob-table card-prob-table">
				<thead>
					<tr>
						<th>位置</th>
						<th>概率</th>
					</tr>
				</thead>
				<tbody>
					{PROGRAM_POSITIONS.map((position) => (
						<tr key={position}>
							<td className="position-cell">{position}</td>
							<td>
								<span className="prob">{formatProbability(cardProbs[position])}</span>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
