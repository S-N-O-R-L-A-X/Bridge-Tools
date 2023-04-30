import Hand from "../../views/Deal/Hand";

import ShowOneHand from "./ShowOneHand";
interface ShowCardsProps {
  all_hands: Hand[];
}

export default function ShowCards(props: ShowCardsProps) {
  const { all_hands } = props;
  const [Nhand, Shand, Whand, Ehand] = all_hands;
  return (
    <div className="board-container">
      <ShowOneHand position="N" hand={Nhand}></ShowOneHand>
    </div>
  )
}