import { createContext } from "react";
import ShowAllBoards from "../../Components/ShowAllBoards/ShowAllBoards";
import Hand from "../../models/Hand";
import Analysis from "../Analysis/Analysis";

export interface CompleteBoard {
	board: Hand[];
	ddtricks?: (string | number)[][] | string;
}

interface ShowResultsProps {
	all_boards: CompleteBoard[];
	dds: boolean;
	beautify?: boolean;
}

interface ShowResultsContextProps {
	all_boards: CompleteBoard[];
	dds: boolean;
}

export const ShowResultsContext = createContext<ShowResultsContextProps>({ all_boards: [], dds: false });

function ShowResults(props: ShowResultsProps) {
	const { all_boards, dds, ...rest } = props;
	return (
		<ShowResultsContext.Provider value={{ all_boards, dds }}>
			{dds && <Analysis />}
			<ShowAllBoards {...rest} />
		</ShowResultsContext.Provider>
	)
}

export default ShowResults;