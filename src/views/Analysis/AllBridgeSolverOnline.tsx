import Hand from "../Deal/Hand";
import BridgeSolver from "./BridgeSolverOnline";

interface AllBridgeSolverOnlineProps {
  all_boards: Hand[][];
  beautify?: boolean;
}

export default function AllBridgeSolverOnline(props: AllBridgeSolverOnlineProps) {
  const { all_boards, ...rest } = props;
  return (
    <div className="all-boards">
      {all_boards.map((board: Hand[], idx) => <BridgeSolver key={idx} allHands={board} boardNumber={idx + 1} {...rest} />)}
    </div>
  )
}