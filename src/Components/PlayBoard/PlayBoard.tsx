import Board from "../../views/Deal/Board";
import Hand from "../../views/Deal/Hand";
import ShowCards from "../ShowCards/ShowCards";
import ShowTricks from "./ShowTricks";

import "./PlayBoard.css";

interface PlayBoardProps {
  predictedContract?: string;
  predictedScore?: string;
  ddtricks?: string;
}

export default function PlayBoard(props: PlayBoardProps) {
  const { predictedContract, predictedScore, ddtricks = "*".repeat(20) } = props;
  const examples: Hand[] = [new Hand(), new Hand(), new Hand(), new Hand()];
  const B = new Board(Math.floor(Math.random() * 16));
  B.deal(examples);
  const ShowTricksInstance = <ShowTricks ddtricks={ddtricks} />

  return (
    <div>
      <iframe id="bridgeweb-board" name="myiframe" src="https://dds.bridgewebs.com/bridgesolver/upload.htm" style={{ "display": "block" }}></iframe>
      {/* <ShowCards all_hands={examples} board_number={1} doubleDummy={ShowTricksInstance} canClick>
        <p>{predictedContract}</p>
        <p>{predictedScore}</p>
      </ShowCards> */}
    </div>
  )
}