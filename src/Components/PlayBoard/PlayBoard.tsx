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
  const tricks = [];
  for (let i = 0; i < 4; ++i) {
    const player_trick = [];
    for (let j = 0; j < 5; ++j) {
      player_trick.push(ddtricks[i * 4 + j]);
    }
    tricks.push(player_trick);
  }

  const ShowTricksInstance = <ShowTricks tricks={tricks} />

  return (
    <div>
      <ShowCards all_hands={examples} board_number={1} doubleDummy={ShowTricksInstance}>
        <p>{predictedContract}</p>
        <p>{predictedScore}</p>
      </ShowCards>
    </div>
  )
}