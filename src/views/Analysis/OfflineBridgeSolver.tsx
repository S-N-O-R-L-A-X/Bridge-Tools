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

	useEffect(() => {
		if (!board.ddsTricks) {
			analyzeOffline(board).then((res) => {
				board.ddsTricks = res;
			})
		}
		setDDtricks(board.ddsTricks);
	}, [board]);

	return (
		<ShowTricks ddtricks={ddtricks} />
	)

}