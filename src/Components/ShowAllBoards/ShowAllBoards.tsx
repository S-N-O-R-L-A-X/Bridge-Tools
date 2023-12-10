import ShowCards from "../ShowCards/ShowCards";
import Hand from "../../views/Deal/Hand";
import "./index.css"
import { ShowResultsContext } from "../../views/Show/ShowResults";

interface ShowAllBoardsProps {
  dds: boolean;
}

export default function ShowAllBoards(props: ShowAllBoardsProps) {
  const { dds, ...rest } = props;
  return (
    <ShowResultsContext.Consumer>
      {
        (context) =>
        (
          <div className="all-boards">
            {context.all_boards.map((board: Hand[], idx: number) => <ShowCards key={idx} all_hands={board} board_number={idx + 1} dds={dds} {...rest} />)}
          </div>
        )
      }
    </ShowResultsContext.Consumer>
  )
}