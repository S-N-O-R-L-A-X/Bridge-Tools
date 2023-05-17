import Hand from "../../views/Deal/Hand";
import ShowOneHand from "./ShowOneHand";

import "./index.css";
import { PROGRAM_POSITIONS } from "../../Utils/maps";

interface ShowCardsProps {
  all_hands: Hand[];
  board_number: number;
}

export default function ShowCards(props: ShowCardsProps) {
  const { all_hands, board_number, ...rest } = props;
  return (
    <div className="board-container">
      <div className="board-number">{board_number}</div>
      {all_hands.map((all_hand, idx) => (
        <div className={PROGRAM_POSITIONS[idx] + "hand"}>
          <ShowOneHand position={PROGRAM_POSITIONS[idx]} hand={all_hand} {...rest}></ShowOneHand>
        </div>
      ))}
    </div>
  )
}