import { createContext } from "react";
import ShowAllBoards from "../../Components/ShowAllBoards/ShowAllBoards";
import Hand from "../Deal/Hand";

interface ShowResultsProps {
	all_boards: Hand[][];
	dds: boolean;
	beautify?: boolean;
}

interface ShowResultsContextProps {
	all_boards: Hand[][];
}

export const ShowResultsContext = createContext<ShowResultsContextProps>({ all_boards: [] });

export default function ShowResults(props: ShowResultsProps) {
	const { all_boards, ...rest } = props;
	return (
		<ShowResultsContext.Provider value={{all_boards}}>
			<ShowAllBoards {...rest} />
		</ShowResultsContext.Provider>
	)
}