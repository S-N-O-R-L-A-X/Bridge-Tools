import { createContext } from "react";
import ShowAllBoards from "../../Components/ShowAllBoards/ShowAllBoards";
import Hand from "../Deal/Hand";
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
}

export const ShowResultsContext = createContext<ShowResultsContextProps>({ all_boards: [] });

export default function ShowResults(props: ShowResultsProps) {
	const { all_boards, ...rest } = props;
	return (
		<ShowResultsContext.Provider value={{ all_boards }}>
			<Analysis />
			<ShowAllBoards {...rest} />
		</ShowResultsContext.Provider>
	)
}