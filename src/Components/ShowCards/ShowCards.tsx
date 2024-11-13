import Hand from "../../models/Hand";
import ShowOneHand from "./ShowOneHand";

import "./index.css";
import { PROGRAM_POSITIONS } from "../../Utils/maps";
import React, { PropsWithChildren, Suspense } from "react";
import { exportPBNs } from "../../Utils/PBN";
import Board from "../../models/Board";

interface ShowCardsProps extends PropsWithChildren {
  board: Board;
  dds: boolean;
  canClick?: boolean;
  beautify?: boolean;
}

const OfflineBridgeSolver = React.lazy(() => import("../../views/Analysis/OfflineBridgeSolver"))

export default function ShowCards(props: ShowCardsProps) {
  const { board, children, dds, ...rest } = props;
  const allHands = board.getAllHands();
  return (
    <div className="board-container">
      <div className="board-number"><div>{board.boardnum}</div>{dds && <button className="export" onClick={() => exportPBNs([board])}>export to PBN</button>}</div>
      <div className="predicted">{children}</div>
      {dds &&
        <div className="double-dummy">
          <Suspense fallback={<div>Loading...</div>}> <OfflineBridgeSolver board={board} /> </Suspense>
        </div>
      }

      {allHands.map((all_hand, idx) => (
        <div key={idx} className={PROGRAM_POSITIONS[idx] + "hand"}>
          <ShowOneHand position={PROGRAM_POSITIONS[idx]} hand={all_hand} {...rest}></ShowOneHand>
        </div>
      ))}
    </div>
  )
}