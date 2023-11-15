import ShowCards from "../ShowCards/ShowCards";
import Hand from "../../views/Deal/Hand";
import "./index.css"
import BridgeSolver from "../../views/Analysis/BridgeSolverOffline";
interface ShowAllBoardsProps {
  all_boards: Hand[][];
  dds?: boolean;
  beautify?: boolean;
}

export default function ShowAllBoards(props: ShowAllBoardsProps) {
  const { all_boards, dds, ...rest } = props;
  return (
    <div className="all-boards">
      {all_boards.map((board: Hand[], idx) => dds ? <BridgeSolver key={idx} allHands={board} boardNumber={idx + 1} {...rest} /> : <ShowCards key={idx} all_hands={board} board_number={idx + 1} {...rest} />)}
    </div>
  )
}