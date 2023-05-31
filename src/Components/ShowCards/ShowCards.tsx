import Hand from "../../views/Deal/Hand";
import ShowOneHand from "./ShowOneHand";

import "./index.css";
import { PROGRAM_POSITIONS } from "../../Utils/maps";
import { PropsWithChildren, ReactNode } from "react";

interface ShowCardsProps extends PropsWithChildren {
  all_hands: Hand[];
  board_number: number;
  doubleDummy?: ReactNode;
}

export default function ShowCards(props: ShowCardsProps) {
  const { all_hands, board_number, children, doubleDummy, ...rest } = props;
  return (
    <div className="board-container">
      <div className="board-number">{board_number}</div>
      <div className="predicted">{children}</div>
      <div className="double-dummy">{doubleDummy}</div>
      {all_hands.map((all_hand, idx) => (
        <div className={PROGRAM_POSITIONS[idx] + "hand"}>
          <ShowOneHand position={PROGRAM_POSITIONS[idx]} hand={all_hand} {...rest}></ShowOneHand>
        </div>
      ))}
    </div>
  )
}