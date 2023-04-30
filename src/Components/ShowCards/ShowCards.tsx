import Hand from "../../views/Deal/Hand";

import ShowOneHand from "./ShowOneHand";

import "./index.css";

interface ShowCardsProps {
  all_hands: Hand[];
}

export default function ShowCards(props: ShowCardsProps) {
  const { all_hands } = props;
  const [Nhand, Shand, Whand, Ehand] = all_hands;
  return (
    <div className="board-container">
      <div className="Nhand">
        <ShowOneHand position="N" hand={Nhand}></ShowOneHand>
      </div>
      <div className="Shand">
        <ShowOneHand position="S" hand={Shand}></ShowOneHand>
      </div>
      <div className="Whand">
        <ShowOneHand position="W" hand={Whand}></ShowOneHand>
      </div>
      <div className="Ehand">
        <ShowOneHand position="E" hand={Ehand}></ShowOneHand>
      </div>
    </div>
  )
}