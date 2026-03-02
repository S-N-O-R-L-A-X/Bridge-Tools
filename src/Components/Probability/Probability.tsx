import "./Probability.css";
import CardProbability from "./CardProbability";
import SuitProbability from "./SuitProbability";
import Board from "../../models/Board";

export default function Probability({ boards }: { boards: Board[] }) {
	return (
		<div className="probability-container">
			<SuitProbability boards={boards} />
			<CardProbability boards={boards} />
		</div>
	);
}

