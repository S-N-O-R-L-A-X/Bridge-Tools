import { useEffect, useState } from "react";
import ShowTricks from "../../Components/PlayBoard/ShowTricks";
import ShowCards from "../../Components/ShowCards/ShowCards";
import Hand from "../Deal/Hand";
import { parseHand } from "../../Utils/utils";

interface BridgeSolverProps {
	allHands?: Hand[];
	boardNumber?: number;
}

function convertAllHandsToPBN(allHands: Hand[]) {
	let str = "N:";
	str += parseHand(allHands[0]) + " " + parseHand(allHands[2]) + " " + parseHand(allHands[1]) + " " + parseHand(allHands[3]);
	console.log(str);
	return str;
}

export default function BridgeSolver(props: BridgeSolverProps) {
	const { allHands = [], boardNumber = 1 } = props;
	const [ddtricks, setDDtricks] = useState<(string | number)[][]>();

	async function analyzeOffline() {
		const res = calcDDTable(convertAllHandsToPBN(allHands));
		const table = new Array(4).fill(0).map(() => new Array(5).fill("*"));
		table[0][0] = res["N"]["N"];
		table[0][1] = res["S"]["N"];
		table[0][2] = res["H"]["N"];
		table[0][3] = res["D"]["N"];
		table[0][4] = res["C"]["N"];
		table[1][0] = res["N"]["S"];
		table[1][1] = res["S"]["S"];
		table[1][2] = res["H"]["S"];
		table[1][3] = res["D"]["S"];
		table[1][4] = res["C"]["S"];
		table[2][0] = res["N"]["E"];
		table[2][1] = res["S"]["E"];
		table[2][2] = res["H"]["E"];
		table[2][3] = res["D"]["E"];
		table[2][4] = res["C"]["E"];
		table[3][0] = res["N"]["W"];
		table[3][1] = res["S"]["W"];
		table[3][2] = res["H"]["W"];
		table[3][3] = res["D"]["W"];
		table[3][4] = res["C"]["W"];

		setDDtricks(table);
		console.log(res);
	}

	useEffect(() => {
		analyzeOffline();
	}, [allHands]);

	const ShowTricksInstance = <ShowTricks ddtricks={ddtricks} />;

	return (
		<>
			<ShowCards all_hands={allHands} board_number={boardNumber} doubleDummy={ShowTricksInstance} />
		</>
	)

}