import ShowCards from "../ShowCards/ShowCards";
import Hand from "../../views/Deal/Hand";

interface ShowAllBoardsProps {
  all_boards: Hand[][];
}

export default function ShowAllBoards(props: ShowAllBoardsProps) {
  const { all_boards } = props;
  return (
    <>
      {all_boards.map((board: Hand[], key) => <ShowCards key={key} all_hands={board} />)}
    </>
  )
}