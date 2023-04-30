import Hand from "../../views/Deal/Hand";
import { NUMBER2COLOR, POSITION2FULL } from "../../Utils/maps";
interface ShowOneHandProps {
  hand: Hand;
  position: "N" | "E" | "S" | "W";
}

export default function ShowOneHand(props: ShowOneHandProps) {

  const { hand, position } = props;
  let className = POSITION2FULL[position];

  return (
    <div>
      {hand.show().map((suit: string, index: number) => <div className={className + NUMBER2COLOR[index]}> {suit}</div>)}
    </div >
  )
}