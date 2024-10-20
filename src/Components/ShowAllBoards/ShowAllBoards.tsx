import ShowCards from "../ShowCards/ShowCards";
import "./index.css"
import { CompleteBoard, ShowResultsContext } from "../../views/Show/ShowResults";
import { PropsWithChildren } from "react";

interface ShowAllBoardsProps extends PropsWithChildren {
  beautify?: boolean;
}

export default function ShowAllBoards(props: ShowAllBoardsProps) {

  return (
    <ShowResultsContext.Consumer>
      {
        (context) =>
        (
          <div className="all-boards">
            {context.all_boards.map((board: CompleteBoard, idx: number) => <ShowCards key={idx} board={board.board} dds={context.dds} {...props} />)}
          </div>
        )
      }
    </ShowResultsContext.Consumer>
  )
}