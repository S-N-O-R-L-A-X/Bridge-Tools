import Hand from "../../views/Deal/Hand";
import ShowCards from "../ShowCards/ShowCards";
import ShowTricks from "./ShowTricks";

interface PlayBoardProps {
  predictedContract?: string;
  predictedScore?: string;
  ddtricks?: string;
}

export default function PlayBoard(props: PlayBoardProps) {
  const { predictedContract, predictedScore, ddtricks = "*".repeat(20) } = props;
  const examples: Hand[] = [new Hand(), new Hand(), new Hand(), new Hand()];

  const ShowTricksInstance = <ShowTricks ddtricks={ddtricks} />

  return (
    <div>
      <ShowCards all_hands={examples} board_number={1} doubleDummy={ShowTricksInstance}>
        <p>{predictedContract}</p>
        <p>{predictedScore}</p>
      </ShowCards>
    </div>
  )
}