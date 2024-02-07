import Board from "../../models/Board";
import Hand from "../../models/Hand";
import ShowCards from "../ShowCards/ShowCards";
import ShowTricks from "./ShowTricks";

interface PlayBoardProps {
  predictedContract?: string;
  predictedScore?: string;
  ddtricks?: string;
}

export default function MyPlayBoard(props: PlayBoardProps) {
  const { predictedContract, predictedScore, ddtricks = "*".repeat(20) } = props;
  const examples: Hand[] = [new Hand(), new Hand(), new Hand(), new Hand()];
  const B = new Board(Math.floor(Math.random() * 16));
  B.deal(examples);
  const ShowTricksInstance = <ShowTricks ddtricks={ddtricks} />

  return (
    <div>
    </div>
  )
}