import Hand from "../../views/Deal/Hand";
import ShowOneHand from "./ShowOneHand";

import "./index.css";
import { PROGRAM_POSITIONS } from "../../Utils/maps";
import { PropsWithChildren } from "react";
import OfflineBridgeSolver from "../../views/Analysis/OfflineBridgeSolver";

interface ShowCardsProps extends PropsWithChildren {
  all_hands: Hand[];
  board_number: number;
  dds: boolean;
  canClick?: boolean;
}

export default function ShowCards(props: ShowCardsProps) {
  const { all_hands, board_number, children, dds, ...rest } = props;
  return (
    <div className="board-container">
      <div className="board-number">{board_number}</div>
      <div className="predicted">{children}</div>
      {dds &&
        <div className="double-dummy">
          <OfflineBridgeSolver allHands={all_hands} />
        </div>
      }

      {all_hands.map((all_hand, idx) => (
        <div key={idx} className={PROGRAM_POSITIONS[idx] + "hand"}>
          <ShowOneHand position={PROGRAM_POSITIONS[idx]} hand={all_hand} {...rest}></ShowOneHand>
        </div>
      ))}
    </div>
  )
}