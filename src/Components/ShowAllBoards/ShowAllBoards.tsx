import ShowCards from "../ShowCards/ShowCards";
import "./index.css"
import { CompleteBoard, ShowResultsContext } from "../../views/Show/ShowResults";

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
            {context.all_boards.map((board: CompleteBoard, idx: number) => <ShowCards key={idx} all_hands={board.board} board_number={idx + 1} dds={dds} {...rest} />)}
          </div>
        )
      }
    </ShowResultsContext.Consumer>
  )
}