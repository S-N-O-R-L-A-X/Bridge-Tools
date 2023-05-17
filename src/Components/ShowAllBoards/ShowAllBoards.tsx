import ShowCards from "../ShowCards/ShowCards";
import Hand from "../../views/Deal/Hand";
import "./index.css"
interface ShowAllBoardsProps {
  all_boards: Hand[][];
  beautify?: boolean;
}

export default function ShowAllBoards(props: ShowAllBoardsProps) {
  const { all_boards, ...rest } = props;
  return (
    <div className="all-boards">
      {all_boards.map((board: Hand[], idx) => <ShowCards key={idx} all_hands={board} board_number={idx + 1} {...rest} />)}
    </div>
  )
}