import { useEffect, useState } from "react";
import ShowTricks from "../../Components/PlayBoard/ShowTricks";
import Hand from "../../models/Hand";
import { analyzeOffline } from "../../Utils/utils";

interface BridgeSolverProps {
	allHands?: Hand[];
}

export default function OfflineBridgeSolver(props: BridgeSolverProps) {
	const { allHands = [] } = props;
	const [ddtricks, setDDtricks] = useState<(string | number)[][]>();

	useEffect(() => {
		analyzeOffline(allHands).then((res) => {
			setDDtricks(res);
		})
	}, [allHands]);

	return (
		<ShowTricks ddtricks={ddtricks} />
	)

}