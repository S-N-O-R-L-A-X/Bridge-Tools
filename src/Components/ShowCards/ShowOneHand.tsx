import Hand from "../../views/Deal/Hand";
import { HTMLAttributes } from "react"
import { NUMBER2COLOR, POSITION2FULL } from "../../Utils/maps";
interface ShowOneHandProps extends HTMLAttributes<HTMLElement> {
  hand: Hand;
  position: "N" | "E" | "S" | "W";
}

export default function ShowOneHand(props: ShowOneHandProps) {

  const { hand, position } = props;
  let className = POSITION2FULL[position];

  return (
    <>
      {hand.show().map((suit: string, index: number) => <div key={index} className={className + NUMBER2COLOR[index]}> {suit}</div>)}
    </>
  )
}