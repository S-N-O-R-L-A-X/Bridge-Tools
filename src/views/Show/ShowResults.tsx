import { createContext } from "react";
import ShowAllBoards from "../../Components/ShowAllBoards/ShowAllBoards";
import Analysis from "../Analysis/Analysis";
import Board from "../../models/Board";

interface ShowResultsProps {
	all_boards: Board[];
	dds: boolean;
	beautify?: boolean;
}

interface ShowResultsContextProps {
	all_boards: Board[];
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