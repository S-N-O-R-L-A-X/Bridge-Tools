import Hand from "../../views/Deal/Hand";
import ShowCards from "../ShowCards/ShowCards";

interface PlayBoardProps {
  predictedContract?: string;
  predictedScore?: string;
}

export default function PlayBoard(props: PlayBoardProps) {
  const { predictedContract, predictedScore } = props;
  const examples: Hand[] = [new Hand(), new Hand(), new Hand(), new Hand()];
  return (
    <div>
      <ShowCards all_hands={examples} board_number={1} >
        <p>{predictedContract}</p>
        <p>{predictedScore}</p>
      </ShowCards>
    </div>
  )
}