import { useEffect, useState } from "react";
import ShowTricks from "../../Components/PlayBoard/ShowTricks";
import { analyzeOffline } from "../../Utils/utils";
import Board from "../../models/Board";

interface BridgeSolverProps {
	board: Board;
}

export default function OfflineBridgeSolver(props: BridgeSolverProps) {
	const { board } = props;
	const [ddtricks, setDDtricks] = useState<(string | number)[][]>();
	const [isCalculating, setIsCalculating] = useState(false);

	useEffect(() => {
		if (board.ddsTricks) {
			setDDtricks(board.ddsTricks);
			return;
		}

		setIsCalculating(true);
		analyzeOffline(board).then((res) => {
			board.ddsTricks = res;
			setDDtricks(res);
			setIsCalculating(false);
		});
	}, [board]);

	if (isCalculating) {
		return <div style={{ padding: '10px', color: '#666' }}>计算中...</div>;
	}

	return (
		<ShowTricks ddtricks={ddtricks} />
	)

}