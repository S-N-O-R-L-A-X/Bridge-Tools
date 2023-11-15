import Hand from "../Deal/Hand";
import BridgeSolver from "./BridgeSolverOffline";

interface AllBridgeSolverOfflineProps {
  all_boards: Hand[][];
  beautify?: boolean;
}

export default function AllBridgeSolverOffline(props: AllBridgeSolverOfflineProps) {
  const { all_boards, ...rest } = props;

  return (
    <div className="all-boards">
      {all_boards.map((board: Hand[], idx) => <BridgeSolver key={idx} allHands={board} boardNumber={idx + 1} {...rest} />)}
    </div>
  )
}