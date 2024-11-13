import ShowCards from "../ShowCards/ShowCards";
import "./index.css"
import { ShowResultsContext } from "../../views/Show/ShowResults";
import { PropsWithChildren } from "react";
import Board from "../../models/Board";

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
            {context.all_boards.map((board: Board, idx: number) => <ShowCards key={idx} board={board} dds={context.dds} {...props} />)}
          </div>
        )
      }
    </ShowResultsContext.Consumer>
  )
}