import Hand from "../../models/Hand";
import ShowOneHand from "./ShowOneHand";

import "./index.css";
import { PROGRAM_POSITIONS } from "../../Utils/maps";
import React, { PropsWithChildren, Suspense } from "react";
import exportPBN from "../../Utils/PBN";

interface ShowCardsProps extends PropsWithChildren {
  all_hands: Hand[];
  board_number: number;
  dds: boolean;
  canClick?: boolean;
  beautify?: boolean;
}

const OfflineBridgeSolver = React.lazy(() => import("../../views/Analysis/OfflineBridgeSolver"))

export default function ShowCards(props: ShowCardsProps) {
  const { all_hands, board_number, children, dds, ...rest } = props;
  return (
    <div className="board-container">
      <div className="board-number"><div>{board_number}</div>{dds && <button className="export" onClick={() => exportPBN(all_hands, board_number)}>export to PBN</button>}</div>
      <div className="predicted">{children}</div>
      {dds &&
        <div className="double-dummy">
          <Suspense fallback={<div>Loading...</div>}> <OfflineBridgeSolver allHands={all_hands} /> </Suspense>
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